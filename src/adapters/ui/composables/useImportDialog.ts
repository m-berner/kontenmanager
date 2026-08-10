/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {computed, ref} from "vue";

import {importDatabaseUsecase} from "@/app/usecases/backup";
import {
    type RecordsLike,
    setActiveAccountIdPersisted,
    toRecordsPort,
    toSettingsPort
} from "@/app/usecases/portAdapters";
import type {RuntimePort, SettingsPort} from "@/app/usecases/ports";

import {INDEXED_DB} from "@/domain/constants";
import {ERROR_DEFINITIONS, isAppError, isConfirmDialogBusyError} from "@/domain/errors";
import {applyBookingRoleInvariants} from "@/domain/logic";
import type {RecordOperation, RollbackData, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {validateBooking} from "@/domain/validation/validators";

import type {Adapters, AlertAdapter, BrowserAdapter, DatabaseAdapter} from "@/adapters/driven/types";

type TFunction = (key: string, params?: Record<string, unknown>) => string;
type RuntimeLike = RuntimePort & {
    // Used by CompanyContent to decide whether online data needs loading.
    // After importing a backup, we must invalidate this in-memory cache.
    clearStocksPages?: () => void;
};
type SettingsLike = SettingsPort;
type ImportExportService = Adapters["importExportAdapter"];
type FetchService = Adapters["fetchAdapter"];

export function useImportDatabaseDialogController(input: {
    t: TFunction;
    runtime: RuntimeLike;
    settings: SettingsLike;
    records: RecordsLike;
    services: {
        browserAdapter: BrowserAdapter;
        alertAdapter: AlertAdapter;
        storageAdapter: () => { setStorage: (_key: string, _value: StorageValueType) => Promise<void> };
        importExportAdapter: ImportExportService;
        databaseAdapter: Pick<DatabaseAdapter, "atomicImport" | "getAllRecords">;
        fetchAdapter?: FetchService;
    };
}) {
    const files = ref<File[] | File | null>(null);
    const fileBlob = ref<Blob>(new Blob());
    const fileInputKey = ref(0);

    const isFileSelected = computed(() => fileBlob.value.size > 0);

    const resetFileInput = () => {
        fileBlob.value = new Blob();
        files.value = null;
        fileInputKey.value++;
    };

    const validateFile = (file: File): string | null => {
        if (file.size === 0) return input.t("components.dialogs.importDatabase.messages.emptyFile");
        if (file.size > INDEXED_DB.MAX_FILE_SIZE) return input.t("components.dialogs.importDatabase.messages.fileToLarge");
        // Lower-cased before comparing. The two checks above are content-based
        // and cannot reject a good file; this one is a string comparison, and
        // case-sensitively it rejected `backup.JSON` — which Windows users can
        // easily produce — as an "invalid suffix" despite perfectly valid
        // content.
        if (!file.name.toLowerCase().endsWith(".json")) return input.t("components.dialogs.importDatabase.messages.invalidSuffix");
        return null;
    };

    const onChange = async (selectedFile: File | File[] | null): Promise<void> => {
        if (selectedFile === null) {
            fileBlob.value = new Blob();
            return;
        }

        const file = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile;
        if (!file) {
            fileBlob.value = new Blob();
            return;
        }

        const validationError = validateFile(file);
        if (validationError) {
            await input.services.browserAdapter.showSystemNotification(
                input.t("components.dialogs.importDatabase.title"),
                validationError
            );
            resetFileInput();
            return;
        }

        fileBlob.value = file;
    };

    const toImportRecords = <T, >(data: T[]): RecordOperation[] =>
        data.map((rec) => ({type: "add" as const, data: rec}));

    const countsToSummary = (counts: {
        accounts: number;
        stocks: number;
        bookings: number;
        bookingTypes: number
    }): string => {
        return [
            `${counts.accounts} ${input.t("components.dialogs.importDatabase.messages.importInfo.account")}`,
            `${counts.stocks} ${input.t("components.dialogs.importDatabase.messages.importInfo.stock")}`,
            `${counts.bookings} ${input.t("components.dialogs.importDatabase.messages.importInfo.booking")}`,
            `${counts.bookingTypes} ${input.t("components.dialogs.importDatabase.messages.importInfo.bookingType")}`
        ].join("\n");
    };

    const createRollbackPoint = async (): Promise<RollbackData | null> => {
        try {
            // Read straight from IndexedDB, NOT from the in-memory stores.
            // Those are asymmetric by design (databaseAdapter.getAccountRecords
            // loads all accounts but only the *active* account's bookings/
            // bookingTypes/stocks), while restoreFromRollback below re-adds
            // this snapshot after a GLOBAL `clear` of each store. Snapshotting
            // the stores therefore wiped every other account's bookings,
            // stocks and booking types on any failed import — the accounts
            // themselves survived, so they still appeared in the switcher but
            // came back empty, with the rollback reporting success.
            //
            // Reading from the DB also drops the in-memory-only placeholder
            // stock (cID 0, createPlaceholderStock) that the store carries for
            // BookingForm's blank picker option, which the old snapshot would
            // otherwise have written into the stocks object store.
            //
            // No cloning needed here (unlike the old store-based snapshot,
            // which had to defend against useOnlineStockData mutating store
            // items in place): these are fresh objects deserialized out of
            // IndexedDB and nothing else holds a reference to them.
            const db = await input.services.databaseAdapter.getAllRecords();
            return {
                accounts: db.accountsDB,
                stocks: db.stocksDB,
                bookingTypes: db.bookingTypesDB,
                bookings: db.bookingsDB,
                activeAccountId: input.settings.activeAccountId
            };
        } catch (err) {
            const errorMessage =
                isAppError(err) ? err.message : err instanceof Error ? err.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG;
            log("COMPONENTS DIALOGS ImportDatabase: Failed to create the rollback point", errorMessage);
            return null;
        }
    };

    const restoreFromRollback = async (rollbackData: RollbackData): Promise<boolean> => {
        const {setStorage} = input.services.storageAdapter();
        const atomicImport = input.services.databaseAdapter.atomicImport;

        try {
            log("COMPONENTS DIALOGS ImportDatabase: Starting rollback");

            await atomicImport([
                {
                    storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
                    operations: [{type: "clear"}, ...toImportRecords(rollbackData.accounts)]
                },
                {
                    storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                    operations: [{type: "clear"}, ...toImportRecords(rollbackData.bookingTypes)]
                },
                {
                    storeName: INDEXED_DB.STORE.STOCKS.NAME,
                    operations: [{type: "clear"}, ...toImportRecords(rollbackData.stocks)]
                },
                {
                    storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
                    operations: [{type: "clear"}, ...toImportRecords(rollbackData.bookings)]
                }
            ]);
        } catch (err) {
            await input.services.alertAdapter.feedbackError(input.t("components.dialogs.importDatabase.title"), err, {
                data: "Rollback failed"
            });
            return false;
        }

        try {
            // These are post-DB-restore steps, same severity class as records.init()
            // below (the DB write above already committed) - a failure here must not
            // be reported as "Rollback failed", which would wrongly suggest the DB
            // itself is still corrupted.
            // Through `setActiveAccountIdPersisted`, not a bare ref assignment
            // followed by a separate `setStorage`. That pairing had no rollback:
            // if the write rejected, the in-memory active account and the
            // persisted one disagreed until the next reload — and the surrounding
            // catch reported it as a generic post-restore failure rather than
            // restoring the previous id. This helper reverts the in-memory value
            // itself, so the two can never diverge.
            await setActiveAccountIdPersisted(
                {settings: input.settings, setStorage},
                rollbackData.activeAccountId
            );

            // The DB above is restored in full (every account), but the
            // in-memory stores hold only the ACTIVE account's bookings/
            // bookingTypes/stocks — the same contract getAccountRecords and
            // buildModernImportPlan's initData follow. Filter here, or the
            // other accounts' rows would be spliced into the active account's
            // lists and counted in its balances.
            const activeId = rollbackData.activeAccountId;
            const activeBookingTypes = rollbackData.bookingTypes.filter(
                (bt) => bt.cAccountNumberID === activeId
            );

            await input.records.init(
                {
                    accountsDB: rollbackData.accounts,
                    bookingsDB: rollbackData.bookings
                        .filter((b) => b.cAccountNumberID === activeId)
                        .map((b: unknown) => validateBooking(b))
                        .map((b) => applyBookingRoleInvariants(b, activeBookingTypes)),
                    bookingTypesDB: activeBookingTypes,
                    stocksDB: rollbackData.stocks.filter(
                        (s) => s.cAccountNumberID === activeId
                    )
                },
                {
                    title: input.t("mixed.smImportOnly.title"),
                    message: input.t("mixed.smImportOnly.message")
                }
            );

            // Ensure UI triggers online reload when returning to CompanyContent.
            input.runtime.clearStocksPages?.();

            log("COMPONENTS DIALOGS ImportDatabase: Rollback completed successfully");
        } catch (err) {
            // The database was already restored successfully above (the
            // `atomicImport` in the first try block committed). This failure
            // only affects re-hydrating the in-memory stores from that
            // already-correct data, so it must not be reported as a failed
            // rollback (that would wrongly suggest the DB is still corrupted).
            log(
                "COMPONENTS DIALOGS ImportDatabase: Rollback DB restore succeeded but in-memory re-hydration failed",
                err,
                "warn"
            );
            await input.services.alertAdapter.feedbackError(input.t("components.dialogs.importDatabase.title"), err, {
                data: "Rollback DB restore succeeded, in-memory re-hydration failed"
            });
            return true;
        }

        return true;
    };

    /**
     * Asks one of the import's two confirmations.
     *
     * `alerts.confirm()` REJECTS rather than resolving false when a confirmation
     * dialog is already open (see `stores/alerts.ts`), and that rejection means
     * "not confirmed" — `useMenu.confirmDestructive` states the contract. Both
     * import confirmations used to let it propagate: it escaped
     * `importDatabaseUsecase` into `runImport`'s catch, which ran a full
     * rollback and showed a database error, telling the user their import had
     * failed when all that happened was that another dialog was up. (Nothing was
     * corrupted — the confirm precedes any write, so the rollback restored
     * identical data — but the report was wrong.)
     *
     * Only that specific rejection is absorbed. `ALERTS.SINK_UNAVAILABLE` — the
     * confirmation could not be presented at all — is a real failure and must
     * not be read as a "no"; it propagates.
     */
    async function askConfirmation(title: string, message: string): Promise<boolean> {
        try {
            return !!(await input.services.alertAdapter.feedbackConfirm?.(title, message, {
                confirm: {
                    confirmText: input.t("components.dialogs.importDatabase.confirmOk"),
                    cancelText: input.t("components.dialogs.importDatabase.confirmCancel"),
                    type: "warning"
                }
            }));
        } catch (err) {
            if (isConfirmDialogBusyError(err)) {
                log("COMPOSABLES useImportDialog: a confirmation is already open", err, "warn");
                return false;
            }
            throw err;
        }
    }

    async function runImport(): Promise<void> {
        const {setStorage} = input.services.storageAdapter();
        const atomicImport = input.services.databaseAdapter.atomicImport;

        // Filled by `prepareRollback` below, which the usecase calls once the
        // file has parsed, passed validation and been confirmed — so a bad file
        // or a declined confirmation no longer costs a whole-database read.
        let rollbackData: RollbackData | null = null;

        const prepareRollback = async (): Promise<boolean> => {
            rollbackData = await createRollbackPoint();
            if (rollbackData) return true;

            await input.services.alertAdapter.feedbackInfo(
                input.t("components.dialogs.importDatabase.title"),
                input.services.browserAdapter.getMessage("xx_db_no_rollback")
            );
            return false;
        };

        // Guards the two rollback paths below against both running for one
        // failed import. `onError` rolls back and reports; the outer catch does
        // the same, on the stated assumption that it "only runs if that attempt
        // (or the alert it showed) itself threw". Nothing in the types or the
        // call site enforces that `importDatabaseUsecase` cannot both invoke
        // `onError` and throw — and if it does, the user watched the restore run
        // twice and was told "rollback succeeded" twice for one failure.
        // `restoreFromRollback` is a global clear + re-add, so the data ends up
        // correct either way; the cost is duplicated work on a large database
        // and a confusing double report.
        //
        // It also returns `false` when there is no snapshot yet: the failure
        // happened before `prepareRollback` ran, so there is nothing written to
        // undo and nothing to undo it with.
        let rollbackAttempted = false;
        const rollbackOnce = async (): Promise<boolean> => {
            if (rollbackAttempted || !rollbackData) return false;
            rollbackAttempted = true;
            return restoreFromRollback(rollbackData);
        };

        try {
            await importDatabaseUsecase(
                {
                    importExportAdapter: input.services.importExportAdapter,
                    atomicImport,
                    records: toRecordsPort(input.records),
                    settings: toSettingsPort(input.settings),
                    runtime: input.runtime,
                    setStorage,
                    clearStocksPages: input.runtime.clearStocksPages,
                    clearHttpCache: input.services.fetchAdapter?.clearCache
                },
                {
                    fileBlob: fileBlob.value,
                    initMessages: {
                        title: input.t("mixed.smImportOnly.title"),
                        message: input.t("mixed.smImportOnly.message")
                    },
                    onResetFileInput: resetFileInput,
                    onInvalidBackup: async () => {
                        await input.services.alertAdapter.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            input.services.browserAdapter.getMessage("xx_invalid_backup"),
                            {}
                        );
                    },
                    onIntegrityErrors: async (errors, totalCount) => {
                        await input.services.alertAdapter.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            errors,
                            {data: {count: totalCount}}
                        );
                    },
                    confirmUndatedBookings: async (counts) => {
                        // A separate, earlier dialog rather than an extra line
                        // in the import confirmation below: this one is about
                        // the quality of the incoming file, the other about
                        // destroying the existing database, and folding them
                        // together would make a single OK mean both.
                        return await askConfirmation(
                            input.t("components.dialogs.importDatabase.confirmUndatedTitle"),
                            input.t("components.dialogs.importDatabase.confirmUndatedWarning", {
                                count: counts.undatedBookings,
                                total: counts.bookings
                            })
                        );
                    },
                    confirmProceed: async (counts, existingCounts) => {
                        const hasExistingData =
                            existingCounts.accounts > 0 ||
                            existingCounts.stocks > 0 ||
                            existingCounts.bookings > 0 ||
                            existingCounts.bookingTypes > 0;
                        const summary = hasExistingData
                            ? [
                                countsToSummary(counts),
                                "",
                                input.t("components.dialogs.importDatabase.confirmExistingDataWarning"),
                                countsToSummary(existingCounts)
                            ].join("\n")
                            : countsToSummary(counts);
                        return await askConfirmation(
                            input.t("components.dialogs.importDatabase.confirmImportTitle"),
                            summary
                        );
                    },
                    onImported: async (counts) => {
                        await input.services.alertAdapter.feedbackInfo(
                            input.t("components.dialogs.importDatabase.title"),
                            countsToSummary(counts)
                        );
                    },
                    prepareRollback,
                    onError: async (message, didAttemptWrite) => {
                        // Only restore when the import actually reached
                        // `atomicImport`. Every failure used to trigger a full
                        // clear-and-rewrite of all four stores — including ones
                        // that wrote nothing at all: a malformed or oversize
                        // file rejected by `readJsonFile`, non-object JSON, or a
                        // rejected `setStorage`. The user was then told
                        // "rollback succeeded" for an import that had never
                        // begun, after two complete passes over their database.
                        const restored = didAttemptWrite ? await rollbackOnce() : false;
                        await input.services.alertAdapter.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            message,
                            {data: "IMPORT_DATABASE_PROCESS"}
                        );
                        if (restored) {
                            await input.services.alertAdapter.feedbackInfo(
                                input.t("components.dialogs.importDatabase.title"),
                                input.services.browserAdapter.getMessage("xx_db_rollback")
                            );
                        }
                    }
                }
            );
        } catch (err) {
            // Fallback path: importDatabaseUsecase's `onError` already attempted
            // a rollback above, so this is only meant to run if that attempt (or
            // the alert it showed) itself threw. `rollbackOnce` enforces that
            // rather than assuming it — see its declaration.
            try {
                const restored = await rollbackOnce();
                if (restored) {
                    await input.services.alertAdapter.feedbackInfo(
                        input.t("components.dialogs.importDatabase.title"),
                        input.services.browserAdapter.getMessage("xx_db_rollback")
                    );
                }
            } catch (rollbackErr) {
                await input.services.alertAdapter.feedbackError(
                    input.t("components.dialogs.importDatabase.title"),
                    rollbackErr,
                    {}
                );
            }
            throw err;
        }
    }

    return {
        files,
        fileBlob,
        fileInputKey,
        isFileSelected,
        resetFileInput,
        onChange,
        runImport
    };
}
