/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useStocksStore} from "./stocks";
import {useBookingsStore} from "./bookings";
import {useSettingsStore} from "./settings";
import {useRuntimeStore} from "./runtime";
import {fetchService} from "@/services/fetch";
import {DATE} from "@/domains/configs/date";
import type {StockItem} from "@/types";

// Mock dependencies
vi.mock("@/services/fetch", () => ({
    fetchService: {
        fetchMinRateMaxData: vi.fn(),
        fetchDateData: vi.fn()
    }
}));

vi.mock("@/composables/useBrowser", () => ({
    useBrowser: () => ({
        showSystemNotification: vi.fn(),
        getUserLocale: () => "de-DE"
    })
}));

vi.mock("@/composables/useStorage", () => ({
    useStorage: () => ({
        getStorage: vi.fn(),
        setStorage: vi.fn(),
        addStorageChangedListener: vi.fn()
    })
}));

describe("Stocks Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    const createSampleStock = (overrides = {}): StockItem => ({
        cID: 1,
        cCompany: "Test Company",
        cISIN: "US1234567890",
        cSymbol: "TEST",
        cFadeOut: 0,
        cFirstPage: 0,
        cURL: "",
        cMeetingDay: "",
        cQuarterDay: "",
        cAccountNumberID: 1,
        cAskDates: "",
        mValue: 100,
        ...overrides
    });

    const createSampleBooking = (overrides = {}) => ({
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
    });

    describe("Initial State", () => {
        it("should have an empty items array", () => {
            const stocksStore = useStocksStore();
            expect(stocksStore.items).toEqual([]);
        });
    });

    describe("Getters", () => {
        it("active should filter and enrich stocks", () => {
            const stocksStore = useStocksStore();
            const bookingsStore = useBookingsStore();
            bookingsStore.items = [
                createSampleBooking({cStockID: 1, cCount: 5, cDebit: 500})
            ];

            stocksStore.items = [
                createSampleStock({cID: 1, cCompany: "Active", cFadeOut: 0}),
                createSampleStock({cID: 2, cCompany: "Passive", cFadeOut: 1}),
                createSampleStock({cID: 0, cCompany: "ZeroID", cFadeOut: 0})
            ];

            expect(stocksStore.active).toHaveLength(1);
            expect(stocksStore.active[0].cCompany).toBe("Active");
            expect(stocksStore.active[0].mPortfolio).toBe(5);
            expect(stocksStore.active[0].mInvest).toBe(500);
            expect(stocksStore.active[0].cID).toBe(1);
        });

        it("active should sort by cFirstPage and then by mPortfolio value", () => {
            const stocksStore = useStocksStore();
            const bookingsStore = useBookingsStore();

            stocksStore.items = [
                createSampleStock({cID: 1, cCompany: "A", cFirstPage: 0}),
                createSampleStock({cID: 2, cCompany: "B", cFirstPage: 1}),
                createSampleStock({cID: 3, cCompany: "C", cFirstPage: 0})
            ];

            bookingsStore.items = [
                createSampleBooking({cStockID: 1, cCount: 10}), // Val = 10 * 100 = 1000
                createSampleBooking({cStockID: 3, cCount: 20}) // Val = 20 * 100 = 2000
            ];

            // Sort: B (FirstPage=1), then C (Portfolio=20), then A (Portfolio=10)
            expect(stocksStore.active[0].cCompany).toBe("B");
            expect(stocksStore.active[1].cCompany).toBe("C");
            expect(stocksStore.active[2].cCompany).toBe("A");
        });

        it("passive should return only faded out stocks with ID > 0", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                createSampleStock({cID: 1, cFadeOut: 1}),
                createSampleStock({cID: 2, cFadeOut: 0}),
                createSampleStock({cID: 0, cFadeOut: 1})
            ];
            expect(stocksStore.passive).toHaveLength(1);
            expect(stocksStore.passive[0].cID).toBe(1);
        });

        it("getById and getItemById should retrieve correct stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                createSampleStock({cID: 42, cCompany: "The Answer"})
            ];
            expect(stocksStore.getById(42)?.cCompany).toBe("The Answer");
            expect(stocksStore.getItemById(42).cCompany).toBe("The Answer");
            expect(stocksStore.getById(99)).toBeNull();
        });
    });

    describe("Actions", () => {
        it("add should append or prepend a stock", () => {
            const stocksStore = useStocksStore();
            stocksStore.add(createSampleStock({cID: 1, cCompany: "First"}));
            stocksStore.add(createSampleStock({cID: 2, cCompany: "Second"}));
            stocksStore.add(createSampleStock({cID: 3, cCompany: "Zero"}), true);

            expect(stocksStore.items).toHaveLength(3);
            expect(stocksStore.items[0].cID).toBe(3);
            expect(stocksStore.items[2].cID).toBe(2);
        });

        it("update should modify an existing stock and keep RAM data", () => {
            const stocksStore = useStocksStore();
            const stock = createSampleStock({cID: 1, cCompany: "Old"});
            stocksStore.items = [stock];
            stocksStore.items[0].mValue = 500; // Mocked RAM data

            stocksStore.update(createSampleStock({cID: 1, cCompany: "New"}));

            expect(stocksStore.items[0].cCompany).toBe("New");
            expect(stocksStore.items[0].mValue).toBe(500);
        });

        it("remove should delete a stock by ID", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [
                createSampleStock({cID: 1}),
                createSampleStock({cID: 2})
            ];
            stocksStore.remove(1);
            expect(stocksStore.items).toHaveLength(1);
            expect(stocksStore.items[0].cID).toBe(2);
        });

        it("clean should empty the items array", () => {
            const stocksStore = useStocksStore();
            stocksStore.items = [createSampleStock()];
            stocksStore.clean();
            expect(stocksStore.items).toHaveLength(0);
        });
    });

    describe("sumDepot", () => {
        it("should return 0 if no active account is set", () => {
            const stocksStore = useStocksStore();
            const settingsStore = useSettingsStore();
            settingsStore.activeAccountId = -1;
            expect(stocksStore.sumDepot()).toBe(0);
        });

        it("should calculate the total depot value correctly including fractional shares", () => {
            const stocksStore = useStocksStore();
            const settingsStore = useSettingsStore();
            const bookingsStore = useBookingsStore();

            settingsStore.activeAccountId = 1;
            stocksStore.items = [
                createSampleStock({cID: 1, mValue: 200}),
                createSampleStock({cID: 2, mValue: 100})
            ];
            bookingsStore.items = [
                createSampleBooking({cStockID: 1, cCount: 10.5}), // 10.5 * 200 = 2100
                createSampleBooking({cStockID: 2, cCount: 0.05}) // < 0.1, ignored
            ];

            expect(stocksStore.sumDepot()).toBe(2100);
        });
    });

    describe("Online Data", () => {
        it("loadOnlineData should update stocks with fetched data", async () => {
            const stocksStore = useStocksStore();
            const runtimeStore = useRuntimeStore();

            stocksStore.items = [
                createSampleStock({cID: 1, cISIN: "US123", mValue: 0})
            ];

            vi.mocked(fetchService.fetchMinRateMaxData).mockResolvedValue([
                {id: 1, isin: "US123", min: "50", rate: "150", max: "250", cur: "EUR"}
            ]);
            vi.mocked(fetchService.fetchDateData).mockResolvedValue([
                {key: 1, value: {gm: 1738944000000, qf: 1738944000000}}
            ]);

            await stocksStore.loadOnlineData(1);

            const updated = stocksStore.items[0];
            expect(updated.mValue).toBe(150);
            expect(updated.mMin).toBe(50);
            expect(updated.mMax).toBe(250);
            expect(updated.cMeetingDay).not.toBe(DATE.ISO);
            expect(runtimeStore.loadedStocksPages.has(1)).toBe(true);
        });

        it("loadOnlineData should handle currency conversion (USD to EUR)", async () => {
            const stocksStore = useStocksStore();
            const runtimeStore = useRuntimeStore();
            runtimeStore.curEur = 1.1; // 1 EUR = 1.1 USD

            stocksStore.items = [createSampleStock({cID: 1, cISIN: "US123"})];

            vi.mocked(fetchService.fetchMinRateMaxData).mockResolvedValue([
                {
                    id: 1,
                    isin: "US123",
                    min: "110",
                    rate: "110",
                    max: "110",
                    cur: "USD"
                }
            ]);
            vi.mocked(fetchService.fetchDateData).mockResolvedValue([]);

            await stocksStore.loadOnlineData(1);
            // de-DE -> DE -> EUR.
            // data.cur (USD) !== uiCur (EUR) and data.cur !== "EUR" -> divisor = runtime.curEur (1.1)
            // value = 110 / 1.1 = 100
            expect(stocksStore.items[0].mValue).toBeCloseTo(100, 5);
        });

        it("refreshOnlineData should clear loaded pages and reload for given page", async () => {
            const stocksStore = useStocksStore();
            const runtimeStore = useRuntimeStore();

            // Add a stock so loadOnlineData doesn't return early
            stocksStore.items = [createSampleStock({cID: 1})];

            // Page 1 is already loaded
            runtimeStore.loadedStocksPages.add(1);

            vi.mocked(fetchService.fetchMinRateMaxData).mockResolvedValue([]);
            vi.mocked(fetchService.fetchDateData).mockResolvedValue([]);

            await stocksStore.refreshOnlineData(1);

            // refreshOnlineData calls runtime.loadedStocksPages.delete(page)
            // but loadOnlineData calls runtime.loadedStocksPages.add(page) at the end.
            // So it should be present again if everything works.
            expect(runtimeStore.loadedStocksPages.has(1)).toBe(true);
            expect(fetchService.fetchMinRateMaxData).toHaveBeenCalled();
        });
    });
});
