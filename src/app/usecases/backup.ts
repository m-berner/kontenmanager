/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export type {ExportDatabaseUsecaseDeps} from "@/app/usecases/backup/export";
export {exportDatabaseUsecase} from "@/app/usecases/backup/export";

// Expose pure helpers for unit tests.
export {
    createExportFilename,
    createExportMetadata,
    estimateSizeKb,
    findExportConsistencyIssues,
    hasExportConsistencyIssues
} from "@/app/usecases/backup/exportHelpers";
export type {ImportDatabaseUsecaseDeps} from "@/app/usecases/backup/import";
export {importDatabaseUsecase} from "@/app/usecases/backup/import";
export type {ImportCounts} from "@/app/usecases/backup/importHelpers";
export {
    buildLegacyImportPlan,
    buildModernImportPlan,
    createDefaultAccount,
    createDefaultBookingTypes,
    getImportCounts,
    normalizeModernBackup,
    toImportRecords
} from "@/app/usecases/backup/importHelpers";