/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import * as DomainLogic from "@/domains/logic";
import type {BookingDb, RecordsDbData} from "@/types";
import {createPinia, setActivePinia} from "pinia";

// Mock browserStorage
vi.mock("@/services/browserStorage", () => ({
    browserService: () => ({})
}));

// Mock storageAdapter
vi.mock("@/domains/storage/storageAdapter", () => ({
    storageAdapter: () => ({
        getStorage: vi.fn().mockResolvedValue({}),
        setStorage: vi.fn().mockResolvedValue(undefined)
    })
}));

describe("DomainLogic", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe("calculateTotalSum", () => {
        it("should calculate the correct total for a simple booking", () => {
            const bookings: Partial<BookingDb>[] = [
                {
                    cCredit: 1000,
                    cDebit: 0,
                    cTaxDebit: 0,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 0,
                    cSoliCredit: 0,
                    cFeeDebit: 50,
                    cFeeCredit: 0
                }
            ];
            // (1000 - 0) - (50 fee) = 950
            expect(DomainLogic.calculateTotalSum(bookings as BookingDb[])).toBe(950);
        });

        it("should return 0 for empty bookings", () => {
            expect(DomainLogic.calculateTotalSum([])).toBe(0);
        });

        it("should handle complex bookings with taxes and fees", () => {
            const bookings: Partial<BookingDb>[] = [
                {
                    cCredit: 500, // Dividend
                    cDebit: 0,
                    cTaxDebit: 100, // Capital Gains Tax
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 5.5,
                    cSoliCredit: 0,
                    cFeeDebit: 0,
                    cFeeCredit: 0
                }
            ];
            // 500 - (100 tax + 5.5 soli) = 394.5
            expect(DomainLogic.calculateTotalSum(bookings as BookingDb[])).toBe(
                394.5
            );
        });
    });

    describe("calculateSumFees", () => {
        it("should sum fees only for the specified year", () => {
            const bookings: Partial<BookingDb>[] = [
                {cBookDate: "2024-01-01", cFeeDebit: 10, cFeeCredit: 0},
                {cBookDate: "2024-06-01", cFeeDebit: 15, cFeeCredit: 0},
                {cBookDate: "2023-12-31", cFeeDebit: 20, cFeeCredit: 0}
            ];
            // Fees are stored as cFeeCredit - cFeeDebit in your logic
            // 2024: (0-10) + (0-15) = -25
            expect(DomainLogic.calculateSumFees(bookings as BookingDb[], 2024)).toBe(
                -25
            );
        });
    });

    describe("initializeRecords", () => {
        it("should initialize records correctly", async () => {
            const storesDB: RecordsDbData = {
                accountsDB: [
                    {cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "L", cWithDepot: false}
                ],
                bookingsDB: [],
                bookingTypesDB: [],
                stocksDB: []
            };

            const mockStores = {
                accounts: {clean: vi.fn(), add: vi.fn(), items: [{cID: 1}]},
                bookings: {clean: vi.fn(), add: vi.fn(), items: []},
                bookingTypes: {clean: vi.fn(), add: vi.fn()},
                stocks: {clean: vi.fn(), add: vi.fn()},
                settings: {activeAccountId: 1},
                alerts: {info: vi.fn()}
            };

            const messages = {title: "Title", message: "Message"};

            await DomainLogic.initializeRecords(
                storesDB,
                mockStores as unknown as Parameters<typeof DomainLogic.initializeRecords>[1],
                messages
            );

            expect(mockStores.accounts.clean).toHaveBeenCalled();
            expect(mockStores.accounts.add).toHaveBeenCalledWith(
                storesDB.accountsDB[0]
            );
            expect(mockStores.stocks.add).toHaveBeenCalled(); // Default stock
        });
    });

    describe("hasBookings", () => {
        it("should return true if stock has bookings", () => {
            const bookings: Array<Pick<BookingDb, "cStockID">> = [{cStockID: 1}, {cStockID: 2}];
            expect(DomainLogic.hasBookings(1, bookings)).toBe(true);
        });

        it("should return false if stock has no bookings", () => {
            const bookings: Array<Pick<BookingDb, "cStockID">> = [{cStockID: 2}, {cStockID: 3}];
            expect(DomainLogic.hasBookings(1, bookings)).toBe(false);
        });

        it("should return false for empty bookings", () => {
            expect(DomainLogic.hasBookings(1, [])).toBe(false);
        });
    });
});

