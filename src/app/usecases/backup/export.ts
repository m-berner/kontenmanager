/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BrowserPort, ImportExportPort, RuntimePort} from "@/app/usecases/ports";

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {RepositoryMap} from "@/domain/types";

import {
    createExportMetadata,
    estimateSizeKb,
    findExportConsistencyIssues,
    hasExportConsistencyIssues
} from "./exportHelpers";

const LARGE_FILE_THRESHOLD_KB = 10000;

export type ExportDatabaseUsecaseDeps = {
    repositories: RepositoryMap;
    browserService: BrowserPort;
    importExportService: ImportExportPort;
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
    if (hasExportConsistencyIssues(issues)) {
        throw appError(ERROR_DEFINITIONS.EXPORT_DATABASE.A.CODE, ERROR_CATEGORY.DATABASE, false);
    }

    const metaData = createExportMetadata(deps.browserService.manifest().version);
    const dataString = deps.importExportService.stringifyDatabase(
        metaData,
        accounts,
        stocks,
        bookingTypes,
        bookings
    );
    const verification = deps.importExportService.verifyExportIntegrity(dataString);
    if (!verification.valid) {
        throw appError(ERROR_DEFINITIONS.EXPORT_DATABASE.B.CODE, ERROR_CATEGORY.DATABASE, false);
    }

    const exportData = `\n${dataString}`;
    const estimatedSize = estimateSizeKb(exportData);

    if (estimatedSize > LARGE_FILE_THRESHOLD_KB) {
        const proceed = await input.confirmLargeFile(estimatedSize);
        if (!proceed) return {estimatedSizeKb: estimatedSize, cancelled: true};
    } else {
        await input.notifyEstimatedSize(estimatedSize);
    }

    await deps.browserService.writeBufferToFile(exportData, input.filename);
    deps.runtime.resetTeleport();
    return {estimatedSizeKb: estimatedSize, cancelled: false};
}
