/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types";
import {findReferentialIssues} from "@/domain/validation/referentialIntegrity";

export type ExportConsistencyIssues = {
    noAccounts: boolean;
    invalidBookings: number;
    invalidStocks: number;
    invalidBookingTypes: number;
};

export function createExportFilename(prefixIsoDate: string): string {
    return `${prefixIsoDate}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
}

/**
 * Builds the `sm` block written at the head of every backup.
 *
 * `cVersion` is the manifest version verbatim — see `BackupMetadata.cVersion`
 * for why the previous dot-stripping encode was lossy and unorderable.
 */
export function createExportMetadata(manifestVersion: string): {
    cVersion: string;
    cDBVersion: number;
    cEngine: "indexeddb";
} {
    return {
        cVersion: manifestVersion,
        cDBVersion: INDEXED_DB.CURRENT_VERSION,
        cEngine: "indexeddb"
    };
}

export function estimateSizeKb(data: string): number {
    return new TextEncoder().encode(data).length / 1024;
}

/**
 * Surveys the data about to be exported for dangling references.
 *
 * Runs the shared `findReferentialIssues` rather than its own account-only
 * traversal, so the export now blocks on exactly what the *import* rejects.
 * Previously it checked only `cAccountNumberID` on the three child collections,
 * which meant a database holding a dangling `cStockID` — deleting a stock that
 * still had bookings produces one — exported cleanly and then failed to restore.
 * `invalidBookings` therefore now counts a booking with any bad reference, not
 * only a bad account reference.
 */
export function findExportConsistencyIssues(input: {
    accounts: AccountDb[];
    bookings: BookingDb[];
    stocks: StockDb[];
    bookingTypes: BookingTypeDb[];
}): ExportConsistencyIssues {
    const issues = findReferentialIssues(input);
    const invalidBookings = new Set([
        ...issues.bookingsMissingAccount,
        ...issues.bookingsMissingStock,
        ...issues.bookingsMissingBookingType
    ]);

    return {
        noAccounts: input.accounts.length === 0,
        invalidBookings: invalidBookings.size,
        invalidStocks: issues.stocksMissingAccount.length,
        invalidBookingTypes: issues.bookingTypesMissingAccount.length
    };
}

export function hasExportConsistencyIssues(issues: ExportConsistencyIssues): boolean {
    return (
        issues.noAccounts ||
        issues.invalidBookings > 0 ||
        issues.invalidStocks > 0 ||
        issues.invalidBookingTypes > 0
    );
}