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
        /**
         * Take the pre-import snapshot. Called once, immediately before the
         * first write and after both confirmations — so a file that fails to
         * parse, fails validation, or is declined never triggers a
         * whole-database read.
         *
         * @returns `false` when no snapshot could be taken, which aborts the
         *   import: writing without a way back is worse than not importing.
         */
        prepareRollback: () => Promise<boolean>;
        onImported: (_counts: ImportCounts) => Promise<void>;
        /**
         * @param _message - The failure to report.
         * @param _didAttemptWrite - Whether `atomicImport` was reached. `false`
         *   means the database is untouched and a rollback would clear and
         *   rewrite every store to undo nothing — see the flag's declaration.
         */
        onError: (_message: string, _didAttemptWrite: boolean) => Promise<void>;
    }
): Promise<void> {
    const originalActiveId = deps.settings.activeAccountId;
    /**
     * Whether the import got as far as writing to IndexedDB.
     *
     * Set immediately *before* `atomicImport` rather than after, deliberately:
     * `transactionManager.execute` logs "abort failed — writes may have been
     * committed" for the case where the transaction auto-committed before the
     * error was thrown, so a throw out of `atomicImport` is not proof that
     * nothing landed. Erring toward "we wrote" costs a redundant restore; the
     * other direction loses data.
     */
    let didAttemptWrite = false;

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
            // Excludes the cID-0 placeholder stock every account's stocks
            // store carries (createPlaceholderStock, domain/logic.ts) so
            // BookingForm's stock picker has a blank entry — `records.init`
            // adds it unconditionally, including at boot with zero accounts.
            // Counting it made `existingCounts.stocks` at least 1 always, so
            // `hasExistingData` (useImportDialog.ts) was true even on a
            // freshly installed, genuinely empty database — the confirmation
            // warned about deleting data that did not exist.
            stocks: deps.records.stocks.items.filter((s) => s.cID > 0).length,
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

        // Snapshot for rollback, taken HERE — after the file has parsed, passed
        // validation and been confirmed — rather than before any of it. It used
        // to be the first thing the dialog did, so choosing a malformed or
        // oversize file, or declining either confirmation, still read the entire
        // database into memory for a rollback that could not be needed.
        //
        // It must still precede `setActiveAccountIdPersisted` below, because the
        // snapshot carries `activeAccountId` and the rollback restores it.
        if (!(await input.prepareRollback())) {
            input.onResetFileInput();
            return;
        }

        // buildModernImportPlan filters records by === against normalized (Number-coerced)
        // cAccountNumberID values, so activeId must be coerced the same way here — a backup
        // with string-typed IDs (e.g. hand-edited JSON) would otherwise never match and
        // leave the post-import in-memory records empty despite a successful DB write.
        // An empty accounts array (validateBackup only checks Array.isArray, not length, so
        // this passes validation) must land on the documented "no active account" sentinel
        // (README.md §2.3) instead of falling back to SM_RESTORE_ACCOUNT_ID, which would
        // otherwise point activeAccountId at an account that doesn't exist in the import.
        const activeId = backup.accounts && backup.accounts.length > 0
            ? Number(backup.accounts[0]?.cID ?? SM_RESTORE_ACCOUNT_ID)
            : INDEXED_DB.INVALID_ID;
        await setActiveAccountIdPersisted(deps, activeId);

        const plan = buildModernImportPlan({backup, activeId});
        didAttemptWrite = true;
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
        await input.onError(errorMessage, didAttemptWrite);
    }
}

function sliceIntegrityErrors(errors: string[], maxShown = 5): string[] {
    const shownErrors = errors.slice(0, maxShown);
    if (errors.length > maxShown) {
        shownErrors.push(`...and ${errors.length - maxShown} more`);
    }
    return shownErrors;
}
