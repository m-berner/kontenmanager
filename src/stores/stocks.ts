/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StockDb, StockItem, StockRamData} from "@/types";
import {defineStore, storeToRefs} from "pinia";
import {computed, ref} from "vue";
import {useSettingsStore} from "@/stores/settings";
import {fetchService} from "@/services/fetch";
import {useRuntimeStore} from "@/stores/runtime";
import {DomainUtils} from "@/domains/utils";
import {DEFAULTS} from "@/configs/defaults";
import {DATE} from "@/domains/configs/date";
import {useStorage} from "@/composables/useStorage";
import {useBrowser} from "@/composables/useBrowser";
import {useBookingsStore} from "@/stores/bookings";
import {DomainLogic} from "@/domains/logic";
import {CURRENCIES} from "@/domains/configs/currencies";
import {STOCK_STORE_MEMORY} from "@/domains/logic";

export const useStocksStore = defineStore("stocks", function () {
    const {getUserLocale} = useBrowser();
    const {investByStockId, portfolioByStockId, hasStockID} =
        useBookingsStore();
    const runtime = useRuntimeStore();
    //const { curEur, curUsd } = storeToRefs(runtime);
    const settings = useSettingsStore();
    const {stocksPerPage, activeAccountId} = storeToRefs(settings);

    /** All stock records. */
    const items = ref<StockItem[]>([]);

    function insertItem(item: StockItem, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    function extractRamData(stock: StockItem): StockRamData {
        const {
            mPortfolio,
            mInvest,
            mChange,
            mBuyValue,
            mEuroChange,
            mMin,
            mValue,
            mMax,
            mDividendYielda,
            mDividendYeara,
            mDividendYieldb,
            mDividendYearb,
            mRealDividend,
            mRealBuyValue,
            mDeleteable
        } = stock;

        return {
            mPortfolio,
            mInvest,
            mChange,
            mBuyValue,
            mEuroChange,
            mMin,
            mValue,
            mMax,
            mDividendYielda,
            mDividendYeara,
            mDividendYieldb,
            mDividendYearb,
            mRealDividend,
            mRealBuyValue,
            mDeleteable
        };
    }

    /** Resolves the index of a stock by its ID. */
    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex((stock) => stock.cID === id);
    });

    /** Resolves a stock by its ID. */
    const getItemById = computed(
        () =>
            (id: number): StockItem =>
                items.value[getIndexById.value(id)]
    );

    /** Retrieves a stock record by its ID. */
    const getById = computed(() => (ident: number): StockItem | null => {
        const stock = items.value.find((entry: StockDb) => entry.cID === ident);
        return stock ? stock : null;
    });

    /** All passive (faded-out) stocks. */
    const passive = computed((): StockItem[] => {
        return items.value.filter((rec) => {
            return rec.cFadeOut === 1 && rec.cID as number > 0;
        });
    });

    /**
     * All active stocks enriched with portfolio and investment data.
     *
     * Sorted by first-page flag and portfolio value.
     */
    const active = computed((): StockItem[] => {
        return items.value
            .filter((rec: StockItem): boolean => {
                const {cFadeOut, cID} = rec;
                return cFadeOut === 0 && (cID as number) > 0;
            })
            .map((rec: StockItem): StockItem => {
                return {
                    ...rec,
                    //id: rec.cID, // Ensure 'id' is available for loadOnlineData
                    mPortfolio: portfolioByStockId(rec.cID as number),
                    mInvest: investByStockId(rec.cID as number),
                    mDeleteable: !hasStockID(rec.cID as number)
                };
            })
            .sort((a: StockItem, b: StockItem) => {
                const firstPageDiff = b.cFirstPage - a.cFirstPage;
                return firstPageDiff !== 0
                    ? firstPageDiff
                    : b.mPortfolio! - a.mPortfolio!;
            });
    });

    /**
     * Calculates the total depot value for the active account.
     */
    const sumDepot = computed(() => (): number => {
        if (activeAccountId.value === -1) {
            return 0;
        }

        return DomainLogic.calculateTotalDepotValue(active.value);
    });

    /**
     * Adds a stock to the store.
     *
     * @param stock - Stock database record
     * @param prepend - Whether to insert at the beginning
     */
    function add(stock: StockDb, prepend: boolean = false): void {
        DomainUtils.log("STORES stocks: add");
        const completeStock: StockItem = {
            ...stock,
            ...STOCK_STORE_MEMORY
        };
        insertItem(completeStock, prepend);
    }

    /**
     * Updates a stock while preserving RAM-only values.
     *
     * @param stockDb - Updated stock database record
     */
    function update(stockDb: StockDb): void {
        DomainUtils.log("STORES stocks: updateStock", stockDb, "info");

        const index = getIndexById.value(stockDb.cID as number);

        if (index !== -1) {
            const newItems = [...items.value];
            const stockRam = extractRamData(newItems[index]);
            newItems[index] = {...stockDb, ...stockRam};
            items.value = newItems;
        }
    }

    /** Removes a stock by ID. */
    function remove(ident: number): void {
        DomainUtils.log("STORES stocks: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /** Clears all stock records. */
    function clean(): void {
        DomainUtils.log("STORES stocks: clean");
        items.value = [];
    }

    /**
     * Forces a reload of online market data for the given page by
     * invalidating the page cache and delegating to `loadOnlineData`.
     *
     * @param page - The 1-based page index to refresh.
     * @returns A promise that resolves when the refresh is complete.
     */
    async function refreshOnlineData(page: number): Promise<void> {
        runtime.loadedStocksPages.delete(page);
        await loadOnlineData(page);
    }

    /**
     * Loads and enriches stock market data for the given page.
     *
     * - Uses the current page size from settings to slice active stocks
     * - Fetches min/rate/max values and next meeting/quarter dates
     * - Converts to EUR using runtime exchange rates
     * - Updates in-memory (RAM) fields on the corresponding stock entries
     *
     * @param page - The 1-based page index to load.
     * @returns A promise that resolves when enrichment finishes; returns early if there are no active stocks.
     */
    async function loadOnlineData(page: number) {
        DomainUtils.log("STORES stocks: loadOnlineData");
        const {getStorage} = useStorage();

        const isin = [];
        const isinDates = [];
        const itemsLength = active.value.length;
        if (itemsLength === 0) return;

        const startIndex = (page - 1) * stocksPerPage.value;
        const pageStocks = active.value.slice(
            startIndex,
            startIndex + stocksPerPage.value
        );
        const now = Date.now();

        for (const stock of pageStocks) {
            isin.push({
                id: stock.cID,
                isin: stock.cISIN,
                min: "0",
                rate: "0",
                max: "0",
                cur: ""
            });

            const meetingTime = DomainUtils.utcDate(stock.cMeetingDay).getTime();
            const quarterTime = DomainUtils.utcDate(stock.cQuarterDay).getTime();
            const askTime = DomainUtils.utcDate(stock.cAskDates).getTime();

            if ((meetingTime < now || quarterTime < now) && askTime < now) {
                isinDates.push({
                    key: stock.cID,
                    value: stock.cISIN
                });
            }
        }

        const [minRateMaxResponse, dateResponse] = await Promise.all([
            fetchService.fetchMinRateMaxData(isin, getStorage),
            fetchService.fetchDateData(isinDates)
        ]);

        pageStocks.forEach((stock, i) => {
            const data = minRateMaxResponse[i];
            if (!data) return;

            const stockToUpdate = getById.value(stock.cID as number);
            if (!stockToUpdate) return;

            const uiCur = CURRENCIES.CODE.get(
                getUserLocale().toLowerCase().substring(3, 5)
            );
            const divisor =
                data.cur === uiCur
                    ? 1
                    : data.cur === "EUR"
                        ? runtime.curUsd
                        : runtime.curEur;

            stockToUpdate.mMin = DomainUtils.toNumber(data.min) / divisor;
            stockToUpdate.mValue = DomainUtils.toNumber(data.rate) / divisor;
            stockToUpdate.mMax = DomainUtils.toNumber(data.max) / divisor;
            stockToUpdate.mEuroChange =
                stockToUpdate.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);

            const dateData = dateResponse.find((d) => d.key === stock.cID);
            if (dateData) {
                stockToUpdate.cMeetingDay =
                    dateData.value.gm > 0
                        ? DomainUtils.isoDate(dateData.value.gm)
                        : DATE.ISO;
                stockToUpdate.cQuarterDay =
                    dateData.value.qf > 0
                        ? DomainUtils.isoDate(dateData.value.qf)
                        : DATE.ISO;
                stockToUpdate.cAskDates = DomainUtils.isoDate(
                    now + DEFAULTS.ASK_DATE_INTERVAL * 86400000
                );
            }
        });

        runtime.loadedStocksPages.add(page);
    }

    return {
        items,
        getById,
        getItemById,
        getIndexById,
        active,
        passive,
        sumDepot,
        add,
        update,
        remove,
        clean,
        loadOnlineData,
        refreshOnlineData
    };
});

DomainUtils.log("STORES stocks");
