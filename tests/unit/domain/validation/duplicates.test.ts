/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {isDuplicateAccountIban, isDuplicateBookingTypeName} from "@/domain/validation/duplicates";
import type {AccountStoreItem, BookingTypeDb} from "@/domain/types";

describe("domain/validation/duplicates", () => {
    describe("isDuplicateAccountIban", () => {
        const account = (cIban: string): AccountStoreItem => ({
            cID: 1,
            cSwift: "SWIFT",
            cIban,
            cLogoUrl: "",
            cWithDepot: false
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
    });

    describe("isDuplicateBookingTypeName", () => {
        const type = (cID: number, cName: string): BookingTypeDb => ({
            cID,
            cName,
            cAccountNumberID: 1
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
    });
});