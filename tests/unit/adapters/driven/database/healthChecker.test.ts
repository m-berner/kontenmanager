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
        accounts: {findAll: ReturnType<typeof vi.fn>};
        bookings: {findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>};
        bookingTypes: {findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>};
        stocks: {findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>};
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

    it("reports healthy with no issues when every record references a valid account", async () => {
        repos.bookings.findAll.mockResolvedValue([{cID: 10, cAccountNumberID: 1}]);
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
            {cID: 10, cAccountNumberID: 1},
            {cID: 11, cAccountNumberID: 99}
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