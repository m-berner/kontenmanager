/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {useStocksStore} from "@/adapters/primary/stores/stocks";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {useOnlineStockData} from "@/adapters/primary/composables/useOnlineStockData";
import {DATE} from "@/domain/constants";
import type {StockItem} from "@/domain/types";

const fetchMinRateMaxData = vi.fn();
const fetchDateData = vi.fn();
const getStorage = vi.fn().mockResolvedValue({});

vi.mock("@/adapters/context", () => ({
    useServices: () => ({
        fetchService: {fetchMinRateMaxData, fetchDateData, clearCache: vi.fn()},
        storageAdapter: () => ({getStorage}),
        browserService: {getUserLocale: () => "de-DE"},
        alertService: {feedbackInfo: vi.fn(), feedbackError: vi.fn()}
    })
}));

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

describe("useOnlineStockData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setActiveTestPinia();
    });

    it("loadOnlineData updates stock prices and marks page as loaded", async () => {
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        fetchMinRateMaxData.mockResolvedValue({
            data: [{id: 1, isin: "US123", min: "50", rate: "150", max: "250", cur: "EUR"}],
            failedIsins: []
        });
        fetchDateData.mockResolvedValue([
            {key: 1, value: {gm: 1738944000000, qf: 1738944000000}}
        ]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1);

        const updated = stocks.items[0];
        expect(updated.mValue).toBe(150);
        expect(updated.mMin).toBe(50);
        expect(updated.mMax).toBe(250);
        expect(updated.cMeetingDay).not.toBe(DATE.ISO);
        expect(runtime.loadedStocksPages.has(1)).toBe(true);
    });

    it("loadOnlineData converts USD values using runtime.curUsd", async () => {
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        runtime.curUsd = 1.1;
        runtime.curEur = 1.1;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        fetchMinRateMaxData.mockResolvedValue({
            data: [{id: 1, isin: "US123", min: "110", rate: "110", max: "110", cur: "USD"}],
            failedIsins: []
        });
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1);

        // de-DE → EUR. USD is treated as "not EUR" so divisor uses runtime.curUsd.
        expect(stocks.items[0].mValue).toBeCloseTo(100, 5);
    });

    it("refreshOnlineData invalidates page cache then reloads", async () => {
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];
        runtime.loadedStocksPages.add(1);

        fetchMinRateMaxData.mockResolvedValue({data: [], failedIsins: []});
        fetchDateData.mockResolvedValue([]);

        const {refreshOnlineData} = useOnlineStockData();
        await refreshOnlineData(1);

        expect(runtime.loadedStocksPages.has(1)).toBe(true);
        expect(fetchMinRateMaxData).toHaveBeenCalled();
    });
});
