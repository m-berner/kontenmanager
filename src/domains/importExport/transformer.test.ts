/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {ImportExportTransformer} from "@/domains/importExport/transformer";
import {INDEXED_DB} from "@/configs/database";
import {DATE} from "@/domains/configs/date";
import {DomainUtils} from "@/domains/utils";
import type {LegacyBookingDb} from "@/types";

function createLegacyBooking(
    overrides: Partial<LegacyBookingDb> = {}
): LegacyBookingDb {
    return {
        cDate: Date.UTC(2026, 0, 1),
        cExDay: Date.UTC(2026, 0, 2),
        cUnitQuotation: 10,
        cAmount: 0,
        cDescription: "legacy booking",
        cCount: 1,
        cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
        cStockID: 42,
        cSoli: 0,
        cTax: 0,
        cFees: 0,
        cSTax: 0,
        cFTax: 0,
        cMarketPlace: "XETRA",
        ...overrides
    };
}

describe("ImportExportTransformer", () => {
    const transformer = new ImportExportTransformer(
        INDEXED_DB,
        DATE,
        DomainUtils.isoDate
    );

    it("maps CREDIT booking with amount to OTHER and sums tax/fee components", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
            cAmount: 100,
            cFees: -2,
            cSTax: -1,
            cFTax: 3,
            cTax: 5,
            cSoli: -4
        });

        const booking = transformer.transformLegacyBooking(legacy, 0, 1);
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.OTHER);
        expect(booking.cCredit).toBe(101);
        expect(booking.cDebit).toBe(0);
    });

    it("maps CREDIT booking with only fees to FEE", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
            cAmount: 0,
            cFees: 7
        });

        const booking = transformer.transformLegacyBooking(legacy, 0, 1);
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.FEE);
        expect(booking.cCredit).toBe(7);
    });

    it("maps DEBIT booking with only taxes to TAX with signed debit value", () => {
        const legacy = createLegacyBooking({
            cType: INDEXED_DB.STORE.BOOKING_TYPES.DEBIT,
            cAmount: 0,
            cTax: 4,
            cSoli: 1
        });

        const booking = transformer.transformLegacyBooking(legacy, 0, 1);
        expect(booking.cBookingTypeID).toBe(INDEXED_DB.STORE.BOOKING_TYPES.TAX);
        expect(booking.cCredit).toBe(0);
        expect(booking.cDebit).toBe(-5);
    });
});
