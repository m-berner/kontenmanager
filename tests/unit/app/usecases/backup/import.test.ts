/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {importDatabaseUsecase} from "@/app/usecases/backup/import";
import type {ImportDatabaseUsecaseDeps} from "@/app/usecases/backup/import";
import {INDEXED_DB} from "@/domain/constants";
import {createRecordsPortMock, createSetStorageMock, makeAccountDb, makeBookingDb, makeStockDb} from "@test/usecases";

const LEGACY = INDEXED_DB.LEGACY_IMPORT_VERSION;
const MODERN = INDEXED_DB.CURRENT_VERSION;

function makeInput(overrides: Partial<Parameters<typeof importDatabaseUsecase>[1]> = {}) {
    return {
        fileBlob: new Blob(["{}"]),
        initMessages: {title: "T", message: "M"},
        legacyDefaultBookingTypeLabels: {buy: "Buy", sell: "Sell", dividend: "Div", other: "Other", fee: "Fee", tax: "Tax"},
        onResetFileInput: vi.fn(),
        onInvalidBackup: vi.fn().mockResolvedValue(undefined),
        onLegacyAlreadyRestored: vi.fn().mockResolvedValue(undefined),
        onIntegrityErrors: vi.fn().mockResolvedValue(undefined),
        confirmProceed: vi.fn().mockResolvedValue(true),
        onUnsupportedVersion: vi.fn().mockResolvedValue(undefined),
        onImported: vi.fn().mockResolvedValue(undefined),
        onError: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

function makeDeps(input: {
    backup: unknown;
    validation: {isValid: boolean; version: number; error?: string};
    integrityErrors?: string[];
    existingAccountIds?: number[];
    originalActiveId?: number;
}) {
    const atomicImport = vi.fn().mockResolvedValue(undefined);
    const settings = {activeAccountId: input.originalActiveId ?? -1};
    const runtime = {resetTeleport: vi.fn()};
    const setStorage = createSetStorageMock();
    const clearStocksPages = vi.fn();
    const clearHttpCache = vi.fn();
    const records = createRecordsPortMock({accountIds: input.existingAccountIds});

    const importExportAdapter = {
        validateBackup: vi.fn().mockReturnValue(input.validation),
        validateDataIntegrity: vi.fn().mockReturnValue(input.integrityErrors ?? []),
        validateLegacyDataIntegrity: vi.fn().mockReturnValue(input.integrityErrors ?? []),
        readJsonFile: vi.fn().mockResolvedValue(input.backup),
        stringifyDatabase: vi.fn(),
        verifyExportIntegrity: vi.fn(),
        transformLegacyStock: vi.fn(() => makeStockDb()),
        transformLegacyBooking: vi.fn((_rec: unknown, index: number, activeId: number) =>
            makeBookingDb({cID: index + 1, cAccountNumberID: activeId})
        )
    };

    const deps: ImportDatabaseUsecaseDeps = {
        importExportAdapter,
        atomicImport,
        records,
        settings,
        runtime,
        setStorage,
        clearStocksPages,
        clearHttpCache
    };

    return {deps, atomicImport, settings, runtime, setStorage, clearStocksPages, clearHttpCache, records};
}

describe("usecases/backup/import", () => {
    it("stops and reports when the backup fails top-level validation", async () => {
        const {deps} = makeDeps({backup: {}, validation: {isValid: false, version: -1, error: "bad"}});
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.onInvalidBackup).toHaveBeenCalledTimes(1);
        expect(deps.atomicImport).not.toHaveBeenCalled();
    });

    it("refuses to re-import a legacy backup once an account already exists", async () => {
        const backup = {sm: {cVersion: 1, cDBVersion: LEGACY, cEngine: "x"}, stocks: [], transfers: []};
        const {deps} = makeDeps({
            backup,
            validation: {isValid: true, version: LEGACY},
            existingAccountIds: [1]
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.onLegacyAlreadyRestored).toHaveBeenCalledTimes(1);
        expect(deps.atomicImport).not.toHaveBeenCalled();
    });

    it("reports integrity errors (sliced to 5, with a remainder note) and resets teleport without importing", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const errors = Array.from({length: 7}, (_, i) => `error ${i + 1}`);
        const {deps} = makeDeps({backup, validation: {isValid: true, version: MODERN}, integrityErrors: errors});
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.onIntegrityErrors).toHaveBeenCalledWith(
            ["error 1", "error 2", "error 3", "error 4", "error 5", "...and 2 more"],
            7
        );
        expect(deps.runtime.resetTeleport).toHaveBeenCalledTimes(1);
        expect(deps.atomicImport).not.toHaveBeenCalled();
    });

    it("does nothing further when the user declines to proceed", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps} = makeDeps({backup, validation: {isValid: true, version: MODERN}});
        const input = makeInput({confirmProceed: vi.fn().mockResolvedValue(false)});

        await importDatabaseUsecase(deps, input);

        expect(deps.atomicImport).not.toHaveBeenCalled();
        expect(input.onImported).not.toHaveBeenCalled();
    });

    it("imports a legacy backup: switches to the restore account, writes atomically, and notifies success", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: LEGACY, cEngine: "x"},
            stocks: [{cID: 1}],
            transfers: [{cType: INDEXED_DB.STORE.BOOKING_TYPES.BUY}]
        };
        const {deps, atomicImport, settings, setStorage, clearStocksPages, clearHttpCache, records} = makeDeps({
            backup,
            validation: {isValid: true, version: LEGACY},
            originalActiveId: -1
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(settings.activeAccountId).toBe(1);
        expect(setStorage).toHaveBeenCalledWith(expect.any(String), 1);
        expect(atomicImport).toHaveBeenCalledTimes(1);
        expect(records.init).toHaveBeenCalledTimes(1);
        expect(deps.runtime.resetTeleport).toHaveBeenCalledTimes(1);
        expect(clearStocksPages).toHaveBeenCalledTimes(1);
        expect(clearHttpCache).toHaveBeenCalledTimes(1);
        expect(input.onImported).toHaveBeenCalledTimes(1);
        expect(input.onResetFileInput).toHaveBeenCalledTimes(1);
    });

    it("imports a modern backup using the first account's id as the active account", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, atomicImport, settings, records} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN}
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(settings.activeAccountId).toBe(42);
        expect(atomicImport).toHaveBeenCalledTimes(1);
        expect(records.init).toHaveBeenCalledTimes(1);
        expect(input.onImported).toHaveBeenCalledTimes(1);
    });

    it("rolls back when a backup is tagged as legacy but has no 'transfers' array", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: LEGACY, cEngine: "x"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, atomicImport, settings, setStorage} = makeDeps({
            backup,
            validation: {isValid: true, version: LEGACY},
            originalActiveId: 7
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(atomicImport).not.toHaveBeenCalled();
        expect(settings.activeAccountId).toBe(7);
        expect(setStorage).toHaveBeenLastCalledWith(expect.any(String), 7);
        expect(input.onError).toHaveBeenCalledWith("Legacy backup expected 'transfers' array");
    });

    it("rolls back when a backup is tagged as modern but contains a 'transfers' array", async () => {
        const backup = {sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"}, stocks: [], transfers: []};
        const {deps, atomicImport, settings, setStorage} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN},
            originalActiveId: 7
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(atomicImport).not.toHaveBeenCalled();
        expect(settings.activeAccountId).toBe(7);
        expect(setStorage).toHaveBeenLastCalledWith(expect.any(String), 7);
        expect(input.onError).toHaveBeenCalledWith("Modern backup must not contain 'transfers'");
    });

    it("reports an unsupported version and restores the original active account", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: 10, cEngine: "x"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, atomicImport, settings, setStorage} = makeDeps({
            backup,
            validation: {isValid: true, version: 10},
            originalActiveId: 7
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.onUnsupportedVersion).toHaveBeenCalledTimes(1);
        expect(atomicImport).not.toHaveBeenCalled();
        expect(settings.activeAccountId).toBe(7);
        expect(setStorage).toHaveBeenLastCalledWith(expect.any(String), 7);
    });

    it("rolls back and reports the error message when atomicImport throws", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, settings, setStorage} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN},
            originalActiveId: 7
        });
        (deps.atomicImport as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("disk full"));
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(settings.activeAccountId).toBe(7);
        expect(setStorage).toHaveBeenLastCalledWith(expect.any(String), 7);
        expect(input.onError).toHaveBeenCalledWith("disk full");
        expect(input.onImported).not.toHaveBeenCalled();
    });
});