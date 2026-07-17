/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError} from "@/domain/errors";
import type {StockDb, StockItem, StockRamData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

/**
 * Leaf store for stock records.
 *
 * This store only manages the persisted stock data and RAM-only fields.
 * Cross-entity derivations (portfolio/invest/etc.) and side effects (online
 * loading) are handled by orchestration stores (e.g. `portfolio`).
 */
export const useStocksStore = defineStore("stocks", function () {
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

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex((stock) => stock.cID === id);
    });

    const getById = computed(() => (ident: number): StockItem | null => {
        const stock = items.value.find((entry) => entry.cID === ident);
        return stock ? stock : null;
    });

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

    const passive = computed((): StockItem[] => {
        return items.value.filter((rec) => rec.cFadeOut === 1 && (rec.cID as number) > 0);
    });

    const active = computed((): StockItem[] => {
        return items.value
            .filter((rec) => rec.cFadeOut === 0 && (rec.cID as number) > 0)
            .sort((a, b) => b.cFirstPage - a.cFirstPage);
    });

    function add(stock: StockDb, prepend: boolean = false): void {
        log("STORES stocks: add");
        const completeStock: StockItem = {
            ...stock,
            ...INDEXED_DB.STORE.STOCK_MEMORY
        };
        insertItem(completeStock, prepend);
    }

    function update(stockDb: StockDb): void {
        log("STORES stocks: updateStock", stockDb, "info");

        const index = getIndexById.value(stockDb.cID as number);
        if (index === -1) return;

        const newItems = [...items.value];
        const stockRam = extractRamData(newItems[index]);
        newItems[index] = {...stockDb, ...stockRam};
        items.value = newItems;
    }

    function remove(ident: number): void {
        log("STORES stocks: remove", ident, "info");
        items.value = items.value.filter((entry) => entry.cID !== ident);
    }

    function clean(): void {
        log("STORES stocks: clean");
        items.value = [];
    }

    return {
        items,
        getById,
        getItemById,
        getIndexById,
        active,
        passive,
        add,
        update,
        remove,
        clean
    };
});

log("STORES stocks");

