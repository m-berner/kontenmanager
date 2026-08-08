/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import * as DomainValidators from "@/domain/validation/validators";
import * as DomainUtils from "@/domain/utils/utils";

describe("DomainValidators: normalizeDate behavior", () => {
    it("returns an empty string for invalid date input instead of the current day", () => {
        const logSpy = vi.spyOn(DomainUtils, "log").mockImplementation(() => {
        });

        const booking = DomainValidators.validateBooking({
            cID: 1,
            cBookDate: "not-a-date",
            cExDate: Number.NaN
        });

        expect(booking.cBookDate).toBe("");
        expect(booking.cExDate).toBe("");
        expect(logSpy).toHaveBeenCalled();
    });

    it("keeps valid ISO date and converts valid numeric timestamp", () => {
        const timestamp = Date.UTC(2026, 0, 2);
        const booking = DomainValidators.validateBooking({
            cID: 1,
            cBookDate: "2026-01-03",
            cExDate: timestamp
        });

        expect(booking.cBookDate).toBe("2026-01-03");
        expect(booking.cExDate).toBe("2026-01-02");
    });
});

describe("DomainValidators: validateBookingType cRole handling", () => {
    it("passes through an explicit valid cRole", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 104,
            cName: "Whatever",
            cAccountNumberID: 1,
            cRole: "sell"
        });

        expect(bookingType.cRole).toBe("sell");
    });

    it("resolves a missing cRole via the default English label", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 104,
            cName: "Stock purchase",
            cAccountNumberID: 1
        });

        expect(bookingType.cRole).toBe("buy");
    });

    it("resolves a missing cRole via the default German label", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 205,
            cName: "Dividende",
            cAccountNumberID: 1
        });

        expect(bookingType.cRole).toBe("dividend");
    });

    it("falls back to the historical global-cID convention when the name doesn't match a default label", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 2,
            cName: "Renamed sell type",
            cAccountNumberID: 1
        });

        expect(bookingType.cRole).toBe("sell");
    });

    it("defaults to 'other' when neither the name nor the id resolve to a known role", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 999,
            cName: "Interest",
            cAccountNumberID: 1
        });

        expect(bookingType.cRole).toBe("other");
    });

    it("ignores an invalid cRole value and falls back to resolution", () => {
        const bookingType = DomainValidators.validateBookingType({
            cID: 104,
            cName: "Stock purchase",
            cAccountNumberID: 1,
            cRole: "not-a-real-role"
        });

        expect(bookingType.cRole).toBe("buy");
    });
});

describe("DomainValidators: resolveLegacyBookingTypeRole", () => {
    it("matches default labels case-insensitively and after whitespace normalization", () => {
        expect(DomainValidators.resolveLegacyBookingTypeRole(999, "  STOCK   SALE  ")).toBe("sell");
    });

    it("returns 'other' for an unrecognized name and a non-1/2/3 id", () => {
        expect(DomainValidators.resolveLegacyBookingTypeRole(50, "Custom")).toBe("other");
    });
});

