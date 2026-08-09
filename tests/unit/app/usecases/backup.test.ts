/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {
    buildModernImportPlan,
    createExportMetadata,
    findExportConsistencyIssues,
    getImportCounts,
    importDatabaseUsecase,
    hasExportConsistencyIssues
} from "@/app/usecases/backup";
import {INDEXED_DB} from "@/domain/constants";
import type {ModernBackupData} from "@/domain/types";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

describe("usecases/backup helpers", () => {
    it("findExportConsistencyIssues detects invalid references", () => {
        const issues = findExportConsistencyIssues({
            accounts: [makeAccountDb({cID: 1})],
            bookings: [makeBookingDb({cAccountNumberID: 2})],
            stocks: [makeStockDb({cAccountNumberID: 1})],
            bookingTypes: [makeBookingTypeDb({cAccountNumberID: 3})]
        });

        expect(issues.noAccounts).toBe(false);
        expect(issues.invalidBookings).toBe(1);
        expect(issues.invalidStocks).toBe(0);
        expect(issues.invalidBookingTypes).toBe(1);
        expect(hasExportConsistencyIssues(issues)).toBe(true);
    });

    it("createExportMetadata keeps the manifest version verbatim", () => {
        const md = createExportMetadata("1.2.3");
        expect(md.cVersion).toBe("1.2.3");
        expect(md.cDBVersion).toBe(INDEXED_DB.CURRENT_VERSION);
        expect(md.cEngine).toBe("indexeddb");
    });

    it("getImportCounts returns per-entity counts", () => {
        const modern: ModernBackupData = {
            sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "indexeddb"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [makeStockDb({cID: 1})],
            bookings: [makeBookingDb({cID: 1}), makeBookingDb({cID: 2}), makeBookingDb({cID: 3})],
            bookingTypes: [makeBookingTypeDb({cID: 1}), makeBookingTypeDb({cID: 2})]
        };

        expect(getImportCounts(modern)).toEqual({
            accounts: 1,
            stocks: 1,
            bookings: 3,
            bookingTypes: 2,
            undatedBookings: 0
        });
    });

    it("buildModernImportPlan creates clear+add descriptors and filters initData by activeId", () => {
        const backup: ModernBackupData = {
            sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "indexeddb"},
            accounts: [makeAccountDb({cID: 1}), makeAccountDb({cID: 2})],
            bookingTypes: [makeBookingTypeDb({cAccountNumberID: 1}), makeBookingTypeDb({cAccountNumberID: 2})],
            stocks: [makeStockDb({cAccountNumberID: 1}), makeStockDb({cAccountNumberID: 2})],
            bookings: [makeBookingDb({cAccountNumberID: 1}), makeBookingDb({cAccountNumberID: 2})]
        };

        const plan = buildModernImportPlan({backup, activeId: 1});
        expect(plan.descriptors).toHaveLength(4);
        for (const d of plan.descriptors) {
            expect(d.operations[0]).toEqual({type: "clear"});
        }
        expect(plan.initData.accountsDB).toHaveLength(2);
        expect(plan.initData.bookingTypesDB).toHaveLength(1);
        expect(plan.initData.stocksDB).toHaveLength(1);
        expect(plan.initData.bookingsDB).toHaveLength(1);
    });

    it("importDatabaseUsecase invalidates online-rate caches after successful import", async () => {
        const backup: ModernBackupData = {
            sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "indexeddb"},
            accounts: [makeAccountDb({cID: 10})],
            bookings: [],
            bookingTypes: [],
            stocks: []
        };

        const importExportAdapter = {
            readJsonFile: vi.fn().mockResolvedValue(backup),
            validateBackup: vi.fn().mockReturnValue({isValid: true, version: backup.sm.cDBVersion}),
            validateDataIntegrity: vi.fn().mockReturnValue([])
        };

        const atomicImport = vi.fn().mockResolvedValue(undefined);
        const records = {
            accounts: {items: []},
            stocks: {items: []},
            bookings: {items: []},
            bookingTypes: {items: []},
            init: vi.fn().mockResolvedValue(undefined)
        };
        const settings = {activeAccountId: -1};
        const runtime = {resetTeleport: vi.fn(), clearStocksPages: vi.fn()};
        const clearStocksPages = vi.fn();
        const setStorage = vi.fn().mockResolvedValue(undefined);
        const clearHttpCache = vi.fn();
        const onImported = vi.fn().mockResolvedValue(undefined);

        await importDatabaseUsecase(
            {
                importExportAdapter: importExportAdapter as never,
                atomicImport,
                records: records as never,
                settings: settings as never,
                runtime: runtime as never,
                setStorage,
                clearStocksPages,
                clearHttpCache
            },
            {
                fileBlob: new Blob(["{}"], {type: "application/json"}),
                initMessages: {title: "t", message: "m"},
                onResetFileInput: vi.fn(),
                onInvalidBackup: vi.fn(),
                onIntegrityErrors: vi.fn(),
                confirmUndatedBookings: vi.fn().mockResolvedValue(true),
                confirmProceed: vi.fn().mockResolvedValue(true),
                prepareRollback: vi.fn().mockResolvedValue(true),
                onImported,
                onError: vi.fn()
            }
        );

        expect(atomicImport).toHaveBeenCalledTimes(1);
        expect(onImported).toHaveBeenCalledTimes(1);
        expect(clearStocksPages).toHaveBeenCalledTimes(1);
        expect(clearHttpCache).toHaveBeenCalledTimes(1);
    });
});
