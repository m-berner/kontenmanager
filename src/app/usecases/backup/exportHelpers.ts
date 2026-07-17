/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types";

export type ExportConsistencyIssues = {
    noAccounts: boolean;
    invalidBookings: number;
    invalidStocks: number;
    invalidBookingTypes: number;
};

export function createExportFilename(prefixIsoDate: string): string {
    return `${prefixIsoDate}_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`;
}

export function createExportMetadata(manifestVersion: string): {
    cVersion: number;
    cDBVersion: number;
    cEngine: "indexeddb";
} {
    return {
        cVersion: Number.parseInt(manifestVersion.replace(/\./g, "")),
        cDBVersion: INDEXED_DB.CURRENT_VERSION,
        cEngine: "indexeddb"
    };
}

export function estimateSizeKb(data: string): number {
    return new TextEncoder().encode(data).length / 1024;
}

export function findExportConsistencyIssues(input: {
    accounts: AccountDb[];
    bookings: BookingDb[];
    stocks: StockDb[];
    bookingTypes: BookingTypeDb[];
}): ExportConsistencyIssues {
    const accountIds = new Set(input.accounts.map((a) => a.cID));

    return {
        noAccounts: input.accounts.length === 0,
        invalidBookings: input.bookings.filter((b) => !accountIds.has(b.cAccountNumberID))
            .length,
        invalidStocks: input.stocks.filter((s) => !accountIds.has(s.cAccountNumberID)).length,
        invalidBookingTypes: input.bookingTypes.filter((b) => !accountIds.has(b.cAccountNumberID))
            .length
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