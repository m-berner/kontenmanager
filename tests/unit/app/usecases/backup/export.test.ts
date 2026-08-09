/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {exportDatabaseUsecase} from "@/app/usecases/backup/export";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";
import type {ExportDatabaseUsecaseDeps} from "@/app/usecases/backup/export";
import {ERROR_CATEGORY} from "@/domain/constants";
import {ERROR_DEFINITIONS} from "@/domain/errors";
import type {RecordsDbData} from "@/domain/types";

function makeDeps(overrides: Partial<{
    records: Partial<RecordsDbData>;
    verify: { valid: boolean; errors: string[] };
}> = {}): {
    deps: ExportDatabaseUsecaseDeps;
    writeBufferToFile: ReturnType<typeof vi.fn>;
    getAllRecords: ReturnType<typeof vi.fn>;
} {
    const account = makeAccountDb({cID: 1});
    // One `getAllRecords` stub rather than four per-repository `findAll` stubs:
    // the usecase now takes its snapshot in a single transaction, which is the
    // point of `DatabaseSnapshotPort`. Four independent stubs could not have
    // expressed the difference — that is exactly why the torn read went
    // unnoticed.
    const records: RecordsDbData = {
        accountsDB: [account],
        bookingsDB: [makeBookingDb({cAccountNumberID: 1})],
        stocksDB: [makeStockDb({cAccountNumberID: 1})],
        bookingTypesDB: [makeBookingTypeDb({cAccountNumberID: 1})],
        ...overrides.records
    };
    const getAllRecords = vi.fn().mockResolvedValue(records);

    const writeBufferToFile = vi.fn().mockResolvedValue(undefined);

    const deps: ExportDatabaseUsecaseDeps = {
        databaseAdapter: {getAllRecords},
        browserAdapter: {
            manifest: () => ({version: "1.2.3"}),
            writeBufferToFile
        },
        importExportAdapter: {
            validateBackup: vi.fn(),
            validateDataIntegrity: vi.fn(),
            readJsonFile: vi.fn(),
            stringifyDatabase: vi.fn().mockReturnValue("{}"),
            verifyExportIntegrity: vi.fn().mockReturnValue(overrides.verify ?? {valid: true, errors: []})
        },
        runtime: {resetTeleport: vi.fn(), clearStocksPages: vi.fn()}
    };

    return {deps, writeBufferToFile, getAllRecords};
}

