/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {DATE} from "@/domain/constants";
import * as DomainLogic from "@/domain/logic";
import type {BookingDb, RecordsDbData} from "@/domain/types";
import {setActiveTestPinia} from "@test/pinia";

// Mock browserStorage
vi.mock("@/adapters/driven/browserStorage", () => ({
    browserAdapter: () => ({})
}));

// Mock storageAdapter
vi.mock("@/adapters/driven/storageAdapter", () => ({
    storageAdapter: () => ({
        getStorage: vi.fn().mockResolvedValue({}),
        setStorage: vi.fn().mockResolvedValue(undefined)
    })
}));

describe("DomainLogic", () => {
    beforeEach(() => {
        setActiveTestPinia();
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

        // An undated booking belongs to no calendar year, but it IS counted by
        // calculateSumAllFees. Without a year that selects it, the all-time
        // figure could not be reproduced from any per-year selection and the
        // difference was unaccounted for on screen.
        it("collects undated bookings under DATE.UNDATED_YEAR, and no calendar year claims them", () => {
            const bookings: Partial<BookingDb>[] = [
                {cBookDate: "2024-01-01", cFeeDebit: 10, cFeeCredit: 0},
                {cBookDate: "", cFeeDebit: 5, cFeeCredit: 0},
                // Malformed, not blank: normalizeDate would map this to "" on
                // any write path, but a pre-existing DB row reaches here as-is.
                {cBookDate: "15.03.2024", cFeeDebit: 3, cFeeCredit: 0}
            ];
            const all = bookings as BookingDb[];

            expect(DomainLogic.calculateSumFees(all, DATE.UNDATED_YEAR)).toBe(-8);
            expect(DomainLogic.calculateSumFees(all, 2024)).toBe(-10);
            // The whole point: the year rows now reconcile with the all-time row.
            expect(DomainLogic.calculateSumFees(all, 2024) + DomainLogic.calculateSumFees(all, DATE.UNDATED_YEAR))
                .toBe(DomainLogic.calculateSumAllFees(all));
        });

        // utcDate throws an AppError on a non-empty, non-ISO string, and nothing
        // re-validates on the DB read path — so this used to take down the whole
        // accounting view rather than mis-bucket one row.
        it("does not throw on a malformed cBookDate", () => {
            const bookings = [
                {cBookDate: "15.03.2024", cFeeDebit: 3, cFeeCredit: 0}
            ] as BookingDb[];

            expect(() => DomainLogic.calculateSumFees(bookings, 2024)).not.toThrow();
            expect(() => DomainLogic.calculateSumTaxes(bookings, 2024)).not.toThrow();
            expect(() => DomainLogic.aggregateBookingsPerType(bookings, [], 2024)).not.toThrow();
        });
    });

    describe("calculatePortfolioByStockId / calculateInvestByStockId / getDividendBookingsByStockId", () => {
        // Deliberately not 1/2/3 — booking-type ids are only ever 1/2/3 for the first
        // depot account ever created in a given IndexedDB instance; classification must
        // follow each type's cRole, not a fixed literal id.
        const bookingTypes = [
            {cID: 41, cRole: "buy" as const},
            {cID: 42, cRole: "sell" as const},
            {cID: 43, cRole: "dividend" as const}
        ];

        it("computes portfolio quantity and invest value using cRole, not fixed literal ids", () => {
            const bookings: Partial<BookingDb>[] = [
                {cStockID: 5, cBookingTypeID: 41, cCount: 10, cDebit: 1000, cBookDate: "2024-01-01"},
                {cStockID: 5, cBookingTypeID: 42, cCount: 4, cBookDate: "2024-02-01"}
            ];

            expect(
                DomainLogic.calculatePortfolioByStockId(bookings as BookingDb[], 5, bookingTypes)
            ).toBe(6);
            expect(
                DomainLogic.calculateInvestByStockId(bookings as BookingDb[], 5, bookingTypes)
            ).toBe(600);
        });

        it("keeps the FIFO cost basis stable when a booking has no cBookDate", () => {
            // validateBooking's normalizeDate() yields "" for a missing/malformed
            // date, which a backup import can carry in. utcMs("") is NaN, and the
            // old `utcMs(b) - utcMs(a)` comparator therefore returned NaN. This
            // does not merely misplace that row, it leaves the sort order
            // ARBITRARY for the whole array, so the FIFO walk charged the cost
            // basis to whichever BUY lots happened to land first.
            //
            // 10 shares remain (30 bought, 20 sold). FIFO means the NEWEST lot is
            // the one still held, so the invest value must be the 2024 lot's 300 —
            // and must not depend on the order the bookings arrive in.
            const lots: Partial<BookingDb>[] = [
                {cStockID: 5, cBookingTypeID: 41, cCount: 10, cDebit: 100, cBookDate: "2020-01-01"},
                {cStockID: 5, cBookingTypeID: 41, cCount: 10, cDebit: 999, cBookDate: ""},
                {cStockID: 5, cBookingTypeID: 41, cCount: 10, cDebit: 300, cBookDate: "2024-01-01"},
                {cStockID: 5, cBookingTypeID: 42, cCount: 20, cBookDate: "2025-01-01"}
            ];

            const permutations: Partial<BookingDb>[][] = [
                lots,
                [lots[1], lots[0], lots[2], lots[3]],
                [lots[2], lots[1], lots[0], lots[3]],
                [lots[3], lots[2], lots[1], lots[0]]
            ];

            const results = permutations.map((bookings) =>
                DomainLogic.calculateInvestByStockId(bookings as BookingDb[], 5, bookingTypes)
            );

            expect(DomainLogic.calculatePortfolioByStockId(lots as BookingDb[], 5, bookingTypes)).toBe(10);
            // Every permutation must agree...
            expect(new Set(results).size).toBe(1);
            // ...on the newest lot's cost, never the dateless row's 999.
            expect(results[0]).toBe(300);
        });

        it("returns dividend bookings for a stock using cRole, not a fixed literal id", () => {
            const bookings: Partial<BookingDb>[] = [
                {cID: 900, cStockID: 5, cBookingTypeID: 43, cExDate: "2024-03-01", cCredit: 12.5},
                {cID: 901, cStockID: 5, cBookingTypeID: 41, cExDate: "2024-04-01", cCredit: 0}
            ];

            expect(
                DomainLogic.getDividendBookingsByStockId(bookings as BookingDb[], 5, bookingTypes)
                // Field is named `exDate`, not `year`: it carries the booking's
                // full cExDate, and the column rendering it is labeled
                // "Ex-date"/"Ex-Tag".
            ).toEqual([{id: 900, exDate: "2024-03-01", sum: 12.5}]);
        });
    });

    describe("applyBookingRoleInvariants", () => {
        const bookingTypes = [
            {cID: 41, cRole: "buy" as const},
            {cID: 42, cRole: "sell" as const},
            {cID: 43, cRole: "dividend" as const},
            {cID: 44, cRole: "other" as const}
        ];

        const staleBooking: BookingDb = {
            cID: 1,
            cBookDate: "2024-01-01",
            cExDate: "2024-01-01",
            cDebit: 0,
            cCredit: 0,
            cDescription: "",
            cCount: 10,
            cBookingTypeID: 41,
            cAccountNumberID: 1,
            cStockID: 5,
            cSoliCredit: 1,
            cSoliDebit: 0,
            cTaxCredit: 2,
            cTaxDebit: 0,
            cFeeCredit: 3,
            cFeeDebit: 0,
            cSourceTaxCredit: 4,
            cSourceTaxDebit: 0,
            cTransactionTaxCredit: 5,
            cTransactionTaxDebit: 0,
            cMarketPlace: "XETRA"
        };

        it("keeps fee/transactionTax and drops tax/soli/sourceTax for a buy-role booking", () => {
            const result = DomainLogic.applyBookingRoleInvariants(
                {...staleBooking, cBookingTypeID: 41},
                bookingTypes
            );

            expect(result).toMatchObject({
                cStockID: 5,
                cCount: 10,
                cMarketPlace: "XETRA",
                cFeeCredit: 3,
                cTransactionTaxCredit: 5,
                cSoliCredit: 0,
                cTaxCredit: 0,
                cSourceTaxCredit: 0
            });
        });

        it("keeps fee/tax/soli/sourceTax and drops transactionTax for a sell-role booking", () => {
            const result = DomainLogic.applyBookingRoleInvariants(
                {...staleBooking, cBookingTypeID: 42},
                bookingTypes
            );

            expect(result).toMatchObject({
                cStockID: 5,
                cCount: 10,
                cMarketPlace: "XETRA",
                cFeeCredit: 3,
                cSoliCredit: 1,
                cTaxCredit: 2,
                cSourceTaxCredit: 4,
                cTransactionTaxCredit: 0
            });
        });

        it("clears every role-inapplicable field for an 'other'-role booking (e.g. a backup exported before roles existed)", () => {
            const result = DomainLogic.applyBookingRoleInvariants(
                {...staleBooking, cBookingTypeID: 44},
                bookingTypes
            );

            expect(result).toMatchObject({
                cStockID: 0,
                cCount: 0,
                cMarketPlace: "",
                cFeeCredit: 0,
                cSoliCredit: 0,
                cTaxCredit: 0,
                cSourceTaxCredit: 0,
                cTransactionTaxCredit: 0
            });
        });

        it("treats an unresolvable cBookingTypeID (no matching booking type) the same as 'other'", () => {
            const result = DomainLogic.applyBookingRoleInvariants(
                {...staleBooking, cBookingTypeID: 999},
                bookingTypes
            );

            expect(result.cStockID).toBe(0);
            expect(result.cFeeCredit).toBe(0);
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

