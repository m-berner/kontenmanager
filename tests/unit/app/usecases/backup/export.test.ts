/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {exportDatabaseUsecase} from "@/app/usecases/backup/export";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";
import type {ExportDatabaseUsecaseDeps} from "@/app/usecases/backup/export";
import type {RepositoryMap} from "@/domain/types";

function makeDeps(overrides: Partial<{
    repositories: {
        accounts?: Partial<RepositoryMap["accounts"]>;
        bookings?: Partial<RepositoryMap["bookings"]>;
        stocks?: Partial<RepositoryMap["stocks"]>;
        bookingTypes?: Partial<RepositoryMap["bookingTypes"]>;
    };
    verify: { valid: boolean; errors: string[] };
}> = {}): {deps: ExportDatabaseUsecaseDeps; writeBufferToFile: ReturnType<typeof vi.fn>} {
    const account = makeAccountDb({cID: 1});
    const repositories = {
        accounts: {findAll: vi.fn().mockResolvedValue([account])},
        bookings: {findAll: vi.fn().mockResolvedValue([makeBookingDb({cAccountNumberID: 1})])},
        stocks: {findAll: vi.fn().mockResolvedValue([makeStockDb({cAccountNumberID: 1})])},
        bookingTypes: {findAll: vi.fn().mockResolvedValue([makeBookingTypeDb({cAccountNumberID: 1})])},
        ...overrides.repositories
    } as unknown as RepositoryMap;

    const writeBufferToFile = vi.fn().mockResolvedValue(undefined);

    const deps: ExportDatabaseUsecaseDeps = {
        repositories,
        browserAdapter: {
            manifest: () => ({version: "1.2.3"}),
            writeBufferToFile
        },
        importExportAdapter: {
            validateBackup: vi.fn(),
            validateDataIntegrity: vi.fn(),
            validateLegacyDataIntegrity: vi.fn(),
            readJsonFile: vi.fn(),
            stringifyDatabase: vi.fn().mockReturnValue("{}"),
            verifyExportIntegrity: vi.fn().mockReturnValue(overrides.verify ?? {valid: true, errors: []}),
            transformLegacyStock: vi.fn(),
            transformLegacyBooking: vi.fn()
        },
        runtime: {resetTeleport: vi.fn()}
    };

    return {deps, writeBufferToFile};
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

    it("throws when a booking references a non-existent account (consistency check)", async () => {
        const {deps} = makeDeps({
            repositories: {
                bookings: {findAll: vi.fn().mockResolvedValue([makeBookingDb({cAccountNumberID: 999})])}
            }
        });

        await expect(
            exportDatabaseUsecase(deps, {
                filename: "backup.json",
                confirmLargeFile: vi.fn(),
                notifyEstimatedSize: vi.fn()
            })
        ).rejects.toThrow();

        expect(deps.browserAdapter.writeBufferToFile).not.toHaveBeenCalled();
    });

    it("throws when there are no accounts at all", async () => {
        const {deps} = makeDeps({repositories: {accounts: {findAll: vi.fn().mockResolvedValue([])}}});

        await expect(
            exportDatabaseUsecase(deps, {
                filename: "backup.json",
                confirmLargeFile: vi.fn(),
                notifyEstimatedSize: vi.fn()
            })
        ).rejects.toThrow();
    });

    it("throws when export integrity verification fails", async () => {
        const {deps} = makeDeps({verify: {valid: false, errors: ["bad json"]}});

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