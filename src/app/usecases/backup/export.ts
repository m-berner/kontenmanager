/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BrowserPort, ImportExportPort, RuntimePort} from "@/app/usecases/ports";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {RepositoryMap} from "@/domain/types";

import {
    createExportMetadata,
    estimateSizeKb,
    findExportConsistencyIssues,
    hasExportConsistencyIssues
} from "./exportHelpers";

/**
 * Size (KB) above which the user is asked to confirm the export.
 *
 * A warning, not a limit — see {@link MAX_EXPORT_SIZE_KB}, which is.
 */
const LARGE_FILE_THRESHOLD_KB = 10000;

/**
 * Hard cap on an export, expressed as the exact size the import path rejects.
 *
 * The two ends of the backup round trip used to use different numbers and only
 * one of them was a limit: export confirmed above ~9.8 MB and then wrote
 * whatever it was given, while import throws `IMPORT_EXPORT_SERVICE.F` above
 * `INDEXED_DB.MAX_FILE_SIZE` (64 MB) and `useImportDialog.validateFile` rejects
 * the same size client-side. So a database whose serialized form exceeded 64 MB
 * produced a backup the app would refuse to restore — the same "produces what
 * it cannot consume" shape as the dangling-`cStockID` case, by a different
 * mechanism. The confirmation gave the user a chance to notice, but it is
 * worded as a size warning rather than "this will exceed what can be
 * re-imported", and it fires at roughly one sixth of the limit that matters.
 *
 * Reachability is genuinely low — 64 MB of JSON is on the order of hundreds of
 * thousands of bookings for a personal-finance extension — which is why this is
 * a refusal at the boundary rather than a chunking scheme.
 */
const MAX_EXPORT_SIZE_KB = INDEXED_DB.MAX_FILE_SIZE / 1024;

export type ExportDatabaseUsecaseDeps = {
    repositories: RepositoryMap;
    browserAdapter: BrowserPort;
    importExportAdapter: ImportExportPort;
    runtime: RuntimePort;
};

export async function exportDatabaseUsecase(
    deps: ExportDatabaseUsecaseDeps,
    input: {
        filename: string;
        confirmLargeFile: (_estimatedSizeKb: number) => Promise<boolean>;
        notifyEstimatedSize: (_estimatedSizeKb: number) => Promise<void>;
    }
): Promise<{ estimatedSizeKb: number; cancelled: boolean }> {
    const [accounts, bookings, stocks, bookingTypes] = await Promise.all([
        deps.repositories.accounts.findAll(),
        deps.repositories.bookings.findAll(),
        deps.repositories.stocks.findAll(),
        deps.repositories.bookingTypes.findAll()
    ]);

    const issues = findExportConsistencyIssues({accounts, bookings, stocks, bookingTypes});
    // Checked before, and separately from, the referential-integrity issues.
    // Both end in a refusal, but they are different answers: "you have nothing
    // to export yet" is the expected state right after install, while "your
    // database is inconsistent" is a fault. They used to share
    // EXPORT_DATABASE.A, so a fresh install clicking Export was told its data
    // had failed validation. Category is VALIDATION rather than DATABASE for
    // the same reason — nothing is wrong with the database.
    if (issues.noAccounts) {
        throw appError(
            ERROR_DEFINITIONS.EXPORT_DATABASE.EMPTY.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    if (hasExportConsistencyIssues(issues)) {
        throw appError(ERROR_DEFINITIONS.EXPORT_DATABASE.A.CODE, ERROR_CATEGORY.DATABASE, false);
    }

    const metaData = createExportMetadata(deps.browserAdapter.manifest().version);
    const dataString = deps.importExportAdapter.stringifyDatabase(
        metaData,
        accounts,
        stocks,
        bookingTypes,
        bookings
    );
    const verification = deps.importExportAdapter.verifyExportIntegrity(dataString);
    if (!verification.valid) {
        throw appError(ERROR_DEFINITIONS.EXPORT_DATABASE.B.CODE, ERROR_CATEGORY.DATABASE, false);
    }

    // The bytes written are exactly the bytes verified above. This used to be
    // `\n${dataString}` — a leading newline with no stated purpose, which meant
    // verifyExportIntegrity's "this parses and validates" guarantee was made
    // about a different string than the one that reached the file. JSON.parse
    // tolerates the whitespace, so nothing broke, but the check was attesting
    // to the wrong artifact.
    const exportData = dataString;
    const estimatedSize = estimateSizeKb(exportData);

    if (estimatedSize > MAX_EXPORT_SIZE_KB) {
        throw appError(
            ERROR_DEFINITIONS.EXPORT_DATABASE.TOO_LARGE.CODE,
            ERROR_CATEGORY.VALIDATION,
            false,
            {estimatedSizeKb: estimatedSize, maxSizeKb: MAX_EXPORT_SIZE_KB}
        );
    }

    if (estimatedSize > LARGE_FILE_THRESHOLD_KB) {
        const proceed = await input.confirmLargeFile(estimatedSize);
        if (!proceed) return {estimatedSizeKb: estimatedSize, cancelled: true};
    } else {
        await input.notifyEstimatedSize(estimatedSize);
    }

    await deps.browserAdapter.writeBufferToFile(exportData, input.filename);
    deps.runtime.resetTeleport();
    return {estimatedSizeKb: estimatedSize, cancelled: false};
}
