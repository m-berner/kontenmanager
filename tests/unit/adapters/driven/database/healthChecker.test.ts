/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createDatabaseHealthService} from "@/adapters/driven/database/healthChecker";
import type {RepositoryFactoryContract} from "@/adapters/driven/database/repositories/repositoryFactory";
import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

describe("DatabaseHealthService", () => {
    let repos: {
        accounts: { findAll: ReturnType<typeof vi.fn> };
        bookings: { findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
        bookingTypes: { findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
        stocks: { findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
    };
    let repositoryFactory: RepositoryFactoryContract;
    let transactionManager: TransactionManagerContract;

    beforeEach(() => {
        repos = {
            accounts: {findAll: vi.fn().mockResolvedValue([{cID: 1}, {cID: 2}])},
            bookings: {findAll: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(undefined)},
            bookingTypes: {findAll: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(undefined)},
            stocks: {findAll: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(undefined)}
        };

        repositoryFactory = {
            getRepository: vi.fn(),
            getAllRepositories: vi.fn().mockReturnValue(repos),
            clearCache: vi.fn()
        } as unknown as RepositoryFactoryContract;

        transactionManager = {
            execute: vi.fn().mockImplementation((_stores, _mode, operation) => operation({} as IDBTransaction)),
            executeMultiple: vi.fn()
        } as unknown as TransactionManagerContract;
    });

    // Bookings now carry cBookingTypeID and cStockID in these fixtures because
    // the health check surveys all THREE foreign keys, through the shared
    // `findReferentialIssues` that the import validator and the export path also
    // use. It used to derive orphans from `cAccountNumberID` alone, so it
    // reported `healthy: true` for a database `validateDataIntegrity` would
    // refuse to import — see the dangling-cStockID test below.
    it("reports healthy with no issues when every record references a valid account", async () => {
        repos.bookings.findAll.mockResolvedValue([
            {cID: 10, cAccountNumberID: 1, cBookingTypeID: 30, cStockID: 20}
        ]);
        repos.stocks.findAll.mockResolvedValue([{cID: 20, cAccountNumberID: 2}]);
        repos.bookingTypes.findAll.mockResolvedValue([{cID: 30, cAccountNumberID: 1}]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.performHealthCheck();

        expect(result.healthy).toBe(true);
        expect(result.issues).toEqual([]);
        expect(result.stats.orphanedBookings).toBe(0);
    });

    it("detects orphaned bookings, stocks, and booking types referencing a deleted account", async () => {
        repos.bookings.findAll.mockResolvedValue([
            {cID: 10, cAccountNumberID: 1, cBookingTypeID: 30, cStockID: 20},
            {cID: 11, cAccountNumberID: 99, cBookingTypeID: 30, cStockID: 20}
        ]);
        repos.stocks.findAll.mockResolvedValue([{cID: 20, cAccountNumberID: 99}]);
        repos.bookingTypes.findAll.mockResolvedValue([{cID: 30, cAccountNumberID: 99}]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.performHealthCheck();

        expect(result.healthy).toBe(false);
        expect(result.stats.orphanedBookings).toBe(1);
        expect(result.stats.orphanedStocks).toBe(1);
        expect(result.stats.orphanedBookingTypes).toBe(1);
        expect(result.issues).toHaveLength(3);
        expect(result.issues.map((i) => i.store).sort()).toEqual(
            ["bookingTypes", "bookings", "stocks"].sort()
        );
    });

    // The reason the three integrity checks were consolidated. Deleting a stock
    // that still had bookings produced exactly this state, and it passed the
    // health check AND the export consistency check while the *import* validator
    // rejected it — so the app wrote a backup file it would later refuse to
    // restore, discovered at the worst possible moment.
    it("detects a booking referencing a stock that no longer exists", async () => {
        repos.bookings.findAll.mockResolvedValue([
            {cID: 10, cAccountNumberID: 1, cBookingTypeID: 30, cStockID: 404}
        ]);
        repos.stocks.findAll.mockResolvedValue([{cID: 20, cAccountNumberID: 1}]);
        repos.bookingTypes.findAll.mockResolvedValue([{cID: 30, cAccountNumberID: 1}]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.performHealthCheck();

        expect(result.healthy).toBe(false);
        expect(result.stats.danglingStockReferences).toBe(1);
        // Not "orphaned_records": fixIssues repairs those by DELETING the rows,
        // and a booking whose stock was removed still holds real amounts the
        // user entered. Reported for a human to decide, never auto-deleted.
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe("invalid_references");
    });

    // cStockID 0 is the "no stock" sentinel every non-depot booking carries, not
    // a reference — checking it would report every ordinary booking as broken.
    it("treats cStockID 0 as 'no stock' rather than a dangling reference", async () => {
        repos.bookings.findAll.mockResolvedValue([
            {cID: 10, cAccountNumberID: 1, cBookingTypeID: 30, cStockID: 0}
        ]);
        repos.stocks.findAll.mockResolvedValue([]);
        repos.bookingTypes.findAll.mockResolvedValue([{cID: 30, cAccountNumberID: 1}]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.performHealthCheck();

        expect(result.healthy).toBe(true);
        expect(result.stats.danglingStockReferences).toBe(0);
    });

    it("repairDatabase performs no deletions and reports zero fixes when already healthy", async () => {
        repos.bookings.findAll.mockResolvedValue([{cID: 10, cAccountNumberID: 1}]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.repairDatabase();

        expect(result).toEqual({success: true, fixed: 0, errors: []});
        expect(repos.bookings.delete).not.toHaveBeenCalled();
    });

    it("repairDatabase deletes orphaned records and reports how many were fixed", async () => {
        repos.bookings.findAll.mockResolvedValue([
            {cID: 10, cAccountNumberID: 1},
            {cID: 11, cAccountNumberID: 99}
        ]);

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.repairDatabase();

        expect(repos.bookings.delete).toHaveBeenCalledWith(11, expect.anything());
        expect(repos.bookings.delete).not.toHaveBeenCalledWith(10, expect.anything());
        expect(result.success).toBe(true);
        expect(result.fixed).toBe(1);
        expect(result.errors).toEqual([]);
    });

    it("fixIssues records an error and marks success false when a removal fails", async () => {
        repos.bookings.findAll.mockResolvedValue([{cID: 11, cAccountNumberID: 99}]);
        repos.bookings.delete.mockRejectedValue(new Error("delete failed"));

        const service = createDatabaseHealthService(repositoryFactory, transactionManager);
        const result = await service.repairDatabase();

        expect(result.success).toBe(false);
        expect(result.fixed).toBe(0);
        expect(result.errors).toEqual([
            {issue: "orphaned_records", store: "bookings", error: "delete failed"}
        ]);
    });
});