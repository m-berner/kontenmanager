/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {INDEXED_DB} from "@/configs/database";

// Mock browser API
const browserMock = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    notifications: {
        create: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
        getURL: vi.fn().mockReturnValue(""),
        getManifest: vi.fn().mockReturnValue({version: "1.0.0"})
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue("de-DE")
    }
};
vi.stubGlobal("browser", browserMock);

describe("ShowDividend Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
    });

    it("should filter dividend bookings by booking type", () => {
        const records = useRecordsStore();

        // Add dividend booking
        records.bookings.add(
            {
                cID: 1,
                cBookDate: "2024-01-01",
                cExDate: "",
                cDebit: 0,
                cCredit: 50,
                cDescription: "Dividend Payment",
                cCount: 1,
                cBookingTypeID: INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND,
                cAccountNumberID: 1,
                cStockID: 1,
                cSoliCredit: 0,
                cSoliDebit: 0,
                cTaxCredit: 0,
                cTaxDebit: 0,
                cFeeCredit: 0,
                cFeeDebit: 0,
                cSourceTaxCredit: 0,
                cSourceTaxDebit: 0,
                cTransactionTaxCredit: 0,
                cTransactionTaxDebit: 0,
                cMarketPlace: ""
            },
            false
        );

        // Add non-dividend booking
        records.bookings.add(
            {
                cID: 2,
                cBookDate: "2024-01-02",
                cExDate: "",
                cDebit: 100,
                cCredit: 0,
                cDescription: "Buy Stock",
                cCount: 10,
                cBookingTypeID: INDEXED_DB.STORE.BOOKING_TYPES.BUY,
                cAccountNumberID: 1,
                cStockID: 1,
                cSoliCredit: 0,
                cSoliDebit: 0,
                cTaxCredit: 0,
                cTaxDebit: 0,
                cFeeCredit: 0,
                cFeeDebit: 0,
                cSourceTaxCredit: 0,
                cSourceTaxDebit: 0,
                cTransactionTaxCredit: 0,
                cTransactionTaxDebit: 0,
                cMarketPlace: ""
            },
            false
        );

        // Filter for dividends only
        const dividends = records.bookings.items.filter(
            (b) => b.cBookingTypeID === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND
        );

        expect(dividends.length).toBe(1);
        expect(dividends[0].cCredit).toBe(50);
    });
});
