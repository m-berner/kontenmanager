/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { StorageDataType, StorageValueType } from "@/types";
import type { Ref } from "vue";
import { ref } from "vue";
import { DomainUtils } from "@/domains/utils";
import { defineStore } from "pinia";
import { useStorage } from "@/composables/useStorage";
import { BROWSER_STORAGE } from "@/config/storage";

/**
 * Pinia store for user-specific application settings and preferences.
 *
 * This store manages UI themes, pagination limits, active account selection,
 * and persistent filter configurations. All state mutations are automatically
 * synchronized with the browser's persistent storage.
 *
 * @module stores/settings
 * @returns Reactive settings state, computed aggregations,
 * and methods to mutate and enrich settings data.
 */
export const useSettingsStore = defineStore("settings", function () {
  const { setStorage } = useStorage();

  /** Currently active UI skin or theme name. */
  const skin = ref<string>(BROWSER_STORAGE.SKIN.value);

  /** Number of booking records displayed per table page. */
  const bookingsPerPage = ref<number>(BROWSER_STORAGE.BOOKINGS_PER_PAGE.value);

  /** Number of stock records displayed per table page. */
  const stocksPerPage = ref<number>(BROWSER_STORAGE.STOCKS_PER_PAGE.value);

  /** Number of dividend records displayed per table page. */
  const dividendsPerPage = ref<number>(
    BROWSER_STORAGE.DIVIDENDS_PER_PAGE.value
  );

  /** Number of summary/total records displayed per table page. */
  const sumsPerPage = ref<number>(BROWSER_STORAGE.SUMS_PER_PAGE.value);

  /**
   * Identifier of the currently selected bank account.
   * A value of -1 indicates no account is selected.
   */
  const activeAccountId = ref<number>(-1);

  /** Key of the external financial service used for data fetching. */
  const service = ref<string>(BROWSER_STORAGE.SERVICE.value);

  /** List of enabled/visible material categories. */
  const materials = ref<string[]>(BROWSER_STORAGE.MATERIALS.value);

  /** List of enabled/visible stock market identifiers. */
  const markets = ref<string[]>(BROWSER_STORAGE.MARKETS.value);

  /** List of enabled/visible financial indexes. */
  const indexes = ref<string[]>(BROWSER_STORAGE.INDEXES.value);

  /** List of enabled/visible stock exchange identifiers. */
  const exchanges = ref<string[]>(BROWSER_STORAGE.EXCHANGES.value);

  /**
   * Internal helper to update a state property and its corresponding browser storage entry.
   *
   * @param {Ref<StorageValueType>} stateRef - The reactive reference to update.
   * @param {string} storageKey - The key used in browser storage.
   * @param {StorageValueType} newValue - The new value to apply.
   */
  async function updateSetting(
    stateRef: Ref<StorageValueType>,
    storageKey: string,
    newValue: StorageValueType
  ): Promise<void> {
    stateRef.value = newValue;
    await setStorage(storageKey, newValue);
  }

  /**
   * Initializes the store with values retrieved from browser storage.
   *
   * @param {StorageDataType} storage - Object containing all persisted settings.
   */
  function init(storage: StorageDataType): void {
    DomainUtils.log("SETTINGS: init");

    skin.value = storage[BROWSER_STORAGE.SKIN.key] as string;
    bookingsPerPage.value = storage[
      BROWSER_STORAGE.BOOKINGS_PER_PAGE.key
    ] as number;
    stocksPerPage.value = storage[
      BROWSER_STORAGE.STOCKS_PER_PAGE.key
    ] as number;
    dividendsPerPage.value = storage[
      BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key
    ] as number;
    sumsPerPage.value = storage[BROWSER_STORAGE.SUMS_PER_PAGE.key] as number;
    activeAccountId.value = storage[
      BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key
    ] as number;
    service.value = storage[BROWSER_STORAGE.SERVICE.key] as string;

    materials.value = [...(storage[BROWSER_STORAGE.MATERIALS.key] as string[])];
    markets.value = [...(storage[BROWSER_STORAGE.MARKETS.key] as string[])];
    indexes.value = [...(storage[BROWSER_STORAGE.INDEXES.key] as string[])];
    exchanges.value = [...(storage[BROWSER_STORAGE.EXCHANGES.key] as string[])];
  }

  /**
   * Updates the page limit for summary tables.
   * @param {number} v - New items per page limit.
   */
  async function setSumsPerPage(v: number): Promise<void> {
    await updateSetting(sumsPerPage, BROWSER_STORAGE.SUMS_PER_PAGE.key, v);
  }

  /**
   * Updates the page limit for booking tables.
   * @param {number} v - New items per page limit.
   */
  async function setBookingsPerPage(v: number): Promise<void> {
    await updateSetting(
      bookingsPerPage,
      BROWSER_STORAGE.BOOKINGS_PER_PAGE.key,
      v
    );
  }

  /**
   * Updates the page limit for stock tables.
   * @param {number} v - New items per page limit.
   */
  async function setStocksPerPage(v: number): Promise<void> {
    await updateSetting(stocksPerPage, BROWSER_STORAGE.STOCKS_PER_PAGE.key, v);
  }

  /**
   * Updates the page limit for dividend tables.
   * @param {number} v - New items per page limit.
   */
  async function setDividendsPerPage(v: number): Promise<void> {
    await updateSetting(
      dividendsPerPage,
      BROWSER_STORAGE.DIVIDENDS_PER_PAGE.key,
      v
    );
  }

  /**
   * Switches the currently active account.
   * @param {number} id - The ID of the account to activate.
   */
  async function setActiveAccountId(id: number): Promise<void> {
    await updateSetting(
      activeAccountId,
      BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
      id
    );
  }

  return {
    skin,
    bookingsPerPage,
    stocksPerPage,
    dividendsPerPage,
    sumsPerPage,
    activeAccountId,
    service,
    materials,
    markets,
    indexes,
    exchanges,
    init,
    setSumsPerPage,
    setBookingsPerPage,
    setDividendsPerPage,
    setStocksPerPage,
    setActiveAccountId
  };
});

DomainUtils.log("--- stores/settings.ts ---");
