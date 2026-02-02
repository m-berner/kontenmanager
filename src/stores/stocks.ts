/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { StockDb, StockItem, StockRamData } from "@/types";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { fetchService } from "@/services/fetch";
import { useRuntimeStore } from "@/stores/runtime";
import { UtilsService } from "@/domains/utils";
import { DEFAULTS } from "@/config/defaults";
import { DATE } from "@/domains/config/date";
import { useStorage } from "@/composables/useStorage";
import { useBookingsStore } from "@/stores/bookings";
import { DomainLogic } from "@/domains/logic";

/**
 * Internal Pinia store managing stock records and derived stock data.
 *
 * @module stores/stocks
 * @returns Reactive stock state, computed aggregations,
 * and methods to mutate and enrich stock records.
 */
export const useStocksStore = defineStore("stocks", function () {
  const { investByStockId, portfolioByStockId, hasStockID } =
    useBookingsStore();
  const runtime = useRuntimeStore();
  const { curEur, curUsd } = storeToRefs(runtime);
  const settings = useSettingsStore();
  const { stocksPerPage } = storeToRefs(settings);

  /** All stock records. */
  const items = ref<StockItem[]>([]);

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
  const passive = computed(() => {
    return items.value.filter((rec) => {
      return rec.cFadeOut === 1 && rec.cID > 0;
    });
  });

  /**
   * All active stocks enriched with portfolio and investment data.
   *
   * Sorted by first-page flag and portfolio value.
   */
  const active = computed(() => {
    return items.value
      .filter((rec) => rec.cFadeOut === 0 && rec.cID > 0)
      .map((rec) => ({
        ...rec,
        id: rec.cID, // Ensure 'id' is available for loadOnlineData
        mPortfolio: portfolioByStockId(rec.cID),
        mInvest: investByStockId(rec.cID),
        mDeleteable: !hasStockID(rec.cID)
      }))
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
    const { activeAccountId } = useSettingsStore();

    if (activeAccountId === -1) {
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
    UtilsService.log("RECORDS_STOCKS: add");
    const completeStock = {
      ...stock,
      ...DEFAULTS.STOCK_MEMORY
    };
    if (prepend) {
      items.value = [completeStock, ...items.value];
    } else {
      items.value = [...items.value, completeStock];
    }
  }

  /**
   * Updates a stock while preserving RAM-only values.
   *
   * @param stockDb - Updated stock database record
   */
  function update(stockDb: StockDb): void {
    UtilsService.log("RECORDS_STOCKS: updateStock", stockDb, "info");

    const index = getIndexById.value(stockDb.cID);

    if (index !== -1) {
      const newItems = [...items.value];
      const stockRam: StockRamData = {
        mPortfolio: newItems[index].mPortfolio,
        mInvest: newItems[index].mInvest,
        mChange: newItems[index].mChange,
        mBuyValue: newItems[index].mBuyValue,
        mEuroChange: newItems[index].mEuroChange,
        mMin: newItems[index].mMin,
        mValue: newItems[index].mValue,
        mMax: newItems[index].mMax,
        mDividendYielda: newItems[index].mDividendYielda,
        mDividendYeara: newItems[index].mDividendYeara,
        mDividendYieldb: newItems[index].mDividendYieldb,
        mDividendYearb: newItems[index].mDividendYearb,
        mRealDividend: newItems[index].mRealDividend,
        mRealBuyValue: newItems[index].mRealBuyValue,
        mDeleteable: newItems[index].mDeleteable
      };
      newItems[index] = { ...stockDb, ...stockRam };
      items.value = newItems;
    }
  }

  /** Removes a stock by ID. */
  function remove(ident: number): void {
    UtilsService.log("RECORDS_STOCKS: remove", ident, "info");
    items.value = items.value.filter((entry) => entry.cID !== ident);
  }

  /** Clears all stock records. */
  function clean(): void {
    UtilsService.log("RECORDS_STOCKS: clean");
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
   * Loads and enriches stock market data for a specific page.
   *
   * @param page - Page index to load
   */
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
    UtilsService.log("RECORDS: loadOnlineData");
    const { getStorage } = useStorage();

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

      const meetingTime = UtilsService.utcDate(stock.cMeetingDay).getTime();
      const quarterTime = UtilsService.utcDate(stock.cQuarterDay).getTime();
      const askTime = UtilsService.utcDate(stock.cAskDates).getTime();

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

      const stockToUpdate = getById.value(stock.id);
      if (!stockToUpdate) return;

      const divisor = data.cur === "USD" ? curUsd.value : curEur.value;
      stockToUpdate.mMin = UtilsService.toNumber(data.min) / divisor;
      stockToUpdate.mValue = UtilsService.toNumber(data.rate) / divisor;
      stockToUpdate.mMax = UtilsService.toNumber(data.max) / divisor;
      stockToUpdate.mEuroChange =
        stockToUpdate.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);

      const dateData = dateResponse.find((d) => d.key === stock.id);
      if (dateData) {
        stockToUpdate.cMeetingDay =
          dateData.value.gm > 0
            ? UtilsService.isoDate(dateData.value.gm)
            : DATE.ISO;
        stockToUpdate.cQuarterDay =
          dateData.value.qf > 0
            ? UtilsService.isoDate(dateData.value.qf)
            : DATE.ISO;
        stockToUpdate.cAskDates = UtilsService.isoDate(
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

UtilsService.log("--- stores/stocks.ts ---");
