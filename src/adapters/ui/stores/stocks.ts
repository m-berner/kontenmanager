/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {INDEXED_DB} from "@/domain/constants";
import type {StockItem, StockRamData, StockRecord} from "@/domain/types";
import {log} from "@/domain/utils/utils";
import {isDuplicateStockIsin, isDuplicateStockSymbol} from "@/domain/validation/duplicates";

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

    /**
     * Lifts the RAM-only fields off a stock item so `update()` can re-attach
     * them to an incoming DB record (which carries only the cXxx columns).
     *
     * Must stay in sync with `INDEXED_DB.STORE.STOCK_MEMORY`: a field read here
     * but missing from that seed would propagate `undefined` through every
     * update.
     */
    function extractRamData(stock: StockItem): StockRamData {
        const {
            mPortfolio,
            mInvest,
            mChange,
            mMin,
            mValue,
            mMax,
            mDeleteable
        } = stock;

        return {
            mPortfolio,
            mInvest,
            mChange,
            mMin,
            mValue,
            mMax,
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

    // `getItemById`, the throwing counterpart to `getById`, was removed here —
    // no consumer in `src/` or `tests/`. See the note in `stores/bookings.ts`.

    const isDuplicate = computed(() => (isin: string, excludeId?: number): boolean => {
        return isDuplicateStockIsin(items.value, isin, excludeId);
    });

    /**
     * Symbol counterpart to `isDuplicate`. Both `cISIN` and `cSymbol` are backed
     * by a per-account unique index (stocks_uk3 / stocks_uk4), so both need a
     * pre-save check — see isDuplicateStockSymbol.
     */
    const isDuplicateSymbol = computed(() => (symbol: string, excludeId?: number): boolean => {
        return isDuplicateStockSymbol(items.value, symbol, excludeId);
    });

    const passive = computed((): StockItem[] => {
        return items.value.filter((rec) => rec.cFadeOut === 1 && (rec.cID as number) > 0);
    });

    /**
     * Leaf-store view: filter + sort only, no cross-store enrichment.
     *
     * NOT the list stock paging slices — that is `portfolio.active`, which
     * additionally sorts by mPortfolio (holdings) within each cFirstPage
     * group. Page positions computed from this getter would not match what
     * the UI renders, so prefer `portfolio.active` for anything positional.
     */
    const active = computed((): StockItem[] => {
        return items.value
            .filter((rec) => rec.cFadeOut === 0 && (rec.cID as number) > 0)
            .sort((a, b) => b.cFirstPage - a.cFirstPage);
    });

    function add(stock: StockRecord, prepend: boolean = false): void {
        log("STORES stocks: add");
        const completeStock: StockItem = {
            ...stock,
            ...INDEXED_DB.STORE.STOCK_MEMORY
        };
        insertItem(completeStock, prepend);
    }

    function update(stockDb: StockRecord): void {
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
        getIndexById,
        active,
        passive,
        isDuplicate,
        isDuplicateSymbol,
        add,
        update,
        remove,
        clean
    };
});

log("STORES stocks");

