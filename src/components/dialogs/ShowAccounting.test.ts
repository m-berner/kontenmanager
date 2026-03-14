/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useRecordsStore} from "@/stores/records";

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

describe("ShowAccounting Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
    });

    it("should calculate total debit and credit from bookings", () => {
        const records = useRecordsStore();

        // Add test bookings
        records.bookings.add(
            {
                cID: 1,
                cBookDate: "2024-01-01",
                cExDate: "",
                cDebit: 100,
                cCredit: 0,
                cDescription: "Test Debit",
                cCount: 1,
                cBookingTypeID: 1,
                cAccountNumberID: 1,
                cStockID: 0,
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

        records.bookings.add(
            {
                cID: 2,
                cBookDate: "2024-01-02",
                cExDate: "",
                cDebit: 0,
                cCredit: 200,
                cDescription: "Test Credit",
                cCount: 1,
                cBookingTypeID: 1,
                cAccountNumberID: 1,
                cStockID: 0,
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

        // Calculate totals
        const totalDebit = records.bookings.items.reduce(
            (sum, b) => sum + b.cDebit,
            0
        );
        const totalCredit = records.bookings.items.reduce(
            (sum, b) => sum + b.cCredit,
            0
        );

        expect(totalDebit).toBe(100);
        expect(totalCredit).toBe(200);
        expect(totalCredit - totalDebit).toBe(100);
    });
});
