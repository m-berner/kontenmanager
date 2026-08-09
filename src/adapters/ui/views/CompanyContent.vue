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
import {computed, onBeforeMount, onBeforeUnmount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {
  CACHE_POLICY,
  createCompanyHeaders,
  createCompanyMenuItems,
  DATE,
  ITEMS_PER_PAGE_OPTIONS,
  PORTFOLIO
} from "@/domain/constants";
import type {StockItem} from "@/domain/types";
import {log, winLossClass} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import DotMenu from "@/adapters/ui/components/DotMenu.vue";
import {useOnlineStockData} from "@/adapters/ui/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {d, n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const setStocksPerPage = (value: number) => settings.setStocksPerPage(value);
const runtime = useRuntimeStore();
const {alertAdapter} = useAdapters();
const {loadOnlineData, refreshOnlineData} = useOnlineStockData();

const activeStockItems = computed(() => records.portfolio.active);
const stocksPerPage = computed(() => settings.stocksPerPage);

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
 * Checks if a stock has a meaningful portfolio holding, i.e. at least
 * PORTFOLIO.MINIMUM_THRESHOLD (0.1) shares.
 *
 * The threshold is not a round-number cutoff for small positions: anything below
 * it is floating-point residue left by a BUY/SELL pair that canceled out, so the
 * position counts as sold out. calculateTotalDepotValue and
 * calculatePortfolioByStockId apply the same constant, which is what keeps a
 * sold-out stock out of the depot total and out of the quote fetches here.
 *
 * @param {number | undefined} portfolio - Number of shares held; undefined counts as 0
 * @returns {boolean} True if the holding is at or above the threshold
 */
const hasPortfolio = (portfolio: number | undefined): boolean => {
  return (portfolio ?? 0) >= PORTFOLIO.MINIMUM_THRESHOLD;
};

/**
 * Whether a fetched quote figure is a real reading rather than the providers'
 * "not reported" placeholder. min/max fall back to DEFAULT_VALUE ("0") whenever
 * a provider supplies no 52-week range — tgate never does — and a traded
 * instrument never legitimately has a price of exactly 0.
 */
const hasQuote = (value: number | undefined): boolean => {
  return value !== undefined && value > 0;
};

/**
 * Calculates the percentage change between investment and current value.
 *
 * Returns 0 (0%) when the investment is zero, avoiding a division by zero. The
 * doc used to promise 1 (rendered "100%" by the `percent` formatter) while the
 * code returned 0 — a comment misstating behaviour by 100 percentage points.
 * The code is the correct half: a position with no investment has not gained
 * 100%.
 *
 * Worth having corrected rather than ignored because this file's comments are
 * unusually load-bearing — the mValue-cell block and the phantom-zero block both
 * encode reasoning a future edit is meant to obey, and one comment that cannot
 * be trusted undermines the rest. (The mValue block earned that description: it
 * said to drop `color-black` in whatever change made the tables theme-aware, and
 * that is exactly what happened.)
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
 * Loads online market data for every page from `startPage` to the last one that
 * holds stock.
 *
 * Each page in that range is examined independently and one without any holding
 * >= PORTFOLIO.MINIMUM_THRESHOLD (0.1) is skipped, not treated as a stop signal:
 * `cFirstPage`-pinned stocks with no holdings sort ahead of unpinned ones that
 * have them, so an empty page can sit between two that need quotes. The pages
 * that survive the filter are then fetched in parallel.
 *
 * Positional slicing of `activeStockItems` only identifies the right rows while
 * the table is in its default order, which is why this runs from onBeforeMount
 * (pre-sort) and `onCurrentItems` owns every later refetch.
 *
 * @async
 * @param {number} [startPage=1] - First page index to examine (1-based)
 * @param {AbortSignal} signal - Cancels the in-flight fetches; the caller owns
 *   the controller and rejects with an AbortError the caller filters out
 * @returns {Promise<void>}
 */
const loadRequiredPages = async (startPage: number = 1, signal: AbortSignal): Promise<void> => {
  const pagesToLoad: number[] = [];
  const totalPages = Math.ceil(
      activeStockItems.value.length / stocksPerPage.value
  );

  for (let page = startPage; page <= totalPages; page++) {
    const pageFirstIndex = stocksPerPage.value * (page - 1);
    // activeStockItems is sorted by cFirstPage first, then by mPortfolio within
    // that group, so a page can straddle the boundary between a "pinned, no
    // holdings" tail and a "not pinned, has holdings" head. Checking only the
    // page's first item would then wrongly skip real holdings later on the page.
    const pageItems = activeStockItems.value.slice(pageFirstIndex, pageFirstIndex + stocksPerPage.value);

    if (pageItems.length === 0 || !pageItems.some((stock) => hasPortfolio(stock.mPortfolio))) continue;

    pagesToLoad.push(page);
  }

  await Promise.all(
      pagesToLoad.map((page) => loadOnlineData(page, {signal}))
  );
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
const onUpdatePage = (page: number): void => {
  log("VIEWS CompanyContent: onUpdatePage", page, "info");
  // Page-number bookkeeping only. The fetch is driven by onCurrentItems below,
  // because the page number alone no longer identifies WHICH stocks are on
  // screen once the user has sorted the table.
  //
  // Paired with the `:page="runtime.stocksPage"` binding in the template, which
  // is what makes this value meaningful. Without it the table resets to page 1 on
  // every mount while this store value still held the last-visited page. So
  // onBeforeMount below checked the freshness of — and loaded — pages the user
  // was not looking at, leaving the displayed page with no quotes at all.
  runtime.stocksPage = page;
};

/**
 * Ids of the rows the table is actually rendering right now.
 *
 * Tracked because `cCompany` and `mPortfolio` are sortable (createCompanyHeaders),
 * so Vuetify paginates its own sorted view and a positional slice of
 * `portfolio.active` stops matching what the user sees the moment they sort.
 */
const renderedStockIds = ref<number[]>([]);

/**
 * Whether `onCurrentItems` has already seen an emit.
 *
 * Says what "is this the first render?" means, instead of inferring it from
 * `renderedStockIds` having been empty — which is also true after any emit that
 * rendered zero rows. See the note in `onCurrentItems`.
 */
const hasLoadedOnce = ref(false);

const sameIds = (a: number[], b: number[]): boolean =>
    a.length === b.length && a.every((id, i) => b[i] === id);

/**
 * Extracts stock ids from whatever `update:current-items` hands over.
 *
 * Vuetify does **not** emit the items that were passed in. `usePaginatedItems`
 * emits a slice of its internal `DataTableItem` wrappers —
 * `{type, key, index, value, selectable, columns, raw}` — and the original row
 * lives on `.raw`; VDataTable itself does `.map(item => item.raw)` wherever it
 * exposes rows to slots. Reading `item.cID` off the wrapper therefore yielded
 * `undefined` for every row, and that failed *quietly* in the worst possible
 * way: `[undefined × 10]` compares equal to the previous `[undefined × 10]`, so
 * `sameIds` reported "same rows" on every page change and `onCurrentItems`
 * returned without fetching anything. Only `onBeforeMount`'s sweep loaded
 * quotes, and that one skips pages with no holdings — which, because
 * `portfolio.active` sorts holdings first, is exactly the later pages. The
 * visible symptom was quotes on the first pages and permanently blank price
 * columns on the rest.
 *
 * `key` and `value` used to be no substitute either: both derive from the
 * `item-value` prop, and this table set `item-key="cID"` — a **Vuetify 2** prop
 * that Vuetify 3 ignores entirely — so `item-value` was never set and they were
 * `undefined` too. That is now fixed at the source (`item-value="cID"`), which
 * also gives Vue a stable row key for list diffing instead of the positional
 * fallback.
 *
 * The `.raw ?? row` unwrapping below is deliberately KEPT. It is now
 * belt-and-braces rather than load-bearing, and it costs one `??`: the handler
 * is typed `unknown[]` because Vuetify's emitted shape is a version detail, and
 * reading `cID` off whichever shape arrives is what makes this correct under
 * both. Non-numeric ids are dropped rather than passed on as `undefined`, so a
 * future shape change fetches fewer rows instead of silently fetching none.
 */
const toStockIds = (items: unknown[]): number[] => {
  return items
      .map((row) => ((row as { raw?: unknown })?.raw ?? row) as StockItem | undefined)
      .map((item) => item?.cID)
      .filter((id): id is number => typeof id === "number");
};

/**
 * Fires whenever the rendered row set changes — a page navigation, a re-sort, or
 * an items-per-page change. Comparing IDS rather than array identity is what
 * keeps this from looping: writing a fetched quote mutates a stock, which
 * recomputes `portfolio.active` and re-emits this event with a new array but the
 * same ids, so no second fetch is triggered.
 */
const onCurrentItems = async (items: unknown[]): Promise<void> => {
  const next = toStockIds(items);
  if (sameIds(next, renderedStockIds.value)) return;

  renderedStockIds.value = next;

  // onBeforeMount already loads the initial view (and every later page holding
  // stock), so the first emit must not double-fetch it.
  //
  // Gated on a dedicated `hasLoadedOnce` flag, NOT on
  // `renderedStockIds.value.length === 0`. That test derived "is this the first
  // emit" from the *previous* row set being empty, which is true in two
  // different situations — and only one of them is the first emit. The other:
  // the table renders zero rows, so `renderedStockIds` is assigned `[]` and the
  // handler returns; the next emit brings real rows, `sameIds` is false so it
  // proceeds, and the flag recomputes as `true`, returning without fetching.
  // Those rows never got quotes from this path.
  //
  // The live trigger is an account whose stocks are ALL faded out —
  // `portfolio.active` filters `cFadeOut === 0`, so `active` is `[]` — and the
  // user un-fades one. Neither `FadeInStock` nor `UpdateStock` calls
  // `refreshOnlineData` (`AddStock` is the only dialog that does), and
  // `updateStockUsecase`'s `clearStocksPages()` invalidates the freshness
  // marker without triggering a fetch, so nothing else covered it: that stock
  // showed no quote until the user changed page or refreshed manually.
  const isFirstEmit = !hasLoadedOnce.value;
  hasLoadedOnce.value = true;
  if (isFirstEmit || next.length === 0) return;

  // The freshness marker is keyed by page number, but after a sort the same page
  // number holds a different set of stocks — so it cannot be trusted here.
  // refreshOnlineData invalidates it before loading.
  //
  // Both flag pairs, matching `onBeforeMount` below. This path used to raise
  // only `isStockLoading`, so the two routes into the same fetch reported
  // themselves differently: `TitleBar` gates its depot chip on
  // `!runtime.isDownloading`, and the chip therefore vanished during the initial
  // sweep but stayed up — showing a total mid-recalculation — during every page
  // change and re-sort.
  runtime.beginDownload();
  runtime.beginStockLoading();
  const signal = startOnlineLoad();
  try {
    await refreshOnlineData(runtime.stocksPage, {signal, stockIds: next});
  } catch (err) {
    if (!isAbortError(err)) {
      await alertAdapter.feedbackError("COMPANY_CONTENT", err, {
        data: "onCurrentItems"
      });
    }
  } finally {
    runtime.endStockLoading();
    runtime.endDownload();
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
    runtime.beginDownload();
    runtime.beginStockLoading();
    const signal = startOnlineLoad();
    try {
      await loadRequiredPages(runtime.stocksPage, signal);
    } catch (err) {
      if (!isAbortError(err)) {
        await alertAdapter.feedbackError("COMPANY_CONTENT", err, {data: "loadRequiredPages"});
      }
    } finally {
      runtime.endStockLoading();
      runtime.endDownload();
    }
  }
});

// The `stocksPerPage` watcher that used to sit here has been removed: `AppIndex`
// already watches the same value and calls the same `runtime.clearStocksPages()`,
// and it is the app shell, so its watcher is alive for the whole session rather
// than only while this route is mounted. Two watchers on one value, both doing
// the identical idempotent thing, with only this one carrying the reasoning —
// the reasoning has moved to `AppIndex` alongside the other three invalidation
// triggers. The half worth keeping visible at this end is why this component
// does NOT refetch on a page-size change: the row set changes as a direct
// result, so `onCurrentItems` fires and fetches exactly what is now on screen.
// It used to call `loadRequiredPages` too, and the two raced — the watcher
// created an AbortController, then `onCurrentItems` ran `startOnlineLoad()` one
// tick later and aborted it mid-flight, so the sweep was cancelled every time.
// One owner for "the visible rows changed" is enough.

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
      :page="runtime.stocksPage"
      density="compact"
      item-value="cID"
      @update:current-items="onCurrentItems"
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
              :text="n(calculatePercentChange(item.mChange, item.mInvest), 'percent')"
              location="left">
            <template #activator="{ props }">
               <span
                   :class="winLossClass(item.mChange ?? 0)"
                   v-bind="props">
                {{ n(item.mChange ?? 0, "currency") }}
              </span>
            </template>
          </v-tooltip>
        </td>
        <!--
          A 52-week low/high of exactly 0 means "not reported", not a real
          price: tgate never supplies a range at all and fnet/goyax/wstreet fall
          back to DEFAULT_VALUE ("0") when they cannot parse one. Rendering that
          as "0,00 €" presented a missing value as a real one — the same
          phantom-zero class round 31 fixed for commodity prices by skipping the
          row rather than reporting 0. Show an empty cell instead.
        -->
        <td>
          <template v-if="hasQuote(item.mMin)">
            {{ n(item.mMin as number, "currency") }}
          </template>
        </td>
        <!--
          Emphasis from `font-weight-bold` alone; the colour is inherited.

          This cell used to also carry `color-black`, a literal `color: black`,
          to override the `color: darkgray` the row inherited from style.css's
          `tbody tr:nth-of-type(odd/even)` rules. That was safe only because
          those rules ALSO hardcoded the row background to light gray in every
          theme, beating Vuetify's
          `.v-table { background: rgb(var(--v-theme-surface)) }` — a borrowed
          safety, and its own comment said to drop this class in whatever change
          made the table theme-aware. That change has happened: the striping is
          now a translucent overlay over the theme surface, so black here would
          be back to ~1.2:1 on `dark`, which is the exact bug that got it removed
          from this cell once before.

          Inheriting Vuetify's on-surface colour is what winLossClass's
          non-negative branch already settled on, for the same reason.

          Guarded by hasQuote() for the same reason min/max already are: a stock
          whose quote has not been fetched yet still has mValue === 0, and
          rendering that unconditionally showed a real-looking "0,000 €" current
          price. A traded instrument is never worth exactly 0, so an empty cell
          is the honest representation of "not fetched".
        -->
        <td class="color-orange font-weight-bold">
          <template v-if="hasQuote(item.mValue)">
            {{ n(item.mValue as number, "currency3") }}
          </template>
        </td>
        <td>
          <template v-if="hasQuote(item.mMax)">
            {{ n(item.mMax as number, "currency") }}
          </template>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>
