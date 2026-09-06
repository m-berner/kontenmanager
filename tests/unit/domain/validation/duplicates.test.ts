/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    isDuplicateAccountIban,
    isDuplicateBookingTypeName,
    isDuplicateStockSymbol
} from "@/domain/validation/duplicates";
import {BOOKING_TYPE_ROLE, DATE} from "@/domain/constants";
import type {AccountStoreItem, BookingTypeDb, StockItem} from "@/domain/types";

describe("domain/validation/duplicates", () => {
    describe("isDuplicateAccountIban", () => {
        const account = (cIban: string): AccountStoreItem => ({
            cID: 1,
            cSwift: "SWIFT",
            cIban,
            cLogoUrl: "",
            cWithDepot: false, cCurrency: "EUR"
        });

        it("returns true when an account with the same IBAN already exists", () => {
            const items = [account("DE1234567890")];
            expect(isDuplicateAccountIban(items, "DE1234567890")).toBe(true);
        });

        it("returns false when no account has the given IBAN", () => {
            const items = [account("DE1234567890")];
            expect(isDuplicateAccountIban(items, "DE0000000000")).toBe(false);
        });

        it("returns false for an empty account list", () => {
            expect(isDuplicateAccountIban([], "DE1234567890")).toBe(false);
        });

        it("is case-sensitive (callers are expected to normalize IBANs first)", () => {
            const items = [account("DE1234567890")];
            expect(isDuplicateAccountIban(items, "de1234567890")).toBe(false);
        });

        // Without excludeId, re-validating an account that kept its own IBAN
        // reports it as a duplicate and refuses to save. isDuplicateStockIsin and
        // isDuplicateBookingTypeName have always taken this parameter; accounts
        // were the odd one out, which only stayed invisible because AccountForm
        // disables the IBAN field on update and skipped the check entirely.
        it("excludes the entry being edited so an unchanged IBAN is not a duplicate", () => {
            const items = [account("DE1234567890")]; // cID 1
            expect(isDuplicateAccountIban(items, "DE1234567890", 1)).toBe(false);
        });

        it("still flags another account's IBAN when editing", () => {
            const items = [account("DE1234567890"), {...account("DE9999999999"), cID: 2}];
            // account 2 trying to take account 1's IBAN
            expect(isDuplicateAccountIban(items, "DE1234567890", 2)).toBe(true);
        });
    });

    describe("isDuplicateBookingTypeName", () => {
        const type = (cID: number, cName: string): BookingTypeDb => ({
            cID,
            cName,
            cAccountNumberID: 1,
            cRole: BOOKING_TYPE_ROLE.OTHER
        });

        it("returns true when a booking type with the same normalized name exists", () => {
            const items = [type(1, "Buy")];
            expect(isDuplicateBookingTypeName(items, "Buy")).toBe(true);
        });

        it("normalizes whitespace before comparing (trim + collapse)", () => {
            const items = [type(1, "Buy")];
            expect(isDuplicateBookingTypeName(items, "  Buy   ")).toBe(true);
        });

        it("returns false when no booking type matches", () => {
            const items = [type(1, "Buy")];
            expect(isDuplicateBookingTypeName(items, "Sell")).toBe(false);
        });

        it("excludes the entry being edited via excludeId", () => {
            const items = [type(1, "Buy")];
            expect(isDuplicateBookingTypeName(items, "Buy", 1)).toBe(false);
        });

        it("still detects a duplicate against a different entry when excludeId is set", () => {
            const items = [type(1, "Buy"), type(2, "Buy")];
            expect(isDuplicateBookingTypeName(items, "Buy", 1)).toBe(true);
        });

        it("is case-insensitive, so \"fees\" is treated as a duplicate of an existing \"Fees\"", () => {
            const items = [type(1, "Fees")];
            expect(isDuplicateBookingTypeName(items, "fees")).toBe(true);
            expect(isDuplicateBookingTypeName(items, "FEES")).toBe(true);
        });
    });

    describe("isDuplicateStockSymbol", () => {
        // cSymbol is backed by stocks_uk4, a per-account UNIQUE index, exactly
        // like cISIN is by stocks_uk3 — but only the ISIN half had a UI guard. So
        // a duplicate symbol only ever surfaced as a raw IndexedDB
        // ConstraintError with no field attached.
        const stock = (cID: number, cSymbol: string): StockItem => ({
            cID,
            cISIN: "US0378331005",
            cSymbol,
            cCompany: "Test",
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: "",
            cMeetingDay: DATE.ISO,
            cQuarterDay: DATE.ISO,
            cAccountNumberID: 1,
            cAskDates: DATE.ISO
        });

        it("detects an exact duplicate symbol", () => {
            expect(isDuplicateStockSymbol([stock(1, "AAPL")], "AAPL")).toBe(true);
        });

        it("returns false when no stock uses the symbol", () => {
            expect(isDuplicateStockSymbol([stock(1, "AAPL")], "MSFT")).toBe(false);
        });

        it("is case-insensitive, since mapStockFormToDb uppercases before persisting", () => {
            expect(isDuplicateStockSymbol([stock(1, "AAPL")], "aapl")).toBe(true);
        });

        it("ignores surrounding whitespace", () => {
            expect(isDuplicateStockSymbol([stock(1, "AAPL")], "  AAPL ")).toBe(true);
        });

        it("excludes the entry being edited via excludeId", () => {
            expect(isDuplicateStockSymbol([stock(1, "AAPL")], "AAPL", 1)).toBe(false);
        });

        it("still detects a duplicate against a different entry when excludeId is set", () => {
            const items = [stock(1, "AAPL"), stock(2, "AAPL")];
            expect(isDuplicateStockSymbol(items, "AAPL", 1)).toBe(true);
        });

        it("never reports a blank symbol as duplicate — stockRepository omits blanks from the index", () => {
            expect(isDuplicateStockSymbol([stock(1, "")], "")).toBe(false);
            expect(isDuplicateStockSymbol([stock(1, "")], "   ")).toBe(false);
        });
    });
});