/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {computed, ref} from "vue";

import {importDatabaseUsecase} from "@/app/usecases/backup";
import {type RecordsLike, toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";
import type {RuntimePort, SettingsPort} from "@/app/usecases/ports";

import {BROWSER_STORAGE, INDEXED_DB} from "@/domain/constants";
import {isAppError} from "@/domain/errors";
import type {RecordOperation, RollbackData, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {validateBooking} from "@/domain/validation/validators";

import type {AlertService, BrowserService, DatabaseService, Services} from "@/adapters/secondary/types";

type TFunction = (key: string, params?: Record<string, unknown>) => string;
type RuntimeLike = RuntimePort & {
    // Used by CompanyContent to decide whether online data needs loading.
    // After importing a backup, we must invalidate this in-memory cache.
    clearStocksPages?: () => void;
};
type SettingsLike = SettingsPort;
type ImportExportService = Services["importExportService"];
type FetchService = Services["fetchService"];

export function useImportDatabaseDialogController(input: {
    t: TFunction;
    runtime: RuntimeLike;
    settings: SettingsLike;
    records: RecordsLike;
    services: {
        browserService: BrowserService;
        alertService: AlertService;
        storageAdapter: () => { setStorage: (_key: string, _value: StorageValueType) => Promise<void> };
        importExportService: ImportExportService;
        databaseService: Pick<DatabaseService, "atomicImport">;
        fetchService?: FetchService;
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
        if (!file.name.endsWith(".json")) return input.t("components.dialogs.importDatabase.messages.invalidSuffix");
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
            await input.services.browserService.showSystemNotification(
                input.t("components.dialogs.importDatabase.title"),
                input.services.browserService.getMessage("xx_invalid_backup")
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
            return {
                accounts: [...input.records.accounts.items],
                stocks: [...input.records.stocks.items],
                bookingTypes: [...input.records.bookingTypes.items],
                bookings: [...input.records.bookings.items],
                activeAccountId: input.settings.activeAccountId
            };
        } catch (err) {
            const errorMessage =
                isAppError(err) ? err.message : err instanceof Error ? err.message : "Unknown error";
            log("COMPONENTS DIALOGS ImportDatabase: Failed to create the rollback point", errorMessage);
            return null;
        }
    };

    const restoreFromRollback = async (rollbackData: RollbackData): Promise<void> => {
        const {setStorage} = input.services.storageAdapter();
        const atomicImport = input.services.databaseService.atomicImport;

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

            input.settings.activeAccountId = rollbackData.activeAccountId;
            await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, rollbackData.activeAccountId);

            input.records.init(
                {
                    accountsDB: rollbackData.accounts,
                    bookingsDB: rollbackData.bookings.map((b) => validateBooking(b)),
                    bookingTypesDB: rollbackData.bookingTypes,
                    stocksDB: rollbackData.stocks
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
            await input.services.alertService.feedbackError(input.t("components.dialogs.importDatabase.title"), err, {
                data: "Rollback failed"
            });
        }
    };

    async function runImport(): Promise<void> {
        const {setStorage} = input.services.storageAdapter();
        const atomicImport = input.services.databaseService.atomicImport;

        const rollbackData = await createRollbackPoint();
        if (!rollbackData) {
            await input.services.alertService.feedbackInfo(
                input.t("components.dialogs.importDatabase.title"),
                input.services.browserService.getMessage("xx_db_no_rollback")
            );
            return;
        }

        try {
            await importDatabaseUsecase(
                {
                    importExportService: input.services.importExportService,
                    atomicImport,
                    records: toRecordsPort(input.records),
                    settings: toSettingsPort(input.settings),
                    runtime: input.runtime,
                    setStorage,
                    clearStocksPages: input.runtime.clearStocksPages,
                    clearHttpCache: input.services.fetchService?.clearCache
                },
                {
                    fileBlob: fileBlob.value,
                    initMessages: {
                        title: input.t("mixed.smImportOnly.title"),
                        message: input.t("mixed.smImportOnly.message")
                    },
                    legacyDefaultBookingTypeLabels: {
                        buy: input.t("components.dialogs.importDatabase.buy"),
                        sell: input.t("components.dialogs.importDatabase.sell"),
                        dividend: input.t("components.dialogs.importDatabase.dividend"),
                        other: input.t("components.dialogs.importDatabase.other"),
                        fee: input.t("components.dialogs.importDatabase.fee"),
                        tax: input.t("components.dialogs.importDatabase.tax")
                    },
                    onResetFileInput: resetFileInput,
                    onInvalidBackup: async () => {
                        await input.services.alertService.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            input.services.browserService.getMessage("xx_invalid_backup"),
                            {}
                        );
                    },
                    onLegacyAlreadyRestored: async () => {
                        await input.services.browserService.showSystemNotification(
                            input.t("components.dialogs.importDatabase.title"),
                            input.services.browserService.getMessage("xx_db_restored")
                        );
                    },
                    onIntegrityErrors: async (errors, totalCount) => {
                        await input.services.alertService.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            errors,
                            {data: {count: totalCount}}
                        );
                    },
                    confirmProceed: async (counts) => {
                        const summary = countsToSummary(counts);
                        return !!(await input.services.alertService.feedbackConfirm?.(
                            input.t("components.dialogs.importDatabase.confirmImportTitle"),
                            summary,
                            {
                                confirm: {
                                    confirmText: input.t("components.dialogs.importDatabase.confirmOk"),
                                    cancelText: input.t("components.dialogs.importDatabase.confirmCancel"),
                                    type: "warning"
                                }
                            }
                        ));
                    },
                    onUnsupportedVersion: async () => {
                        await input.services.alertService.feedbackInfo(
                            input.t("components.dialogs.importDatabase.title"),
                            input.services.browserService.getMessage("xx_db_no_restored")
                        );
                    },
                    onImported: async (counts) => {
                        await input.services.alertService.feedbackInfo(
                            input.t("components.dialogs.importDatabase.title"),
                            countsToSummary(counts)
                        );
                    },
                    onError: async (message) => {
                        await input.services.alertService.feedbackError(
                            input.t("components.dialogs.importDatabase.title"),
                            message,
                            {data: "IMPORT_DATABASE_PROCESS"}
                        );
                    }
                }
            );
        } catch (err) {
            try {
                await restoreFromRollback(rollbackData);
                await input.services.alertService.feedbackInfo(
                    input.t("components.dialogs.importDatabase.title"),
                    input.services.browserService.getMessage("xx_db_rollback")
                );
            } catch (rollbackErr) {
                await input.services.alertService.feedbackError(
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
