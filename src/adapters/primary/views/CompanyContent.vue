<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview CompanyContent component displays a data table of stock holdings
 * with real-time market data, portfolio information, and interactive menu actions.
 */
import {computed, onBeforeMount, onBeforeUnmount, watch} from "vue";
import {useI18n} from "vue-i18n";

import {
  CACHE_POLICY,
  createCompanyHeaders,
  createCompanyMenuItems,
  DATE,
  ITEMS_PER_PAGE_OPTIONS
} from "@/domain/constants";
import {log, winLossClass} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import DotMenu from "@/adapters/primary/components/DotMenu.vue";
import {useOnlineStockData} from "@/adapters/primary/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {d, n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const setStocksPerPage = (value: number) => settings.setStocksPerPage(value);
const runtime = useRuntimeStore();
const {alertAdapter} = useAdapters();
const {loadOnlineData} = useOnlineStockData();

const activeStockItems = computed(() => records.portfolio.active);
const stocksPerPage = computed(() => settings.stocksPerPage);

const MINIMUM_PORTFOLIO_THRESHOLD = 0.1;

const HEADERS = computed(() => createCompanyHeaders(t));
const MENU_ITEMS = computed(() => createCompanyMenuItems(t));

let onlineLoadController: AbortController | null = null;
const startOnlineLoad = (): AbortSignal => {
  if (onlineLoadController) onlineLoadController.abort();
  onlineLoadController = new AbortController();
  return onlineLoadController.signal;
};
const isAbortError = (err: unknown): boolean => {
  return (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: unknown }).name === "AbortError"
  );
};

/**
 * Validates whether a date string represents a valid date after the epoch.
 *
 * @param {string} dateString - ISO date string to validate
 * @returns {boolean} True if the date is valid and after epoch time (0)
 *
 * @example
 * isValidDate('2024-01-15') // returns true
 * isValidDate('1970-01-01') // returns false (epoch time)
 */
const isValidDate = (dateString: string): boolean => {
  return new Date(dateString).getTime() > DATE.ZERO_TIME;
};

/**
 * Checks if a stock has a meaningful portfolio holding (>= 1 share).
 *
 * @param {number | undefined} portfolio - Number of shares held
 * @returns {boolean} True if portfolio contains at least 0.1 share
 */
const hasPortfolio = (portfolio: number | undefined): boolean => {
  return (portfolio ?? 0) >= MINIMUM_PORTFOLIO_THRESHOLD;
};

/**
 * Calculates the percentage change between investment and current value.
 * Returns 1 (100%) if the investment is zero to avoid division by zero.
 *
 * @param {number | undefined} euroChange - Absolute change in euros
 * @param {number | undefined} invest - Original investment amount
 * @returns {number} Percentage change as decimal (0.15 = 15%)
 */
const calculatePercentChange = (
    euroChange: number | undefined,
    invest: number | undefined
): number => {
  if (!invest || invest === 0) return 0;
  return (euroChange ?? 0) / invest;
};

/**
 * Loads online market data for all required pages starting from a given page.
 * Continues loading consecutive pages as long as stocks have portfolio holdings >= 0.1.
 * Uses parallel requests for optimal performance.
 *
 * @async
 * @param {number} [startPage=1] - First page index to load (1-based)
 * @returns {Promise<void>}
 */
const loadRequiredPages = async (startPage: number = 1): Promise<void> => {
  const signal = startOnlineLoad();
  const pagesToLoad: number[] = [];
  const totalPages = Math.ceil(
      activeStockItems.value.length / stocksPerPage.value
  );

  for (let page = startPage; page <= totalPages; page++) {
    const pageFirstIndex = stocksPerPage.value * (page - 1);
    const stock = activeStockItems.value[pageFirstIndex];

    if (!stock || !hasPortfolio(stock.mPortfolio)) break;

    pagesToLoad.push(page);
  }

  try {
    await Promise.all(
        pagesToLoad.map((page) => loadOnlineData(page, {signal}))
    );
  } catch (err) {
    if (isAbortError(err)) return;
    await alertAdapter.feedbackError("COMPANY_CONTENT", err, {
      data: "loadRequiredPages"
    });
  }
};

