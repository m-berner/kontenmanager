/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StockDb, StockItem, StockRamData} from "@/types";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {useSettingsStore} from "@/stores/settings";
import {fetchService} from "@/services/fetch";
import {useRuntimeStore} from "@/stores/runtime";
import {isoDate, log, toNumber, utcDate} from "@/domains/utils/utils";
import {CURRENCIES, DATE, ERROR_CATEGORY, INDEXED_DB} from "@/constants";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {browserService} from "@/services/browserService";
import {useBookingsStore} from "@/stores/bookings";
import * as DomainLogic from "@/domains/logic";
import {appError} from "@/domains/errors";

const ASK_DATE_INTERVAL = 7;
const MILLISECONDS_PER_DAY = 86400000;


/**
 * A state management store for handling stock-related data and operations.
 *
 * This store is responsible for managing stock records, providing computed data,
 * and exposing functions for updating, retrieving, and enriching stocks.
 */
export const useStocksStore = defineStore("stocks", function () {
    const {investByStockId, portfolioByStockId, hasStockID} =
        useBookingsStore();
    const runtime = useRuntimeStore();
    const settings = useSettingsStore();

    /**
     * A reactive reference to an array of StockItem objects.
     * This variable is intended to store and manage a collection of items representing stock inventory.
     * It is initialized as an empty array and can be updated dynamically.
     *
     * @type {import('vue').Ref<StockItem[]>}
     */
    const items: import('vue').Ref<StockItem[]> = ref<StockItem[]>([]);

    /**
     * Inserts an item into the list of stock items. The item can be added
     * either at the beginning or the end of the list based on the prepend flag.
     *
     * @param item - The stock item to be inserted into the list.
     * @param prepend - A flag indicating whether the item should be
     * added to the beginning (true) or the end (false) of the list.
     */
    function insertItem(item: StockItem, prepend: boolean): void {
        items.value = prepend ? [item, ...items.value] : [...items.value, item];
    }

    /**
     * Extracts RAM data from a given stock item.
     *
     * @param stock - The stock item object containing various financial data properties.
     * @returns An object containing extracted RAM data, including portfolio, investment, change, buy value, and other related properties.
     */
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
            (id: number): StockItem => {
                const stock = getById.value(id);
                if (!stock) {
                    throw appError("xx_missing_record", ERROR_CATEGORY.STORE, false, {id});
                }
                return stock;
            }
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
                    : (b.mPortfolio ?? 0) - (a.mPortfolio ?? 0);
            });
    });

    /**
     * Calculates the total depot value for the active account.
     */
    const sumDepot = computed(() => (): number => {
        if (settings.activeAccountId === -1) {
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
        log("STORES stocks: add");
        const completeStock: StockItem = {
            ...stock,
            ...INDEXED_DB.STORE.STOCK_MEMORY
        };
        insertItem(completeStock, prepend);
    }

    /**
     * Updates a stock while preserving RAM-only values.
     *
     * @param stockDb - Updated stock database record
     */
    function update(stockDb: StockDb): void {
        log("STORES stocks: updateStock", stockDb, "info");

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
        log("STORES stocks: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    /** Clears all stock records. */
    function clean(): void {
        log("STORES stocks: clean");
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
     * Loads online stock data for a specified page and updates the stock information based on fetched data.
     *
     * @param {number} page - The page number to load data for. Determines the range of stocks to be processed.
     * @param {Object} [options] - Optional parameters for the operation.
     * @param {AbortSignal} [options.signal] - An AbortSignal to allow aborting the fetch requests.
     *
     * @returns A promise that resolves when the stock data has been successfully loaded and updated.
     */
    async function loadOnlineData(page: number, options?: { signal?: AbortSignal }) {
        log("STORES stocks: loadOnlineData");
        const {getStorage} = storageAdapter();

        const isin = [];
        const isinDates = [];
        const itemsLength = active.value.length;
        if (itemsLength === 0) return;

        const startIndex = (page - 1) * settings.stocksPerPage;
        const pageStocks = active.value.slice(
            startIndex,
            startIndex + settings.stocksPerPage
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

            const meetingTime = utcDate(stock.cMeetingDay).getTime();
            const quarterTime = utcDate(stock.cQuarterDay).getTime();
            const askTime = utcDate(stock.cAskDates).getTime();

            if ((meetingTime < now || quarterTime < now) && askTime < now) {
                isinDates.push({
                    key: stock.cID,
                    value: stock.cISIN
                });
            }
        }

        const [minRateMaxResponse, dateResponse] = await Promise.all([
            fetchService.fetchMinRateMaxData(isin, getStorage, {
                signal: options?.signal
            }),
            fetchService.fetchDateData(isinDates, {signal: options?.signal})
        ]);

        pageStocks.forEach((stock, i) => {
            const data = minRateMaxResponse[i];
            if (!data) return;

            const stockToUpdate = getById.value(stock.cID as number);
            if (!stockToUpdate) return;

            const locale = browserService.getUserLocale();

            let region: string | undefined;
            try {
                region = new Intl.Locale(locale).region?.toUpperCase();
            } catch (error) {
                region = undefined;
            }

            const uiCur = region ? CURRENCIES.CODE.get(region) : undefined;

            const divisor =
                data.cur === uiCur
                    ? 1
                    : data.cur === "EUR"
                        ? runtime.curEur
                        : runtime.curUsd;

            stockToUpdate.mMin = toNumber(data.min) / divisor;
            stockToUpdate.mValue = toNumber(data.rate) / divisor;
            stockToUpdate.mMax = toNumber(data.max) / divisor;
            stockToUpdate.mEuroChange =
                stockToUpdate.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);

            const dateData = dateResponse.find((d) => d.key === stock.cID);
            if (dateData) {
                stockToUpdate.cMeetingDay =
                    dateData.value.gm > 0
                        ? isoDate(dateData.value.gm)
                        : DATE.ISO;
                stockToUpdate.cQuarterDay =
                    dateData.value.qf > 0
                        ? isoDate(dateData.value.qf)
                        : DATE.ISO;
                stockToUpdate.cAskDates = isoDate(
                    now + ASK_DATE_INTERVAL * MILLISECONDS_PER_DAY
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

log("STORES stocks");
