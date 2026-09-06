/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingDb, BookingTypeDb, StockDb} from "@/domain/types";

/**
 * The one definition of "is this record set referentially consistent".
 *
 * Three hand-written traversals of this same invariant used to exist, and they
 * disagreed:
 *
 * | Check                         | `cAccountNumberID` | `cStockID` | `cBookingTypeID` | Guards  |
 * | ----------------------------- | ------------------ | ---------- | ---------------- | ------- |
 * | `findExportConsistencyIssues` | yes                | **no**     | **no**           | export  |
 * | `healthChecker.collectStats`  | yes                | **no**     | **no**           | nothing |
 * | `validateForeignKeys`         | yes                | yes        | yes              | import  |
 *
 * The strict one guarded the *inbound* path while the two lenient ones guarded
 * the *outbound* path and the diagnostic. That ordering is backwards, and it is
 * what let the app write a backup file it would later refuse to restore: a
 * dangling `cStockID` (produced by deleting a stock that still had bookings)
 * passed the health check, passed the export, and was only rejected on import —
 * the worst possible moment to find out, and potentially after the original
 * database is gone.
 *
 * All three now call this. Adding a fourth relationship means editing one
 * function rather than remembering three.
 */

/** The record collections a consistency check reads. */
export interface ReferentialRecordSet {
    accounts: Pick<{ cID: number }, "cID">[];
    bookings: Pick<BookingDb, "cID" | "cAccountNumberID" | "cStockID" | "cBookingTypeID">[];
    stocks: Pick<StockDb, "cID" | "cAccountNumberID">[];
    bookingTypes: Pick<BookingTypeDb, "cID" | "cAccountNumberID">[];
}

/**
 * Ids of the records holding each kind of dangling reference.
 *
 * Ids rather than counts, because the two consumers that report to a human want
 * different things from the same survey: the import lists offending records by
 * id, the export and health check only need `.length`.
 */
export interface ReferentialIssues {
    /** Bookings whose `cAccountNumberID` names no account. */
    bookingsMissingAccount: number[];
    /** Bookings whose non-zero `cStockID` names no stock. */
    bookingsMissingStock: number[];
    /** Bookings whose `cBookingTypeID` names no booking type. */
    bookingsMissingBookingType: number[];
    /** Stocks whose `cAccountNumberID` names no account. */
    stocksMissingAccount: number[];
    /** Booking types whose `cAccountNumberID` names no account. */
    bookingTypesMissingAccount: number[];
}

/**
 * Surveys every foreign-key relationship in the record set.
 *
 * Note `cStockID` is checked only when truthy: `0` is the "no stock" sentinel
 * every non-depot booking carries, not a reference.
 */
export function findReferentialIssues(records: ReferentialRecordSet): ReferentialIssues {
    const accountIds = new Set(records.accounts.map((a) => a.cID));
    const stockIds = new Set(records.stocks.map((s) => s.cID));
    const bookingTypeIds = new Set(records.bookingTypes.map((bt) => bt.cID));

    const issues: ReferentialIssues = {
        bookingsMissingAccount: [],
        bookingsMissingStock: [],
        bookingsMissingBookingType: [],
        stocksMissingAccount: [],
        bookingTypesMissingAccount: []
    };

    for (const booking of records.bookings) {
        if (!accountIds.has(booking.cAccountNumberID)) {
            issues.bookingsMissingAccount.push(booking.cID);
        }
        if (booking.cStockID && !stockIds.has(booking.cStockID)) {
            issues.bookingsMissingStock.push(booking.cID);
        }
        if (!bookingTypeIds.has(booking.cBookingTypeID)) {
            issues.bookingsMissingBookingType.push(booking.cID);
        }
    }

    for (const stock of records.stocks) {
        if (!accountIds.has(stock.cAccountNumberID)) {
            issues.stocksMissingAccount.push(stock.cID);
        }
    }

    for (const bt of records.bookingTypes) {
        if (!accountIds.has(bt.cAccountNumberID)) {
            issues.bookingTypesMissingAccount.push(bt.cID);
        }
    }

    return issues;
}

/** Whether the survey found any dangling reference at all. */
export function hasReferentialIssues(issues: ReferentialIssues): boolean {
    return Object.values(issues).some((ids) => ids.length > 0);
}

/**
 * Renders the survey as the human-readable messages the import reports.
 *
 * Kept in the order the previous hand-written traversal produced them, so the
 * import's error text is unchanged.
 */
export function describeReferentialIssues(issues: ReferentialIssues): string[] {
    return [
        ...issues.bookingsMissingAccount.map(
            (id) => `Booking ${id} references a non-existent account`
        ),
        ...issues.bookingsMissingStock.map(
            (id) => `Booking ${id} references a non-existent stock`
        ),
        ...issues.bookingsMissingBookingType.map(
            (id) => `Booking ${id} references a non-existent booking type`
        ),
        ...issues.stocksMissingAccount.map(
            (id) => `Stock ${id} references a non-existent account`
        ),
        ...issues.bookingTypesMissingAccount.map(
            (id) => `Booking type ${id} references a non-existent account`
        )
    ];
}
