/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {useStocksStore} from "@/adapters/ui/stores/stocks";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {useOnlineStockData} from "@/adapters/ui/composables/useOnlineStockData";
import {DATE} from "@/domain/constants";
import type {StockItem} from "@/domain/types";

const fetchMinRateMaxData = vi.fn();
const fetchDateData = vi.fn();
const getStorage = vi.fn().mockResolvedValue({});
const stocksSave = vi.fn().mockResolvedValue(1);

vi.mock("@/adapters/context", () => ({
    useAdapters: () => ({
        fetchAdapter: {fetchMinRateMaxData, fetchDateData, clearCache: vi.fn()},
        storageAdapter: () => ({getStorage}),
        browserAdapter: {getUserLocale: () => "de-DE"},
        alertAdapter: {feedbackInfo: vi.fn(), feedbackError: vi.fn()},
        repositories: {stocks: {save: stocksSave}}
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

        // cMeetingDay/cQuarterDay/cAskDates are persisted columns — without this
        // write-back, cAskDates 7-day re-fetch throttle would reset on reload.
        expect(stocksSave).toHaveBeenCalledTimes(1);
        expect(stocksSave).toHaveBeenCalledWith(
            expect.objectContaining({cID: 1, cAskDates: updated.cAskDates})
        );
    });

    it("does not write to the database when no date data came back", async () => {
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        fetchMinRateMaxData.mockResolvedValue({
            data: [{id: 1, isin: "US123", min: "50", rate: "150", max: "250", cur: "EUR"}],
            failedIsins: []
        });
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1);

        // A price-only refresh must not turn into a DB write on every poll.
        expect(stocks.items[0].mValue).toBe(150);
        expect(stocksSave).not.toHaveBeenCalled();
    });

    it("still marks the page loaded when persisting fetched dates fails", async () => {
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
        stocksSave.mockRejectedValueOnce(new Error("db down"));

        const {loadOnlineData} = useOnlineStockData();
        await expect(loadOnlineData(1)).resolves.toBeUndefined();

        // The dates are already correct in memory for this session; a failed
        // persist must not break the price refresh or the freshness marker.
        expect(stocks.items[0].mValue).toBe(150);
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

    it("discards a stale response when a newer overlapping call for the same page already wrote fresher data", async () => {
        // Simulates two independent callers (e.g. per-row quote update and
        // header-bar refresh-all) racing on the same page: the older, slower
        // request must not clobber the newer, already-applied result.
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        let resolveStaleFetch: (value: unknown) => void = () => undefined;
        const staleFetch = new Promise((resolve) => {
            resolveStaleFetch = resolve;
        });

        fetchMinRateMaxData
            .mockImplementationOnce(() => staleFetch)
            .mockResolvedValueOnce({
                data: [{id: 1, isin: "US123", min: "50", rate: "200", max: "250", cur: "EUR"}],
                failedIsins: []
            });
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();

        const olderCall = loadOnlineData(1);
        const newerCall = loadOnlineData(1);
        await newerCall;

        expect(stocks.items[0].mValue).toBe(200);

        resolveStaleFetch({
            data: [{id: 1, isin: "US123", min: "10", rate: "100", max: "110", cur: "EUR"}],
            failedIsins: []
        });
        await olderCall;

        expect(stocks.items[0].mValue).toBe(200);
        expect(runtime.loadedStocksPages.has(1)).toBe(true);
    });

    it("discards a stale response when a newer call lands while the failed-ISIN alert is still awaiting", async () => {
        // The generation check runs once before the fetches, but a second check must
        // also run after the `feedbackInfo` await triggered by a partial fetch
        // failure. Otherwise, a newer overlapping call that finishes during that
        // await gets clobbered by the older call resuming afterward.
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        let resolveAlert: () => void = () => undefined;
        const alertPromise = new Promise<void>((resolve) => {
            resolveAlert = resolve;
        });
        const {useAdapters} = await import("@/adapters/context");
        const {alertAdapter} = useAdapters();
        vi.mocked(alertAdapter.feedbackInfo).mockImplementationOnce(() => alertPromise);

        fetchMinRateMaxData
            .mockResolvedValueOnce({
                data: [{id: 1, isin: "US123", min: "10", rate: "100", max: "110", cur: "EUR"}],
                failedIsins: ["US123"]
            })
            .mockResolvedValueOnce({
                data: [{id: 1, isin: "US123", min: "50", rate: "200", max: "250", cur: "EUR"}],
                failedIsins: []
            });
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();

        const olderCall = loadOnlineData(1);
        // Let the older call's fetch resolve and reach the (still-pending) alert await.
        await Promise.resolve();
        await Promise.resolve();

        const newerCall = loadOnlineData(1);
        await newerCall;
        expect(stocks.items[0].mValue).toBe(200);

        resolveAlert();
        await olderCall;

        expect(stocks.items[0].mValue).toBe(200);
        expect(runtime.loadedStocksPages.has(1)).toBe(true);
    });

    it("still writes date data for a stock whose price fetch failed", async () => {
        // Price and date data come from two independent fetches; a null price
        // entry for one stock must not discard that stock's own date data.
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", mValue: 0})];

        fetchMinRateMaxData.mockResolvedValue({
            data: [null],
            failedIsins: ["US123"]
        });
        fetchDateData.mockResolvedValue([
            {key: 1, value: {gm: 1738944000000, qf: 1738944000000}}
        ]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1);

        const updated = stocks.items[0];
        expect(updated.mValue).toBe(0);
        expect(updated.cMeetingDay).not.toBe(DATE.ISO);
        expect(updated.cQuarterDay).not.toBe(DATE.ISO);
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

    it("fetches the explicitly supplied stockIds instead of a positional page slice", async () => {
        // `cCompany` and `mPortfolio` are sortable headers, so Vuetify paginates
        // its OWN sorted view — a positional slice of portfolio.active stops
        // matching what the user sees the moment they sort, and quotes were
        // fetched for rows nobody was looking at. CompanyContent now passes the
        // ids it actually rendered.
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 2;
        stocks.items = [
            createSampleStock({cID: 1, cISIN: "US001", cSymbol: "A"}),
            createSampleStock({cID: 2, cISIN: "US002", cSymbol: "B"}),
            createSampleStock({cID: 3, cISIN: "US003", cSymbol: "C"})
        ];

        fetchMinRateMaxData.mockResolvedValue({data: [], failedIsins: []});
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        // Page 1's positional slice would be [1, 2]; ask for [3, 1] instead.
        await loadOnlineData(1, {stockIds: [3, 1]});

        const requested = fetchMinRateMaxData.mock.calls[0][0] as { id: number }[];
        expect(requested.map((entry) => entry.id)).toEqual([3, 1]);
    });

    it("does not mark a page loaded when the supplied stockIds resolve to no stocks", async () => {
        // The failure mode this guards: CompanyContent read `cID` off Vuetify's
        // DataTableItem wrappers, so every id arrived as `undefined`. Nothing
        // resolved, nothing was fetched, nothing was written — and the page was
        // still marked loaded, so the freshness marker then suppressed the next
        // attempt for a minute while the price columns stayed blank.
        const stocks = useStocksStore();
        const runtime = useRuntimeStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 2;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US001"})];

        fetchMinRateMaxData.mockResolvedValue({data: [], failedIsins: []});
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1, {stockIds: [undefined as unknown as number, 999]});

        expect(fetchMinRateMaxData).not.toHaveBeenCalled();
        expect(runtime.loadedStocksPages.has(1)).toBe(false);
    });

    it("falls back to the positional page slice when no stockIds are supplied", async () => {
        // refreshAllOnlineData sweeps every page and must keep working this way.
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 2;
        stocks.items = [
            createSampleStock({cID: 1, cISIN: "US001", cSymbol: "A"}),
            createSampleStock({cID: 2, cISIN: "US002", cSymbol: "B"}),
            createSampleStock({cID: 3, cISIN: "US003", cSymbol: "C"})
        ];

        fetchMinRateMaxData.mockResolvedValue({data: [], failedIsins: []});
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(2);

        const requested = fetchMinRateMaxData.mock.calls[0][0] as { id: number }[];
        expect(requested.map((entry) => entry.id)).toEqual([3]);
    });

    it("survives a malformed stock date instead of aborting the whole page's refresh", async () => {
        // utcDate() THROWS on a non-empty, non-ISO string. Nothing constrains
        // these columns to ISO (validateStock only trims them, validateDataIntegrity
        // ignores stock dates, and getAccountRecords returns raw IndexedDB rows). So
        // an imported/hand-edited backup used to kill the page's quote load outright
        // on the FIRST stock, before a single fetch was issued.
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", cMeetingDay: "15.03.2024", mValue: 0})];

        fetchMinRateMaxData.mockResolvedValue({
            data: [{id: 1, isin: "US123", min: "50", rate: "150", max: "250", cur: "EUR"}],
            failedIsins: []
        });
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await expect(loadOnlineData(1)).resolves.toBeUndefined();

        expect(fetchMinRateMaxData).toHaveBeenCalled();
        expect(stocks.items[0].mValue).toBe(150);
    });

    it("treats a blank cAskDates as due rather than never re-fetching that stock's dates", async () => {
        // utcDate("") yields an Invalid Date, and a NaN comparison is always
        // false - so the stock was silently excluded from the date lookup for good.
        const stocks = useStocksStore();
        const settings = useSettingsStore();

        settings.activeAccountId = 1;
        settings.stocksPerPage = 10;
        stocks.items = [createSampleStock({cID: 1, cISIN: "US123", cAskDates: ""})];

        fetchMinRateMaxData.mockResolvedValue({data: [], failedIsins: []});
        fetchDateData.mockResolvedValue([]);

        const {loadOnlineData} = useOnlineStockData();
        await loadOnlineData(1);

        expect(fetchDateData).toHaveBeenCalledWith(
            [{key: 1, value: "US123"}],
            expect.anything()
        );
    });

    // A blank cISIN used to go into the request list anyway, so
    // fetchMinRateMaxData built `service.QUOTE + ""` -- the provider's search
    // endpoint with an empty query -- fetched it, failed to parse a rate, and
    // threw. The ISIN landed in failedIsins, which raises a NON-DISMISSING
    // alert naming the company, on every refresh of that page, forever.
    // Reachable only via backup import: isinRules requires an ISIN on the add
    // form, but validateStock normalizes a missing cISIN to "".
    describe("stocks with no ISIN", () => {
        it("are not included in the quote or date requests", async () => {
            const stocks = useStocksStore();
            const settings = useSettingsStore();

            settings.activeAccountId = 1;
            settings.stocksPerPage = 10;
            stocks.items = [
                createSampleStock({cID: 1, cISIN: "US123"}),
                createSampleStock({cID: 2, cISIN: "", cCompany: "Imported Inc"}),
                createSampleStock({cID: 3, cISIN: "   ", cCompany: "Whitespace Inc"})
            ];

            fetchMinRateMaxData.mockResolvedValue({
                data: [{id: 1, isin: "US123", min: "50", rate: "150", max: "250", cur: "EUR"}],
                failedIsins: []
            });
            fetchDateData.mockResolvedValue([]);

            const {loadOnlineData} = useOnlineStockData();
            await loadOnlineData(1);

            expect(fetchMinRateMaxData).toHaveBeenCalledWith(
                [expect.objectContaining({id: 1, isin: "US123"})],
                expect.anything(),
                expect.anything()
            );
            expect(fetchDateData).toHaveBeenCalledWith(
                [{key: 1, value: "US123"}],
                expect.anything()
            );
        });

        it("do not shift the positional mapping of quotes onto other stocks", async () => {
            // THE TRAP in this fix: minRateMaxResponse.data[i] is indexed
            // positionally against the request list, so the write-back loop has
            // to iterate the same filtered array. Putting the blank-ISIN stock
            // FIRST is what catches an off-by-one -- if the loop still walked
            // the unfiltered page, stock 2's quote would land on stock 1.
            const stocks = useStocksStore();
            const settings = useSettingsStore();

            settings.activeAccountId = 1;
            settings.stocksPerPage = 10;
            stocks.items = [
                createSampleStock({cID: 1, cISIN: "", cCompany: "No ISIN", mValue: 0}),
                createSampleStock({cID: 2, cISIN: "US222", cCompany: "Real", mValue: 0})
            ];

            fetchMinRateMaxData.mockResolvedValue({
                data: [{id: 2, isin: "US222", min: "10", rate: "222", max: "30", cur: "EUR"}],
                failedIsins: []
            });
            fetchDateData.mockResolvedValue([]);

            const {loadOnlineData} = useOnlineStockData();
            await loadOnlineData(1);

            expect(stocks.items.find((s) => s.cID === 2)?.mValue).toBe(222);
            expect(stocks.items.find((s) => s.cID === 1)?.mValue).toBe(0);
        });

        it("mark the page loaded and fetch nothing when no stock on it has an ISIN", async () => {
            const stocks = useStocksStore();
            const runtime = useRuntimeStore();
            const settings = useSettingsStore();

            settings.activeAccountId = 1;
            settings.stocksPerPage = 10;
            stocks.items = [createSampleStock({cID: 1, cISIN: ""})];

            const {loadOnlineData} = useOnlineStockData();
            await loadOnlineData(1);

            expect(fetchMinRateMaxData).not.toHaveBeenCalled();
            expect(fetchDateData).not.toHaveBeenCalled();
            // Marked, unlike the "requested ids resolved to nothing" bail-out:
            // retrying in a minute would find the same nothing.
            expect(runtime.loadedStocksPages.has(1)).toBe(true);
        });
    });
});
