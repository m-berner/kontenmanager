/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {transformLegacyBooking, transformLegacyStock} from "@/domain/importExport/transformer";
import {DATE, INDEXED_DB} from "@/domain/constants";
import {isoDate} from "@/domain/utils/utils";
import type {LegacyBookingDb, LegacyStockDb} from "@/domain/types";

function createLegacyBooking(
    overrides: Partial<LegacyBookingDb> = {}
): LegacyBookingDb {
    return {
        cDate: Date.UTC(2026, 0, 1),
        cExDay: Date.UTC(2026, 0, 2),
        cUnitQuotation: 10,
        cDeposit: 0,
        cDescription: "legacy booking",
        cNumber: 1,
        cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
        cStockID: 42,
        cSoli: 0,
        cTaxes: 0,
        cFees: 0,
        cSTax: 0,
        cFTax: 0,
        cMarketPlace: "XETRA",
        ...overrides
    };
}

describe("ImportExportTransformer", () => {
    it("maps CREDIT booking with amount to OTHER and sums tax/fee components", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
            cDeposit: 100,
            cFees: -2,
            cSTax: -1,
            cFTax: 3,
            cTaxes: 5,
            cSoli: -4
        });

        const booking = transformLegacyBooking(
            legacy,
            0,
            1,
            INDEXED_DB,
            isoDate
        );
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.OTHER);
        expect(booking.cCredit).toBe(101);
        expect(booking.cDebit).toBe(0);
    });

    it("maps CREDIT booking with only fees to FEE", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
            cDeposit: 0,
            cFees: 7
        });

        const booking = transformLegacyBooking(
            legacy,
            0,
            1,
            INDEXED_DB,
            isoDate
        );
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.FEE);
        expect(booking.cCredit).toBe(7);
    });

    it("maps DEBIT booking with only taxes to TAX with signed debit value", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.DEBIT,
            cDeposit: 0,
            cTaxes: 4,
            cSoli: 1
        });

        const booking = transformLegacyBooking(
            legacy,
            0,
            1,
            INDEXED_DB,
            isoDate
        );
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.TAX);
        expect(booking.cCredit).toBe(0);
        expect(booking.cDebit).toBe(-5);
    });

    // Values below are taken verbatim from a real legacy "stockmanager" v22
    // export to pin down the actual field names/semantics of that format
    // (cNumber/cDeposit/cTaxes/cNotFirstPage), not the ones this module used
    // to assume (cCount/cAmount/cTax/cFirstPage).
    it("maps a real-world BUY transfer to a positive debit", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.BUY,
            cUnitQuotation: 19.095,
            cNumber: 1000,
            cFees: -25
        });

        const booking = transformLegacyBooking(legacy, 0, 1, INDEXED_DB, isoDate);

        expect(booking.cCount).toBe(1000);
        expect(booking.cDebit).toBe(19095);
        expect(booking.cCredit).toBe(0);
    });

    it("maps a real-world SELL transfer (negative cNumber) to a positive credit", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.SELL,
            cUnitQuotation: 34.471,
            cNumber: -1000,
            cFees: -25,
            cTaxes: -150,
            cSoli: -8.25
        });

        const booking = transformLegacyBooking(legacy, 0, 1, INDEXED_DB, isoDate);

        expect(booking.cCount).toBe(1000);
        expect(booking.cCredit).toBe(34471);
        expect(booking.cDebit).toBe(0);
    });
});

describe("ImportExportTransformer stock", () => {
    function createLegacyStock(overrides: Partial<LegacyStockDb> = {}): LegacyStockDb {
        return {
            cID: 1,
            cSym: "TC1",
            cMeetingDay: 0,
            cQuarterDay: 0,
            cCompany: "Tele Columbus AG",
            cISIN: "DE000TCAG172",
            cFadeOut: 0,
            cNotFirstPage: 1,
            cURL: "",
            ...overrides
        };
    }

    it("inverts cNotFirstPage into cFirstPage", () => {
        const notFirstPage = transformLegacyStock(createLegacyStock({cNotFirstPage: 1}), 1, DATE, isoDate);
        const firstPage = transformLegacyStock(createLegacyStock({cNotFirstPage: 0}), 1, DATE, isoDate);

        expect(notFirstPage.cFirstPage).toBe(0);
        expect(firstPage.cFirstPage).toBe(1);
    });
});

