/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ImportExportPort, RecordsPort, RuntimePort, SettingsPort} from "@/app/usecases/ports";

import {BROWSER_STORAGE, INDEXED_DB} from "@/domain/constants";
import {isAppError} from "@/domain/errors";
import type {BatchOperationDescriptor, LegacyBackupData, ModernBackupData, StorageValueType} from "@/domain/types";

import {buildLegacyImportPlan, buildModernImportPlan, getImportCounts, type ImportCounts} from "./importHelpers";

const SM_RESTORE_ACCOUNT_ID = 1;

export type ImportDatabaseUsecaseDeps = {
    importExportAdapter: ImportExportPort;
    atomicImport: (stores: BatchOperationDescriptor[]) => Promise<void>;
    records: RecordsPort;
    settings: SettingsPort;
    runtime: RuntimePort;
    setStorage: (key: string, value: StorageValueType) => Promise<void>;
    clearStocksPages?: () => void;
    clearHttpCache?: () => void;
};

export async function importDatabaseUsecase(
    deps: ImportDatabaseUsecaseDeps,
    input: {
        fileBlob: Blob;
        initMessages: { title: string; message: string };
        legacyDefaultBookingTypeLabels: {
            buy: string;
            sell: string;
            dividend: string;
            other: string;
            fee: string;
            tax: string;
        };
        onResetFileInput: () => void;
        onInvalidBackup: () => Promise<void>;
        onLegacyAlreadyRestored: () => Promise<void>;
        onIntegrityErrors: (_errors: string[], _totalCount: number) => Promise<void>;
        confirmProceed: (_counts: ImportCounts) => Promise<boolean>;
        onUnsupportedVersion: () => Promise<void>;
        onImported: (_counts: ImportCounts) => Promise<void>;
        onError: (_message: string) => Promise<void>;
    }
): Promise<void> {
    const originalActiveId = deps.settings.activeAccountId;

    const rollbackAndError = async (message: string) => {
        deps.settings.activeAccountId = originalActiveId;
        await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
        await input.onError(message);
    };

    try {
        const backup = await deps.importExportAdapter.readJsonFile(input.fileBlob);
        const validation = deps.importExportAdapter.validateBackup(backup);

        if (!validation.isValid) {
            await input.onInvalidBackup();
            return;
        }

        if (
            validation.version === INDEXED_DB.LEGACY_IMPORT_VERSION &&
            deps.records.accounts.items.length > 0
        ) {
            await input.onLegacyAlreadyRestored();
            return;
        }

        const dataIntegrityErrors =
            validation.version === INDEXED_DB.LEGACY_IMPORT_VERSION
                ? deps.importExportAdapter.validateLegacyDataIntegrity(backup)
                : deps.importExportAdapter.validateDataIntegrity(backup);

        if (dataIntegrityErrors.length > 0) {
            await input.onIntegrityErrors(
                sliceIntegrityErrors(dataIntegrityErrors),
                dataIntegrityErrors.length
            );

            deps.runtime.resetTeleport();
            return;
        }

        const counts = getImportCounts(backup);
        const shouldProceed = await input.confirmProceed(counts);
        if (!shouldProceed) return;

        const activeId =
            "transfers" in backup
                ? SM_RESTORE_ACCOUNT_ID
                : (backup as ModernBackupData).accounts?.[0]?.cID ?? SM_RESTORE_ACCOUNT_ID;
        deps.settings.activeAccountId = activeId;
        await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeId);

        if (backup.sm.cDBVersion === INDEXED_DB.LEGACY_IMPORT_VERSION) {
            if (!("transfers" in backup)) {
                await rollbackAndError("Legacy backup expected 'transfers' array");
                return;
            }
            const plan = buildLegacyImportPlan({
                backup: backup as LegacyBackupData,
                activeId,
                labels: input.legacyDefaultBookingTypeLabels,
                transformLegacyStock: deps.importExportAdapter.transformLegacyStock,
                transformLegacyBooking: deps.importExportAdapter.transformLegacyBooking
            });
            await deps.atomicImport(plan.descriptors);
            await deps.records.init(plan.initData, input.initMessages);
        } else if (backup.sm.cDBVersion > INDEXED_DB.LEGACY_IMPORT_VERSION) {
            if ("transfers" in backup) {
                await rollbackAndError("Modern backup must not contain 'transfers'");
                return;
            }
            const plan = buildModernImportPlan({backup, activeId});
            await deps.atomicImport(plan.descriptors);
            await deps.records.init(plan.initData, input.initMessages);
        } else {
            await input.onUnsupportedVersion();
            deps.settings.activeAccountId = originalActiveId;
            await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
            return;
        }

        deps.runtime.resetTeleport();
        deps.clearStocksPages?.();
        deps.clearHttpCache?.();
        await input.onImported(counts);
        input.onResetFileInput();
    } catch (err) {
        deps.settings.activeAccountId = originalActiveId;
        await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
        const errorMessage =
            isAppError(err) ? err.message : err instanceof Error ? err.message : "Unknown error";
        await input.onError(errorMessage);
    }
}

function sliceIntegrityErrors(errors: string[], maxShown = 5): string[] {
    const shownErrors = errors.slice(0, maxShown);
    if (errors.length > maxShown) {
        shownErrors.push(`...and ${errors.length - maxShown} more`);
    }
    return shownErrors;
}
