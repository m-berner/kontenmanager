/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {attachStoreDeps} from "@/adapters/primary/stores/deps";
import {useStocksStore} from "@/adapters/primary/stores/stocks";
import {usePortfolioStore} from "@/adapters/primary/stores/portfolio";
import {useBookingsStore} from "@/adapters/primary/stores/bookings";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {DATE} from "@/domain/constants";
import type {BookingDb, StockItem} from "@/domain/types";

function createSampleStock(overrides: Partial<StockItem> = {}): StockItem {
    return {
        cID: 1,
        cCompany: "Test Company",
        cISIN: "US1234567890",
        cSymbol: "TEST",
        cFadeOut: 0,
        cFirstPage: 0,
        cURL: "",
        cMeetingDay: DATE.ISO,
        cQuarterDay: DATE.ISO,
        cAccountNumberID: 1,
        cAskDates: DATE.ISO,
        ...overrides
    };
}

function createSampleBuyBooking(overrides: Partial<BookingDb> = {}): BookingDb {
    return {
        cID: 1,
        cStockID: 1,
        cCount: 10,
        cBookingTypeID: 1, // Buy
        cCredit: 0,
        cDebit: 1000,
        cBookDate: "2024-01-01",
        cExDate: "",
        cDescription: "",
        cMarketPlace: "",
        cAccountNumberID: 1,
        cTaxDebit: 0,
        cTaxCredit: 0,
        cSourceTaxDebit: 0,
        cSourceTaxCredit: 0,
        cTransactionTaxDebit: 0,
        cTransactionTaxCredit: 0,
        cSoliDebit: 0,
        cSoliCredit: 0,
        cFeeDebit: 0,
        cFeeCredit: 0,
        ...overrides
    };
}

describe("Stocks + Portfolio Stores", () => {
    const getStorage = vi.fn().mockResolvedValue({});

    beforeEach(() => {
        vi.clearAllMocks();

        const pinia = setActiveTestPinia();
        attachStoreDeps(pinia, {
            storageAdapter: () => ({
                clearStorage: vi.fn().mockResolvedValue(undefined),
                getStorage,
                setStorage: vi.fn().mockResolvedValue(undefined),
                addStorageChangedListener: vi.fn(() => vi.fn()),
                installStorageLocal: vi.fn().mockResolvedValue(undefined)
            }),
            alertAdapter: {
                feedbackInfo: vi.fn(),
                feedbackWarning: vi.fn(),
                feedbackConfirm: vi.fn(),
                feedbackError: vi.fn()
            }
        });
    });

    it("stocks.active only filters/sorts (no enrichment)", () => {
        const stocks = useStocksStore();

        stocks.items = [
            createSampleStock({cID: 1, cCompany: "A", cFirstPage: 0}),
            createSampleStock({cID: 2, cCompany: "B", cFirstPage: 1}),
            createSampleStock({cID: 3, cCompany: "C", cFirstPage: 0, cFadeOut: 1}),
            createSampleStock({cID: 0, cCompany: "Zero", cFirstPage: 1})
        ];

        expect(stocks.active).toHaveLength(2);
        expect(stocks.active[0].cCompany).toBe("B");
        expect(stocks.active[1].cCompany).toBe("A");
        expect((stocks.active[0] as StockItem).mPortfolio).toBeUndefined();
    });

    it("portfolio.active enriches with portfolio/invest/deleteable and sorts", () => {
        const stocks = useStocksStore();
        const bookings = useBookingsStore();
        const portfolio = usePortfolioStore();

        stocks.items = [
            createSampleStock({cID: 1, cCompany: "A", cFirstPage: 0, mValue: 100}),
            createSampleStock({cID: 2, cCompany: "B", cFirstPage: 1, mValue: 100}),
            createSampleStock({cID: 3, cCompany: "C", cFirstPage: 0, mValue: 100})
        ];

        bookings.items = [
            createSampleBuyBooking({cStockID: 1, cCount: 10, cDebit: 1000}),
            createSampleBuyBooking({cStockID: 3, cCount: 20, cDebit: 2000})
        ];

        // Sorted: B (firstPage=1), then C (portfolio=20), then A (portfolio=10)
        expect(portfolio.active[0].cCompany).toBe("B");
        expect(portfolio.active[1].cCompany).toBe("C");
        expect(portfolio.active[2].cCompany).toBe("A");

        expect(portfolio.active[2].mPortfolio).toBe(10);
        expect(portfolio.active[2].mInvest).toBe(1000);
        expect(portfolio.active[2].mDeleteable).toBe(false);
    });

    it("portfolio.sumDepot returns 0 without active account", () => {
        const portfolio = usePortfolioStore();
        const settings = useSettingsStore();
        settings.activeAccountId = -1;
        expect(portfolio.sumDepot()).toBe(0);
    });

    it("portfolio.sumDepot calculates total depot value (ignores < 0.1 shares)", () => {
        const stocks = useStocksStore();
        const bookings = useBookingsStore();
        const portfolio = usePortfolioStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        stocks.items = [
            createSampleStock({cID: 1, mValue: 200}),
            createSampleStock({cID: 2, mValue: 100})
        ];
        bookings.items = [
            createSampleBuyBooking({cStockID: 1, cCount: 10.5, cDebit: 2100}),
            createSampleBuyBooking({cStockID: 2, cCount: 0.05, cDebit: 5})
        ];

        expect(portfolio.sumDepot()).toBe(2100);
    });

});
