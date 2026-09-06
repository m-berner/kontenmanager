/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {useImportDatabaseDialogController} from "@/adapters/ui/composables/useImportDialog";
import type {RecordsLike} from "@/app/usecases/portAdapters";
import {INDEXED_DB} from "@/domain/constants";
import {makeAccountDb} from "@test/usecases";

function makeRecords(overrides: Partial<RecordsLike> = {}): RecordsLike {
    return {
        accounts: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        bookingTypes: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        bookings: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        stocks: {items: [], add: vi.fn(), update: vi.fn(), remove: vi.fn()},
        clean: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

function makeController(input: {
    records?: RecordsLike;
    activeAccountId?: number;
    validation?: { isValid: boolean; version: number; error?: string };
    backup?: unknown;
    integrityErrors?: string[];
    atomicImportImpl?: () => Promise<void>;
    feedbackErrorImpl?: () => Promise<void>;
    setStorageImpl?: () => Promise<void>;
    /** Whole-database snapshot the rollback point is now read from (see getAllRecords). */
    dbRecords?: {
        accountsDB: unknown[];
        bookingsDB: unknown[];
        bookingTypesDB: unknown[];
        stocksDB: unknown[];
    };
    getAllRecordsImpl?: () => Promise<unknown>;
} = {}) {
    const t = (key: string) => key;
    const settings = {activeAccountId: input.activeAccountId ?? -1};
    const runtime = {resetTeleport: vi.fn(), clearStocksPages: vi.fn()};
    const records = input.records ?? makeRecords();

    const feedbackError = input.feedbackErrorImpl
        ? vi.fn().mockImplementation(input.feedbackErrorImpl)
        : vi.fn().mockResolvedValue(undefined);

    const services = {
        browserAdapter: {
            getMessage: (k: string) => k,
            showSystemNotification: vi.fn().mockResolvedValue(undefined)
        },
        alertAdapter: {
            feedbackInfo: vi.fn().mockResolvedValue(undefined),
            feedbackError,
            feedbackConfirm: vi.fn().mockResolvedValue(true)
        },
        storageAdapter: () => ({
            setStorage: input.setStorageImpl
                ? vi.fn().mockImplementation(input.setStorageImpl)
                : vi.fn().mockResolvedValue(undefined)
        }),
        importExportAdapter: {
            validateBackup: vi.fn().mockReturnValue(input.validation ?? {
                isValid: true,
                version: INDEXED_DB.CURRENT_VERSION
            }),
            validateDataIntegrity: vi.fn().mockReturnValue(input.integrityErrors ?? []),
            readJsonFile: vi.fn().mockResolvedValue(
                input.backup ?? {
                    sm: {cVersion: "1", cDBVersion: INDEXED_DB.CURRENT_VERSION, cEngine: "x"},
                    accounts: [makeAccountDb({cID: 1})],
                    stocks: [],
                    bookings: [],
                    bookingTypes: []
                }
            ),
            stringifyDatabase: vi.fn(),
            verifyExportIntegrity: vi.fn()
        },
        databaseAdapter: {
            atomicImport: input.atomicImportImpl
                ? vi.fn().mockImplementation(input.atomicImportImpl)
                : vi.fn().mockResolvedValue(undefined),
            // The rollback point is read straight from IndexedDB rather than
            // from the in-memory stores, so that a global `clear` + re-add
            // restores EVERY account's records and not just the active
            // account's (which is all the stores ever hold).
            getAllRecords: input.getAllRecordsImpl
                ? vi.fn().mockImplementation(input.getAllRecordsImpl)
                : vi.fn().mockResolvedValue(
                    input.dbRecords ?? {
                        accountsDB: [],
                        bookingsDB: [],
                        bookingTypesDB: [],
                        stocksDB: []
                    }
                )
        },
        fetchAdapter: {clearCache: vi.fn()}
    };

    const controller = useImportDatabaseDialogController({
        t,
        runtime,
        settings,
        records,
        services: services as unknown as Parameters<typeof useImportDatabaseDialogController>[0]["services"]
    });
    return {controller, services, records, runtime, settings};
}

function makeFile(name: string, content: string, type = "application/json"): File {
    return new File([content], name, {type});
}

describe("useImportDatabaseDialogController", () => {
    describe("file selection", () => {
        it("isFileSelected is false until a file is set", () => {
            const {controller} = makeController();
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("accepts a valid .json file", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "{}");

            await controller.onChange(file);

            expect(controller.isFileSelected.value).toBe(true);
            expect(controller.fileBlob.value.size).toBe(file.size);
            expect(services.browserAdapter.showSystemNotification).not.toHaveBeenCalled();
        });

        it("accepts the first file when given an array", async () => {
            const {controller} = makeController();
            const file = makeFile("backup.json", "{}");

            await controller.onChange([file]);

            expect(controller.fileBlob.value.size).toBe(file.size);
        });

        it("rejects an empty file, resets the input, and reports the specific reason", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "");

            await controller.onChange(file);

            // Regression: onChange used to discard validateFile's specific reason and
            // always show a generic "corrupt backup" message, even for a merely-empty
            // or oversized file that isn't corrupt at all.
            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "components.dialogs.importDatabase.messages.emptyFile"
            );
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("rejects a file without a .json suffix, resets the input, and reports the specific reason", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.txt", "{}");

            await controller.onChange(file);

            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "components.dialogs.importDatabase.messages.invalidSuffix"
            );
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("rejects a file larger than the configured maximum and reports the specific reason", async () => {
            const {controller, services} = makeController();
            const file = makeFile("backup.json", "x");
            Object.defineProperty(file, "size", {value: INDEXED_DB.MAX_FILE_SIZE + 1});

            await controller.onChange(file);

            expect(services.browserAdapter.showSystemNotification).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "components.dialogs.importDatabase.messages.fileToLarge"
            );
            expect(controller.isFileSelected.value).toBe(false);
        });

        it("clears the file when selection is set to null", async () => {
            const {controller} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));
            expect(controller.isFileSelected.value).toBe(true);

            await controller.onChange(null);

            expect(controller.isFileSelected.value).toBe(false);
        });

        it("resetFileInput clears file state and bumps the input key so the <input> remounts", () => {
            const {controller} = makeController();
            const keyBefore = controller.fileInputKey.value;

            controller.resetFileInput();

            expect(controller.fileInputKey.value).toBe(keyBefore + 1);
            expect(controller.files.value).toBeNull();
            expect(controller.isFileSelected.value).toBe(false);
        });
    });

    describe("runImport", () => {
        it("shows a 'no rollback' notice and skips the import when a rollback snapshot can't be taken", async () => {
            // The snapshot now comes from IndexedDB (getAllRecords), not the
            // in-memory stores, so an unreadable DB is what blocks it.
            const {controller, services} = makeController({
                getAllRecordsImpl: () => Promise.reject(new Error("boom"))
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "xx_db_no_rollback"
            );
            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("imports successfully, resets the file input, and reports a summary", async () => {
            const {controller, services, records} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.databaseAdapter.atomicImport).toHaveBeenCalledTimes(1);
            expect(records.init).toHaveBeenCalledTimes(1);
            expect(controller.isFileSelected.value).toBe(false);
            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                expect.stringContaining("components.dialogs.importDatabase.messages.importInfo.account")
            );
        });

        it("asks for confirmation before importing, using a summary of the detected counts", async () => {
            const {controller, services} = makeController();
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackConfirm).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.confirmImportTitle",
                expect.stringContaining("1 components.dialogs.importDatabase.messages.importInfo.account"),
                expect.any(Object)
            );
        });

        it("warns that existing data will be deleted, without repeating a second count breakdown, when there is existing data", async () => {
            // Regression: the summary used to append a second, full
            // count-breakdown of the existing (about-to-be-destroyed) data
            // after the warning line, which read as if the import would
            // leave two datasets behind rather than overwrite one with the
            // other. Only one breakdown (the incoming backup's) should
            // appear now, followed by a short note.
            const {controller, services} = makeController({
                records: makeRecords({
                    accounts: {
                        items: [makeAccountDb({cID: 1}), makeAccountDb({cID: 2})],
                        add: vi.fn(),
                        update: vi.fn(),
                        remove: vi.fn()
                    }
                })
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            const [, summary] = (services.alertAdapter.feedbackConfirm as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(summary).toContain("components.dialogs.importDatabase.confirmExistingDataWarning");
            expect(
                summary.match(/components\.dialogs\.importDatabase\.messages\.importInfo\.account/g)
            ).toHaveLength(1);
        });

        it("does not import when the user declines the confirmation", async () => {
            const {controller, services} = makeController();
            (services.alertAdapter.feedbackConfirm as ReturnType<typeof vi.fn>).mockResolvedValue(false);
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("reports integrity errors and does not import when the backup fails cross-reference checks", async () => {
            const {controller, services} = makeController({integrityErrors: ["orphan booking 1"]});
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackError).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                ["orphan booking 1"],
                {data: {count: 1}}
            );
            expect(services.databaseAdapter.atomicImport).not.toHaveBeenCalled();
        });

        it("rolls back to the pre-import snapshot when atomicImport fails", async () => {
            let atomicImportCalls = 0;
            const {controller, services, records, settings} = makeController({
                activeAccountId: 7,
                atomicImportImpl: () => {
                    atomicImportCalls += 1;
                    // First call is the real import (fails); the rollback's
                    // clear+restore call should still succeed.
                    return atomicImportCalls === 1
                        ? Promise.reject(new Error("disk full"))
                        : Promise.resolve();
                }
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(atomicImportCalls).toBe(2);
            expect(records.init).toHaveBeenCalled();
            expect(settings.activeAccountId).toBe(7);
            expect(services.alertAdapter.feedbackError).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "disk full",
                {data: "IMPORT_DATABASE_PROCESS"}
            );
            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "xx_db_rollback"
            );
        });

        // The rollback restores with a GLOBAL `clear` of each store, so its
        // snapshot must contain every account's records. It used to be taken
        // from the in-memory stores, which hold ALL accounts but only the
        // ACTIVE account's bookings/bookingTypes/stocks — so a failed import
        // wiped every other account's data while reporting success. The
        // accounts themselves survived, so they still showed in the switcher
        // but came back empty.
        it("restores every account's records on rollback, not just the active account's", async () => {
            let atomicImportCalls = 0;
            const dbRecords = {
                accountsDB: [makeAccountDb({cID: 1}), makeAccountDb({cID: 2})],
                bookingsDB: [
                    {cID: 10, cAccountNumberID: 1},
                    {cID: 20, cAccountNumberID: 2}
                ],
                bookingTypesDB: [
                    {cID: 100, cAccountNumberID: 1, cRole: "other"},
                    {cID: 200, cAccountNumberID: 2, cRole: "other"}
                ],
                stocksDB: [
                    {cID: 1000, cAccountNumberID: 1},
                    {cID: 2000, cAccountNumberID: 2}
                ]
            };
            const {controller, services} = makeController({
                activeAccountId: 1,
                dbRecords,
                atomicImportImpl: () => {
                    atomicImportCalls += 1;
                    return atomicImportCalls === 1
                        ? Promise.reject(new Error("disk full"))
                        : Promise.resolve();
                }
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            // Second atomicImport call is the rollback restore.
            const rollbackDescriptors = (
                services.databaseAdapter.atomicImport as ReturnType<typeof vi.fn>
            ).mock.calls[1][0] as Array<{
                storeName: string;
                operations: Array<{ type: string; data?: { cID: number } }>
            }>;

            const restoredIds = (storeName: string): number[] =>
                rollbackDescriptors
                    .find((d) => d.storeName === storeName)!
                    .operations.filter((op) => op.type === "add")
                    .map((op) => op.data!.cID);

            // Account 2's rows must be back in the DB, not just account 1's.
            expect(restoredIds(INDEXED_DB.STORE.BOOKINGS.NAME)).toEqual([10, 20]);
            expect(restoredIds(INDEXED_DB.STORE.BOOKING_TYPES.NAME)).toEqual([100, 200]);
            expect(restoredIds(INDEXED_DB.STORE.STOCKS.NAME)).toEqual([1000, 2000]);
            expect(restoredIds(INDEXED_DB.STORE.ACCOUNTS.NAME)).toEqual([1, 2]);
        });

        // ...while the in-memory stores must still receive ONLY the active
        // account's rows, matching what getAccountRecords/buildModernImportPlan
        // load. Otherwise, the other accounts' bookings would be spliced into
        // the active account's list and counted in its balances.
        it("re-hydrates the in-memory stores with only the active account's records", async () => {
            let atomicImportCalls = 0;
            const {controller, records} = makeController({
                activeAccountId: 1,
                dbRecords: {
                    accountsDB: [makeAccountDb({cID: 1}), makeAccountDb({cID: 2})],
                    bookingsDB: [
                        {cID: 10, cAccountNumberID: 1, cBookDate: "2026-01-01", cExDate: "2026-01-01"},
                        {cID: 20, cAccountNumberID: 2, cBookDate: "2026-01-01", cExDate: "2026-01-01"}
                    ],
                    bookingTypesDB: [
                        {cID: 100, cAccountNumberID: 1, cRole: "other", cName: "A"},
                        {cID: 200, cAccountNumberID: 2, cRole: "other", cName: "B"}
                    ],
                    stocksDB: [
                        {cID: 1000, cAccountNumberID: 1},
                        {cID: 2000, cAccountNumberID: 2}
                    ]
                },
                atomicImportImpl: () => {
                    atomicImportCalls += 1;
                    return atomicImportCalls === 1
                        ? Promise.reject(new Error("disk full"))
                        : Promise.resolve();
                }
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            const initArg = (records.init as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
                accountsDB: Array<{ cID: number }>;
                bookingsDB: Array<{ cID: number }>;
                bookingTypesDB: Array<{ cID: number }>;
                stocksDB: Array<{ cID: number }>;
            };

            // Every account is listed (the account switcher needs them all)...
            expect(initArg.accountsDB.map((a) => a.cID)).toEqual([1, 2]);
            // ...but the per-account collections are scoped to the active one.
            expect(initArg.bookingsDB.map((b) => b.cID)).toEqual([10]);
            expect(initArg.bookingTypesDB.map((bt) => bt.cID)).toEqual([100]);
            expect(initArg.stocksDB.map((s) => s.cID)).toEqual([1000]);
        });

        it("re-hydrates rollback bookings raw, without re-applying booking-type role invariants", async () => {
            // Regression: restoreFromRollback used to run
            // validateBooking + applyBookingRoleInvariants on rollbackData.bookings
            // before feeding them to records.init — sanitizing appropriate for a
            // not-yet-trusted backup file (buildModernImportPlan's job), but wrong
            // here: rollbackData came from getAllRecords (IndexedDB itself), the DB
            // write just above restores these same rows VERBATIM, and a booking
            // type's role can legally change after a booking was written
            // (updateBookingTypeUsecase). Re-deriving cStockID/cCount from the
            // type's CURRENT role silently diverged the in-memory store from the
            // DB the rollback had just restored — here, a stock-related booking
            // recorded under a type whose role is now "other" would have its
            // cStockID/cCount zeroed in the store only.
            let atomicImportCalls = 0;
            const {controller, records} = makeController({
                activeAccountId: 1,
                dbRecords: {
                    accountsDB: [makeAccountDb({cID: 1})],
                    bookingsDB: [
                        {
                            cID: 10, cAccountNumberID: 1, cBookDate: "2026-01-01", cExDate: "2026-01-01",
                            cBookingTypeID: 100, cStockID: 5, cCount: 10, cDebit: 100, cCredit: 0
                        }
                    ],
                    bookingTypesDB: [
                        {cID: 100, cAccountNumberID: 1, cRole: "other", cName: "A"}
                    ],
                    stocksDB: []
                },
                atomicImportImpl: () => {
                    atomicImportCalls += 1;
                    return atomicImportCalls === 1
                        ? Promise.reject(new Error("disk full"))
                        : Promise.resolve();
                }
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            const initArg = (records.init as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
                bookingsDB: Array<{ cID: number; cStockID: number; cCount: number }>;
            };

            // applyBookingRoleInvariants would zero cStockID/cCount for an
            // "other"-role type; the raw DB row (restored verbatim above) keeps
            // them, and the store must match it exactly.
            expect(initArg.bookingsDB).toEqual([
                {
                    cID: 10, cAccountNumberID: 1, cBookDate: "2026-01-01", cExDate: "2026-01-01",
                    cBookingTypeID: 100, cStockID: 5, cCount: 10, cDebit: 100, cCredit: 0
                }
            ]);
        });

        it("does not claim the rollback succeeded when the rollback's own DB restore also fails", async () => {
            const {controller, services} = makeController({
                activeAccountId: 7,
                // Both the real import and the rollback's own atomicImport reject.
                atomicImportImpl: () => Promise.reject(new Error("disk full"))
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            expect(services.alertAdapter.feedbackError).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                expect.any(Error),
                {data: "Rollback failed"}
            );
            expect(services.alertAdapter.feedbackInfo).not.toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "xx_db_rollback"
            );
        });

        it("does not report a failed rollback when only the post-restore activeAccountId persistence fails (DB itself was restored)", async () => {
            let atomicImportCalls = 0;
            let setStorageCalls = 0;
            const {controller, services} = makeController({
                activeAccountId: 7,
                atomicImportImpl: () => {
                    atomicImportCalls += 1;
                    // First call is the real import (fails); the rollback's own
                    // atomicImport (the actual DB restore) succeeds.
                    return atomicImportCalls === 1
                        ? Promise.reject(new Error("disk full"))
                        : Promise.resolve();
                },
                // First 2 calls (the initial setActiveAccountIdPersisted, then the
                // outer catch's revert-on-import-failure) must succeed so the flow
                // actually reaches restoreFromRollback; only its own 3rd call (the
                // rollback's post-DB-restore activeAccountId persistence) fails.
                setStorageImpl: () => {
                    setStorageCalls += 1;
                    return setStorageCalls <= 2
                        ? Promise.resolve()
                        : Promise.reject(new Error("quota exceeded"));
                }
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await controller.runImport();

            // Must not be reported as "Rollback failed" - the DB write already
            // committed successfully; only a settings-storage persistence step failed.
            expect(services.alertAdapter.feedbackError).not.toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                expect.anything(),
                {data: "Rollback failed"}
            );
            expect(services.alertAdapter.feedbackError).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                expect.any(Error),
                {data: "Rollback DB restore succeeded, in-memory re-hydration failed"}
            );
            expect(services.alertAdapter.feedbackInfo).toHaveBeenCalledWith(
                "components.dialogs.importDatabase.title",
                "xx_db_rollback"
            );
        });

        it("attempts a rollback and rethrows when the error handler itself fails", async () => {
            const {controller, services, settings} = makeController({
                activeAccountId: 7,
                atomicImportImpl: () => Promise.reject(new Error("disk full")),
                feedbackErrorImpl: () => Promise.reject(new Error("alert channel down"))
            });
            await controller.onChange(makeFile("backup.json", "{}"));

            await expect(controller.runImport()).rejects.toThrow("alert channel down");

            // The usecase itself already restored the original active account before
            // the composable's outer rollback runs a second, redundant restore pass.
            expect(settings.activeAccountId).toBe(7);
            expect(services.databaseAdapter.atomicImport).toHaveBeenCalled();
        });
    });
});