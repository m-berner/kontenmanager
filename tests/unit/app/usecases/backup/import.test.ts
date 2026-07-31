/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {importDatabaseUsecase} from "@/app/usecases/backup/import";
import type {ImportDatabaseUsecaseDeps} from "@/app/usecases/backup/import";
import {INDEXED_DB} from "@/domain/constants";
import {createRecordsPortMock, createSetStorageMock, makeAccountDb} from "@test/usecases";

const MODERN = INDEXED_DB.CURRENT_VERSION;

function makeInput(overrides: Partial<Parameters<typeof importDatabaseUsecase>[1]> = {}) {
    return {
        fileBlob: new Blob(["{}"]),
        initMessages: {title: "T", message: "M"},
        onResetFileInput: vi.fn(),
        onInvalidBackup: vi.fn().mockResolvedValue(undefined),
        onIntegrityErrors: vi.fn().mockResolvedValue(undefined),
        confirmProceed: vi.fn().mockResolvedValue(true),
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
        readJsonFile: vi.fn().mockResolvedValue(input.backup),
        stringifyDatabase: vi.fn(),
        verifyExportIntegrity: vi.fn()
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

    it("does not roll back when the post-commit onImported callback throws", async () => {
        const backup = {
            sm: {cVersion: 1, cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, atomicImport, settings, setStorage} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN},
            originalActiveId: 7
        });
        const input = makeInput({
            onImported: vi.fn().mockRejectedValue(new Error("alert sink exploded")),
            onResetFileInput: vi.fn()
        });

        await importDatabaseUsecase(deps, input);

        // The import itself already fully committed; a failure in the purely
        // cosmetic post-commit notification must not revert activeAccountId,
        // report an error, or otherwise look like the import failed.
        expect(atomicImport).toHaveBeenCalledTimes(1);
        expect(settings.activeAccountId).toBe(42);
        expect(setStorage).not.toHaveBeenLastCalledWith(expect.any(String), 7);
        expect(input.onError).not.toHaveBeenCalled();
        // onResetFileInput is skipped since it's sequenced after the throwing
        // onImported call within the same inner try, matching normal
        // throw-stops-execution semantics for that pair of steps.
        expect(input.onResetFileInput).not.toHaveBeenCalled();
    });
});
