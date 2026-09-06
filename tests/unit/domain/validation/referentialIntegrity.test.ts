/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    describeReferentialIssues,
    findReferentialIssues,
    hasReferentialIssues,
    type ReferentialIssues,
    type ReferentialRecordSet
} from "@/domain/validation/referentialIntegrity";
import {makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

const NO_ISSUES: ReferentialIssues = {
    bookingsMissingAccount: [],
    bookingsMissingStock: [],
    bookingsMissingBookingType: [],
    stocksMissingAccount: [],
    bookingTypesMissingAccount: []
};

function makeRecords(overrides: Partial<ReferentialRecordSet> = {}): ReferentialRecordSet {
    return {
        accounts: [{cID: 1}],
        bookings: [],
        stocks: [],
        bookingTypes: [],
        ...overrides
    };
}

describe("domain/validation/referentialIntegrity", () => {
    describe("findReferentialIssues", () => {
        it("reports no issues for a fully consistent record set", () => {
            const records = makeRecords({
                bookings: [makeBookingDb({cID: 1, cAccountNumberID: 1, cStockID: 0, cBookingTypeID: 10})],
                stocks: [makeStockDb({cID: 5, cAccountNumberID: 1})],
                bookingTypes: [makeBookingTypeDb({cID: 10, cAccountNumberID: 1})]
            });

            expect(findReferentialIssues(records)).toEqual(NO_ISSUES);
        });

        it("flags a booking whose cAccountNumberID names no account", () => {
            const records = makeRecords({
                bookings: [makeBookingDb({cID: 7, cAccountNumberID: 999, cStockID: 0, cBookingTypeID: 10})],
                bookingTypes: [makeBookingTypeDb({cID: 10, cAccountNumberID: 1})]
            });

            expect(findReferentialIssues(records).bookingsMissingAccount).toEqual([7]);
        });

        it("treats a booking's cStockID of 0 as the 'no stock' sentinel, not a dangling reference", () => {
            // A non-depot booking (e.g. a plain deposit) carries cStockID: 0. This
            // must never be reported as "references a non-existent stock" — the
            // dangling case this function exists to catch is a *non-zero* id that
            // no longer resolves (e.g. after the referenced stock was deleted).
            const records = makeRecords({
                bookings: [makeBookingDb({cID: 3, cAccountNumberID: 1, cStockID: 0, cBookingTypeID: 10})],
                bookingTypes: [makeBookingTypeDb({cID: 10, cAccountNumberID: 1})]
            });

            expect(findReferentialIssues(records).bookingsMissingStock).toEqual([]);
        });

        it("flags a booking with a non-zero cStockID that names no stock", () => {
            // This is the exact dangling-reference shape the file's own docblock
            // describes: deleting a stock that still had bookings used to pass
            // health checks and export, and only surface on a later import.
            const records = makeRecords({
                bookings: [makeBookingDb({cID: 4, cAccountNumberID: 1, cStockID: 42, cBookingTypeID: 10})],
                stocks: [],
                bookingTypes: [makeBookingTypeDb({cID: 10, cAccountNumberID: 1})]
            });

            expect(findReferentialIssues(records).bookingsMissingStock).toEqual([4]);
        });

        it("flags a booking whose cBookingTypeID names no booking type", () => {
            const records = makeRecords({
                bookings: [makeBookingDb({cID: 8, cAccountNumberID: 1, cStockID: 0, cBookingTypeID: 999})]
            });

            expect(findReferentialIssues(records).bookingsMissingBookingType).toEqual([8]);
        });

        it("flags a stock whose cAccountNumberID names no account", () => {
            const records = makeRecords({stocks: [makeStockDb({cID: 5, cAccountNumberID: 999})]});

            expect(findReferentialIssues(records).stocksMissingAccount).toEqual([5]);
        });

        it("flags a booking type whose cAccountNumberID names no account", () => {
            const records = makeRecords({bookingTypes: [makeBookingTypeDb({cID: 10, cAccountNumberID: 999})]});

            expect(findReferentialIssues(records).bookingTypesMissingAccount).toEqual([10]);
        });
    });

    describe("hasReferentialIssues", () => {
        it("is false when every collection is empty", () => {
            expect(hasReferentialIssues(NO_ISSUES)).toBe(false);
        });

        it("is true when any single collection is non-empty", () => {
            expect(hasReferentialIssues({...NO_ISSUES, bookingsMissingStock: [1]})).toBe(true);
        });
    });

    describe("describeReferentialIssues", () => {
        it("renders one message per offending id, in the documented category order", () => {
            // Order matters: this is called out in the file's own comment as
            // matching what the previous hand-written traversal produced, so the
            // import's error text stays unchanged.
            const messages = describeReferentialIssues({
                bookingsMissingAccount: [1],
                bookingsMissingStock: [2],
                bookingsMissingBookingType: [3],
                stocksMissingAccount: [4],
                bookingTypesMissingAccount: [5]
            });

            expect(messages).toEqual([
                "Booking 1 references a non-existent account",
                "Booking 2 references a non-existent stock",
                "Booking 3 references a non-existent booking type",
                "Stock 4 references a non-existent account",
                "Booking type 5 references a non-existent account"
            ]);
        });

        it("returns an empty array when there is nothing to describe", () => {
            expect(describeReferentialIssues(NO_ISSUES)).toEqual([]);
        });
    });
});