/**
 * Event handler for page navigation in the data table.
 * Loads online market data for the new page if not already cached.
 * Manages loading state to prevent duplicate requests.
 *
 * @async
 * @param {number} page - Target page number (1-based index)
 * @returns {Promise<void>}
 */
const onUpdatePage = async (page: number): Promise<void> => {
  log("VIEWS CompanyContent: onUpdatePage", page, "info");
  runtime.stocksPage = page;

  if (runtime.isStocksPageFresh(page, CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS)) return;

  runtime.isStockLoading = true;
  const signal = startOnlineLoad();
  try {
    await loadOnlineData(page, {signal});
  } catch (err) {
    if (isAbortError(err)) return;
    await alertAdapter.feedbackError("COMPANY_CONTENT", err, {
      data: "onUpdatePage"
    });
  } finally {
    runtime.isStockLoading = false;
  }
};

/**
 * Component initialization hook.
 * Loads online market data for the current page and all further pages
 * with portfolio holdings if not already loaded. Manages global loading states.
 *
 * @async
 * @returns {Promise<void>}
 */
onBeforeMount(async () => {
  log("VIEWS CompanyContent: onBeforeMount");

  if (!runtime.isStocksPageFresh(runtime.stocksPage, CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS)) {
    runtime.isDownloading = true;
    runtime.isStockLoading = true;
    try {
      await loadRequiredPages(runtime.stocksPage);
    } finally {
      runtime.isStockLoading = false;
      runtime.isDownloading = false;
    }
  }
});

/**
 * Watcher for stocksPerPage.
 * Reloads online market data when the number of items per page changes,
 * as this affects page boundaries and which stocks need loading.
 */
watch(stocksPerPage, async () => {
  runtime.clearStocksPages();
  runtime.isDownloading = true;
  runtime.isStockLoading = true;
  try {
    await loadRequiredPages(runtime.stocksPage);
  } finally {
    runtime.isStockLoading = false;
    runtime.isDownloading = false;
  }
});

onBeforeUnmount(() => {
  if (onlineLoadController) onlineLoadController.abort();
});

log("VIEWS CompanyContent: setup");
</script>

<template>
  <v-data-table
      :headers="HEADERS"
      :hide-no-data="false"
      :hover="true"
      :items="activeStockItems"
      :items-per-page="stocksPerPage"
      :items-per-page-options="ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('views.companyContent.stocksTable.itemsPerPageText')"
      :loading="runtime.isStockLoading"
      :no-data-text="t('views.companyContent.stocksTable.noDataText')"
      density="compact"
      item-key="cID"
      @update:items-per-page="setStocksPerPage"
      @update:page="onUpdatePage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu :items="MENU_ITEMS" :record-id="item.cID as number"/>
        </td>
        <td>{{ item.cCompany }}</td>
        <td>{{ item.cISIN }}</td>
        <td>
          <template v-if="isValidDate(item.cQuarterDay)">
            {{ d(new Date(item.cQuarterDay), "short") }}
          </template>
        </td>
        <td>
          <template v-if="isValidDate(item.cMeetingDay)">
            {{ d(new Date(item.cMeetingDay), "short") }}
          </template>
        </td>
        <td>
          <template v-if="hasPortfolio(item.mPortfolio)">
            {{ item.mPortfolio }}
          </template>
        </td>
        <td>
          <v-tooltip
              v-if="hasPortfolio(item.mPortfolio)"
              :text="n(calculatePercentChange(item.mEuroChange, item.mInvest), 'percent')"
              location="left">
            <template #activator="{ props }">
               <span
                   :class="winLossClass(item.mEuroChange ?? 0)"
                   v-bind="props">
                {{ n(item.mEuroChange ?? 0, "currency") }}
              </span>
            </template>
          </v-tooltip>
        </td>
        <td>{{ n(item.mMin ?? 0, "currency") }}</td>
        <td class="font-weight-bold color-black">
          {{ n(item.mValue ?? 0, "currency3") }}
        </td>
        <td>{{ n(item.mMax ?? 0, "currency") }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
