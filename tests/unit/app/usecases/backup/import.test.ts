/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {importDatabaseUsecase} from "@/app/usecases/backup/import";
import type {ImportDatabaseUsecaseDeps} from "@/app/usecases/backup/import";
import {INDEXED_DB} from "@/domain/constants";
import {createRecordsPortMock, createSetStorageMock, makeAccountDb, makeBookingDb} from "@test/usecases";

const MODERN = INDEXED_DB.CURRENT_VERSION;

function makeInput(overrides: Partial<Parameters<typeof importDatabaseUsecase>[1]> = {}) {
    return {
        fileBlob: new Blob(["{}"]),
        initMessages: {title: "T", message: "M"},
        onResetFileInput: vi.fn(),
        onInvalidBackup: vi.fn().mockResolvedValue(undefined),
        onIntegrityErrors: vi.fn().mockResolvedValue(undefined),
        confirmUndatedBookings: vi.fn().mockResolvedValue(true),
        confirmProceed: vi.fn().mockResolvedValue(true),
        prepareRollback: vi.fn().mockResolvedValue(true),
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
    const runtime = {resetTeleport: vi.fn(), clearStocksPages: vi.fn()};
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
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
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
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
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

    // Backup import is the only remaining way an undated booking can enter the
    // database (both booking usecases reject a blank date on the form path), and
    // such a booking is counted by the all-time totals but by no calendar year.
    // So it must not happen without the user having said yes to it.
    describe("undated bookings", () => {
        const undatedBackup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 1})],
            stocks: [],
            bookings: [
                makeBookingDb({cID: 1, cAccountNumberID: 1, cBookDate: "2024-03-15"}),
                makeBookingDb({cID: 2, cAccountNumberID: 1, cBookDate: ""})
            ],
            bookingTypes: []
        };

        it("asks before importing, and aborts without touching the database when declined", async () => {
            const {deps} = makeDeps({backup: undatedBackup, validation: {isValid: true, version: MODERN}});
            const input = makeInput({confirmUndatedBookings: vi.fn().mockResolvedValue(false)});

            await importDatabaseUsecase(deps, input);

            expect(input.confirmUndatedBookings).toHaveBeenCalledWith(
                expect.objectContaining({bookings: 2, undatedBookings: 1})
            );
            // Asked before the destructive confirmation, so declining here never
            // reaches the point of agreeing to wipe the existing data.
            expect(input.confirmProceed).not.toHaveBeenCalled();
            expect(deps.atomicImport).not.toHaveBeenCalled();
            expect(input.onImported).not.toHaveBeenCalled();
            expect(input.onResetFileInput).toHaveBeenCalledTimes(1);
        });

        it("imports them when the user confirms", async () => {
            const {deps, atomicImport} = makeDeps({
                backup: undatedBackup,
                validation: {isValid: true, version: MODERN}
            });
            const input = makeInput();

            await importDatabaseUsecase(deps, input);

            expect(input.confirmUndatedBookings).toHaveBeenCalledTimes(1);
            expect(atomicImport).toHaveBeenCalledTimes(1);
            expect(input.onImported).toHaveBeenCalledTimes(1);
        });

        it("does not ask when every booking carries a valid date", async () => {
            const backup = {
                ...undatedBackup,
                bookings: [makeBookingDb({cID: 1, cAccountNumberID: 1, cBookDate: "2024-03-15"})]
            };
            const {deps, atomicImport} = makeDeps({backup, validation: {isValid: true, version: MODERN}});
            const input = makeInput();

            await importDatabaseUsecase(deps, input);

            expect(input.confirmUndatedBookings).not.toHaveBeenCalled();
            expect(atomicImport).toHaveBeenCalledTimes(1);
        });
    });

    it("imports a modern backup using the first account's id as the active account", async () => {
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
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

    it("sets activeAccountId to the 'no account' sentinel when the backup has zero accounts", async () => {
        // validateBackup only checks Array.isArray (not length) and
        // validateDataIntegrity's `!backup.accounts` check treats an empty array
        // as truthy, so a hand-edited backup with all-empty arrays passes both
        // validation phases - this must not fall back to the legacy
        // SM_RESTORE_ACCOUNT_ID (1), which would point activeAccountId at an
        // account that doesn't exist in the import.
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
            accounts: [],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, settings} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN}
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(settings.activeAccountId).toBe(INDEXED_DB.INVALID_ID);
    });

    it("rolls back and reports the error message when atomicImport throws", async () => {
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
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
        // `true` = the import reached `atomicImport`, so the caller must roll
        // back. The flag is what stops a rollback running for failures that
        // never wrote — see the "reports a pre-write failure as needing no
        // rollback" case below.
        expect(input.onError).toHaveBeenCalledWith("disk full", true);
        expect(input.onImported).not.toHaveBeenCalled();
    });

    // A failure before the first write must NOT ask the caller to roll back.
    // `restoreFromRollback` is a global clear + re-add of all four stores, so
    // running it for a file that never reached `atomicImport` rewrote the whole
    // database to undo nothing — and then told the user "rollback succeeded"
    // for an import that had not begun.
    it("reports a pre-write failure as needing no rollback", async () => {
        const {deps} = makeDeps({
            backup: {},
            validation: {isValid: true, version: MODERN}
        });
        (deps.importExportAdapter.readJsonFile as ReturnType<typeof vi.fn>)
            .mockRejectedValue(new Error("not valid JSON"));
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.onError).toHaveBeenCalledWith("not valid JSON", false);
        expect(deps.atomicImport).not.toHaveBeenCalled();
    });

    // The snapshot is a whole-database read, so taking it before the file has
    // even been parsed cost that read on every rejected file and every declined
    // confirmation.
    it("does not take a rollback snapshot for a backup that fails validation", async () => {
        const {deps} = makeDeps({
            backup: {},
            validation: {isValid: false, version: -1, error: "Invalid data format"}
        });
        const input = makeInput();

        await importDatabaseUsecase(deps, input);

        expect(input.prepareRollback).not.toHaveBeenCalled();
        expect(input.onInvalidBackup).toHaveBeenCalledTimes(1);
    });

    it("does not take a rollback snapshot when the user declines the import", async () => {
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps} = makeDeps({backup, validation: {isValid: true, version: MODERN}});
        const input = makeInput({confirmProceed: vi.fn().mockResolvedValue(false)});

        await importDatabaseUsecase(deps, input);

        expect(input.prepareRollback).not.toHaveBeenCalled();
        expect(deps.atomicImport).not.toHaveBeenCalled();
    });

    it("aborts the import without writing when no rollback snapshot can be taken", async () => {
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps} = makeDeps({backup, validation: {isValid: true, version: MODERN}});
        const input = makeInput({prepareRollback: vi.fn().mockResolvedValue(false)});

        await importDatabaseUsecase(deps, input);

        expect(deps.atomicImport).not.toHaveBeenCalled();
        expect(input.onResetFileInput).toHaveBeenCalledTimes(1);
        expect(input.onImported).not.toHaveBeenCalled();
    });

    it("still reports the original error when the rollback's storage write also fails", async () => {
        // The rollback `setStorage` used to be awaited unguarded, so its
        // rejection propagated out of importDatabaseUsecase and `onError` never
        // ran: the user got no import-failure message at all, and the real
        // reason the import failed was replaced by a storage error. A rejecting
        // setStorage is not hypothetical here — it is one of the paths that can
        // land in this catch in the first place.
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
            accounts: [makeAccountDb({cID: 42})],
            stocks: [],
            bookings: [],
            bookingTypes: []
        };
        const {deps, settings} = makeDeps({
            backup,
            validation: {isValid: true, version: MODERN},
            originalActiveId: 7
        });
        (deps.atomicImport as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("disk full"));
        // The happy-path write (setActiveAccountIdPersisted) must still succeed,
        // otherwise it — not atomicImport — would be the failure under test.
        (deps.setStorage as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(undefined)
            .mockRejectedValue(new Error("storage quota exceeded"));
        const input = makeInput();

        await expect(importDatabaseUsecase(deps, input)).resolves.toBeUndefined();

        // `true` = the import reached `atomicImport`, so the caller must roll
        // back. The flag is what stops a rollback running for failures that
        // never wrote — see the "reports a pre-write failure as needing no
        // rollback" case below.
        expect(input.onError).toHaveBeenCalledWith("disk full", true);
        // The in-memory value is restored before the persist is attempted, so a
        // failed write only leaves memory and storage disagreeing.
        expect(settings.activeAccountId).toBe(7);
    });

    it("does not roll back when the post-commit onImported callback throws", async () => {
        const backup = {
            sm: {cVersion: "1", cDBVersion: MODERN, cEngine: "x"},
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