describe("usecases/backup/export", () => {
    it("writes the export file and resets teleport for a small, consistent database", async () => {
        const {deps, writeBufferToFile} = makeDeps();
        const notifyEstimatedSize = vi.fn().mockResolvedValue(undefined);
        const confirmLargeFile = vi.fn();

        const res = await exportDatabaseUsecase(deps, {
            filename: "backup.json",
            confirmLargeFile,
            notifyEstimatedSize
        });

        expect(writeBufferToFile).toHaveBeenCalledWith(expect.stringContaining("{}"), "backup.json");
        expect(deps.runtime.resetTeleport).toHaveBeenCalledTimes(1);
        expect(notifyEstimatedSize).toHaveBeenCalledTimes(1);
        expect(confirmLargeFile).not.toHaveBeenCalled();
        expect(res.cancelled).toBe(false);
        expect(res.estimatedSizeKb).toBeGreaterThan(0);
    });

    // The export's referential-integrity check is only meaningful over a
    // snapshot the database was actually in. It used to issue four independent
    // `repository.findAll()` calls — none of which pass a `tx`, so each opens
    // its own transaction — and then survey the four results as though they were
    // simultaneous. `getAllRecords` reads all four stores in one readonly
    // transaction for exactly this reason. Asserting the single call is what
    // stops the four-read shape being reintroduced.
    it("reads the whole database in one snapshot call, not per store", async () => {
        const {deps, getAllRecords} = makeDeps();

        await exportDatabaseUsecase(deps, {
            filename: "backup.json",
            confirmLargeFile: vi.fn(),
            notifyEstimatedSize: vi.fn().mockResolvedValue(undefined)
        });

        expect(getAllRecords).toHaveBeenCalledTimes(1);
    });

    // The two refusals below must stay DISTINGUISHABLE, which is the whole
    // point: both end in a throw, but "your database is inconsistent" is a
    // fault while "you have nothing to export yet" is the expected state right
    // after install. They used to share EXPORT_DATABASE.A, so a fresh install
    // clicking Export was told its data had failed validation. Asserting the
    // code (not just that it throws) is what keeps them from being merged back.
    it("throws EXPORT_DATABASE.A when a booking references a non-existent account", async () => {
        const {deps} = makeDeps({
            records: {bookingsDB: [makeBookingDb({cAccountNumberID: 999})]}
        });

        await expect(
            exportDatabaseUsecase(deps, {
                filename: "backup.json",
                confirmLargeFile: vi.fn(),
                notifyEstimatedSize: vi.fn()
            })
        ).rejects.toMatchObject({code: ERROR_DEFINITIONS.EXPORT_DATABASE.A.CODE});

        expect(deps.browserAdapter.writeBufferToFile).not.toHaveBeenCalled();
    });

    it("throws EXPORT_DATABASE.EMPTY — not the validation-failed error — for an empty database", async () => {
        const {deps} = makeDeps({records: {accountsDB: []}});

        await expect(
            exportDatabaseUsecase(deps, {
                filename: "backup.json",
                confirmLargeFile: vi.fn(),
                notifyEstimatedSize: vi.fn()
            })
        ).rejects.toMatchObject({
            code: ERROR_DEFINITIONS.EXPORT_DATABASE.EMPTY.CODE,
            category: ERROR_CATEGORY.VALIDATION
        });

        expect(deps.browserAdapter.writeBufferToFile).not.toHaveBeenCalled();
    });

    it("throws when export integrity verification fails", async () => {
        const {deps} = makeDeps({verify: {valid: false, errors: ["bad JSON"]}});

        await expect(
            exportDatabaseUsecase(deps, {
                filename: "backup.json",
                confirmLargeFile: vi.fn(),
                notifyEstimatedSize: vi.fn()
            })
        ).rejects.toThrow();

        expect(deps.browserAdapter.writeBufferToFile).not.toHaveBeenCalled();
    });

    it("asks for large-file confirmation instead of notifying when over the size threshold, and skips the write if declined", async () => {
        const {deps, writeBufferToFile} = makeDeps();
        // Force a large export by making stringifyDatabase return a big string.
        (deps.importExportAdapter.stringifyDatabase as ReturnType<typeof vi.fn>).mockReturnValue(
            "x".repeat(11_000_000)
        );
        const confirmLargeFile = vi.fn().mockResolvedValue(false);
        const notifyEstimatedSize = vi.fn();

        const res = await exportDatabaseUsecase(deps, {
            filename: "backup.json",
            confirmLargeFile,
            notifyEstimatedSize
        });

        expect(confirmLargeFile).toHaveBeenCalledTimes(1);
        expect(notifyEstimatedSize).not.toHaveBeenCalled();
        expect(writeBufferToFile).not.toHaveBeenCalled();
        expect(res.cancelled).toBe(true);
    });

    it("writes the file when the user confirms a large export", async () => {
        const {deps, writeBufferToFile} = makeDeps();
        (deps.importExportAdapter.stringifyDatabase as ReturnType<typeof vi.fn>).mockReturnValue(
            "x".repeat(11_000_000)
        );
        const confirmLargeFile = vi.fn().mockResolvedValue(true);

        const res = await exportDatabaseUsecase(deps, {
            filename: "backup.json",
            confirmLargeFile,
            notifyEstimatedSize: vi.fn()
        });

        expect(writeBufferToFile).toHaveBeenCalledTimes(1);
        expect(res.cancelled).toBe(false);
    });
});