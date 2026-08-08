/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {setActiveAccountIdPersisted} from "@/app/usecases/portAdapters";
import type {ImportExportPort, RecordsPort, RuntimePort, SettingsPort} from "@/app/usecases/ports";

import {BROWSER_STORAGE, INDEXED_DB} from "@/domain/constants";
import {ERROR_DEFINITIONS, isAppError} from "@/domain/errors";
import type {BatchOperationDescriptor, StorageValueType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {buildModernImportPlan, getImportCounts, type ImportCounts} from "./importHelpers";

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
        onResetFileInput: () => void;
        onInvalidBackup: () => Promise<void>;
        onIntegrityErrors: (_errors: string[], _totalCount: number) => Promise<void>;
        confirmUndatedBookings: (_counts: ImportCounts) => Promise<boolean>;
        confirmProceed: (_counts: ImportCounts, _existingCounts: ImportCounts) => Promise<boolean>;
        onImported: (_counts: ImportCounts) => Promise<void>;
        onError: (_message: string) => Promise<void>;
    }
): Promise<void> {
    const originalActiveId = deps.settings.activeAccountId;

    try {
        const backup = await deps.importExportAdapter.readJsonFile(input.fileBlob);
        const validation = deps.importExportAdapter.validateBackup(backup);

        if (!validation.isValid) {
            await input.onInvalidBackup();
            return;
        }

        const dataIntegrityErrors = deps.importExportAdapter.validateDataIntegrity(backup);

        if (dataIntegrityErrors.length > 0) {
            await input.onIntegrityErrors(
                sliceIntegrityErrors(dataIntegrityErrors),
                dataIntegrityErrors.length
            );

            deps.runtime.resetTeleport();
            return;
        }

        const counts = getImportCounts(backup);

        // Asked BEFORE the destructive confirmation below, so a user who does
        // not want undated bookings can decline without first having agreed to
        // wipe the existing database.
        //
        // Undated bookings are not rejected outright because dropping them
        // would silently lose real amounts from a backup the user chose to
        // restore, and `normalizeDate` deliberately refuses to invent a date.
        // But they cannot be imported silently either: an undated booking is
        // counted by the all-time totals and by no calendar year, so it makes
        // the accounting dialog's "Total" disagree with the sum of its own
        // per-year rows. This is the only remaining way one can enter the
        // database — both booking usecases now reject a blank date on the form
        // path — so it is the one place the user has to be asked.
        if (counts.undatedBookings > 0) {
            const shouldImportUndated = await input.confirmUndatedBookings(counts);
            if (!shouldImportUndated) {
                // Same treatment as an explicit cancel below: clear the picked
                // file so the dialog no longer looks armed with it, but leave
                // the dialog open so another file can be chosen.
                input.onResetFileInput();
                return;
            }
        }

        // Every import fully clears each store before re-adding the backup's
        // records, so the caller must be able to warn the user about the
        // existing data that is about to be destroyed, not just what's incoming.
        const existingCounts: ImportCounts = {
            accounts: deps.records.accounts.items.length,
            stocks: deps.records.stocks.items.length,
            bookings: deps.records.bookings.items.length,
            bookingTypes: deps.records.bookingTypes.items.length,
            // Not surfaced in the "existing data" warning — that warning is
            // about what is being destroyed, and the undated count only means
            // something for the incoming backup. Present because ImportCounts
            // requires it.
            undatedBookings: 0
        };
        const shouldProceed = await input.confirmProceed(counts, existingCounts);
        if (!shouldProceed) {
            // Clear the picked file on an explicit user cancel. Without this,
            // `fileBlob` stays populated and `isFileSelected` stays true, so the
            // dialog still looks armed with the very file the user just declined
            // to import — one more OK click away from doing it anyway.
            input.onResetFileInput();
            return;
        }

        // buildModernImportPlan filters records by === against normalized (Number-coerced)
        // cAccountNumberID values, so activeId must be coerced the same way here — a backup
        // with string-typed IDs (e.g. hand-edited JSON) would otherwise never match and
        // leave the post-import in-memory records empty despite a successful DB write.
        // An empty accounts array (validateBackup only checks Array.isArray, not length, so
        // this passes validation) must land on the documented "no active account" sentinel
        // (WORKFLOWS.md §2.3) instead of falling back to SM_RESTORE_ACCOUNT_ID, which would
        // otherwise point activeAccountId at an account that doesn't exist in the import.
        const activeId = backup.accounts && backup.accounts.length > 0
            ? Number(backup.accounts[0]?.cID ?? SM_RESTORE_ACCOUNT_ID)
            : INDEXED_DB.INVALID_ID;
        await setActiveAccountIdPersisted(deps, activeId);

        const plan = buildModernImportPlan({backup, activeId});
        await deps.atomicImport(plan.descriptors);
        await deps.records.init(plan.initData, input.initMessages);

        deps.runtime.resetTeleport();
        deps.clearStocksPages?.();
        deps.clearHttpCache?.();

        // The import has already fully committed (DB + in-memory records) by
        // this point; a failure in these purely cosmetic follow-up steps must
        // not fall through to the catch below, which would trigger a full
        // rollback of an already-successful import.
        try {
            await input.onImported(counts);
            input.onResetFileInput();
        } catch (postCommitErr) {
            log("USECASES backup/import: post-commit notification failed", postCommitErr, "warn");
        }
    } catch (err) {
        deps.settings.activeAccountId = originalActiveId;
        // Guarded, unlike the same call on the happy path above. A rejection
        // here used to propagate out of importDatabaseUsecase, so `onError`
        // never ran: the user got no import-failure message at all, and the
        // real reason the import failed (`err`) was discarded in favour of a
        // storage error. That is not a theoretical failure mode in this
        // function — a rejecting `setStorage` is exactly what
        // `setActiveAccountIdPersisted` exists to handle, and it is one of the
        // paths that can land in this catch in the first place.
        //
        // The in-memory value is already restored on the line above, so a
        // failed persist only leaves memory and storage disagreeing until the
        // next successful write — strictly less serious than losing the error.
        try {
            await deps.setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, originalActiveId);
        } catch (restoreErr) {
            log(
                "USECASES backup/import: restoring the previous active account id failed",
                restoreErr,
                "warn"
            );
        }
        const errorMessage =
            isAppError(err) ? err.message : err instanceof Error ? err.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG;
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
