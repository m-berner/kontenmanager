/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CURRENCIES, DATE} from "@/domain/constants";
import type {NumberStringPair, OnlineStorageData, StockItem} from "@/domain/types";
import {isoDate, isValidISODate, log, toNumber, utcDate} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {usePortfolioStore} from "@/adapters/ui/stores/portfolio";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";
import {useStocksStore} from "@/adapters/ui/stores/stocks";

const ASK_DATE_INTERVAL = 7;
const MILLISECONDS_PER_DAY = 86400000;

/**
 * Composable that handles online market-data loading for the portfolio view.
 *
 * Owns all side effects that were previously inside the portfolio store:
 * - Fetching min/rate/max and date data per page
 * - Writing fetched values back to the stock store
 * - Persisting fetched meeting/quarter dates and the cAskDates re-fetch throttle
 *
 * NOT owned here, despite an earlier version of this comment claiming it:
 * cache invalidation when the provider setting changes. That lives in
 * `AppIndex.vue`, which watches `settings.service` (alongside `activeAccountId`
 * and `stocksPerPage`) and calls `runtime.clearStocksPages()` +
 * `fetchAdapter.clearCache()`. There is no `settings` watcher in this file —
 * pointing at the wrong module is how a future edit either duplicates that
 * watcher here or deletes the real one believing it redundant.
 *
 * Callers supply AbortSignal support for cancellation on unmount/navigation.
 */
/**
 * Reads one of a stock's ISO date columns as a timestamp, treating anything
 * unparseable as the epoch (i.e. "long overdue").
 *
 * `utcDate()` is deliberately strict: it THROWS an AppError for a non-empty,
 * non-ISO string and returns an Invalid Date (NaN) for "". Neither is safe to
 * call raw here, because nothing constrains these three columns to ISO —
 * `validateStock` runs only `normalizeString` on them (so a missing field
 * becomes ""), `validateDataIntegrity` ignores stock dates entirely, and
 * `databaseAdapter.getAccountRecords` returns raw IndexedDB rows without
 * re-validating on read. A backup carrying e.g. "15.03.2024" therefore used to
 * throw on the FIRST stock of the page, aborting the whole page's quote refresh
 * before a single fetch was issued; a missing `cAskDates` produced NaN, and
 * `NaN < now` is false, so that stock's meeting/quarter dates were never
 * re-fetched again — silently and permanently.
 *
 * The epoch fallback matches `DATE.ISO` ("1970-01-01"), which is already this
 * app's "no date known / due for refresh" sentinel, so an unusable value now
 * means "fetch it" rather than "explode" or "never fetch it". The render-side
 * consumers (CompanyContent's isValidDate, HomeContent's isValidISODate) have
 * guarded this for a while; this path had been missed.
 */
function toTimestamp(iso: string): number {
    return isValidISODate(iso) ? utcDate(iso).getTime() : DATE.ZERO_TIME;
}

export function useOnlineStockData() {
    const {fetchAdapter, storageAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
    const portfolio = usePortfolioStore();
    const stocks = useStocksStore();
    const runtime = useRuntimeStore();
    const settings = useSettingsStore();

    /**
     * Resolves which stocks a load call should fetch.
     *
     * `stockIds` (when supplied) wins over the positional slice. The slice
     * assumes the table renders `portfolio.active` in its own order, but
     * `createCompanyHeaders` marks `cCompany` and `mPortfolio` sortable, and
     * Vuetify paginates its OWN sorted view — so after the user sorts, "page 2"
     * on screen and `portfolio.active[9..17]` are different sets of stocks, and
     * the slice fetched quotes for rows nobody was looking at. Callers that know
     * what is actually rendered pass those ids instead; callers that sweep every
     * page (refreshAllOnlineData) keep using the slice, which is correct for
     * them because they cover the whole list either way.
     */
    function resolvePageStocks(page: number, stockIds?: number[]): StockItem[] {
        if (stockIds && stockIds.length > 0) {
            const byId = new Map(portfolio.active.map((s) => [s.cID as number, s]));
            return stockIds
                .map((id) => byId.get(id))
                .filter((s): s is StockItem => s !== undefined);
        }
        const startIndex = (page - 1) * settings.stocksPerPage;
        return portfolio.active.slice(startIndex, startIndex + settings.stocksPerPage);
    }

    async function loadOnlineData(
        page: number,
        options?: { signal?: AbortSignal; stockIds?: number[] }
    ): Promise<void> {
        log("COMPOSABLES useOnlineStockData: loadOnlineData");
        const {getStorage} = storageAdapter();

        const isin: OnlineStorageData[] = [];
        const isinDates: NumberStringPair[] = [];

        if (portfolio.active.length === 0) return;

        // Claim this page for this call before any await: if a newer call for the
        // same page starts (from this or another caller) before this one's fetch
        // resolves, its write-back below is skipped instead of overwriting fresher
        // data that already landed.
        const generation = runtime.bumpStocksPageGeneration(page);

        const pageStocks = resolvePageStocks(page, options?.stockIds);

        // A caller that named rows explicitly, none of which resolve, has a real
        // problem — and staying silent about it is expensive. The rest of this
        // function still runs: it fetches nothing, writes nothing, and then
        // calls markStocksPageLoaded(page), so the freshness marker suppresses
        // the next attempt for a full minute while the page shows no quotes.
        // That is precisely how CompanyContent handing over Vuetify's
        // DataTableItem wrappers (every id `undefined`) stayed invisible.
        // Bail out without marking, so a later attempt is still allowed.
        if (options?.stockIds && options.stockIds.length > 0 && pageStocks.length === 0) {
            log(
                "COMPOSABLES useOnlineStockData: requested stock ids resolved to no stocks",
                {page, stockIds: options.stockIds},
                "warn"
            );
            return;
        }

        const now = Date.now();

        for (const stock of pageStocks) {
            const id = stock.cID as number;
            isin.push({id, isin: stock.cISIN, min: "0", rate: "0", max: "0", cur: ""});

            const meetingTime = toTimestamp(stock.cMeetingDay);
            const quarterTime = toTimestamp(stock.cQuarterDay);
            const askTime = toTimestamp(stock.cAskDates);

            if ((meetingTime < now || quarterTime < now) && askTime < now) {
                isinDates.push({key: id, value: stock.cISIN});
            }
        }

        const [minRateMaxResponse, dateResponse] = await Promise.all([
            fetchAdapter.fetchMinRateMaxData(isin, getStorage, {signal: options?.signal}),
            fetchAdapter.fetchDateData(isinDates, {signal: options?.signal})
        ]);

        if (!runtime.isStocksPageGenerationCurrent(page, generation)) return;

        if (minRateMaxResponse.failedIsins.length > 0) {
            const companies = pageStocks
                .filter((s) => minRateMaxResponse.failedIsins.includes(s.cISIN))
                .map((s) => s.cCompany);
            const names = companies.length > 0
                ? companies.join(", ")
                : minRateMaxResponse.failedIsins.join(", ");
            await alertAdapter.feedbackInfo("network", `failed to receive data: ${names}`, {duration: null});

            // Re-check after this await: a newer call for the same page may have
            // bumped the generation while this one was showing the alert, and its
            // write-back below must not clobber that newer call's fresher data.
            if (!runtime.isStocksPageGenerationCurrent(page, generation)) return;
        }

        const datesToPersist: StockItem[] = [];

        pageStocks.forEach((stock, i) => {
            const stockToUpdate = stocks.getById(stock.cID as number);
            if (!stockToUpdate) return;

            // Price and date data come from two independent fetches; a failed price
            // fetch for this stock must not also discard its already-fetched date data.
            const data = minRateMaxResponse.data[i];
            if (data) {
                const locale = browserAdapter.getUserLocale();
                let region: string | undefined;
                try {
                    region = new Intl.Locale(locale).region?.toLowerCase();
                } catch {
                    region = undefined;
                }
                const uiCur = region ? CURRENCIES.CODE.get(region) : undefined;

                // When the provider couldn't detect a currency, fall back to inferring
                // USD for US-domiciled securities (ISIN prefix "US").
                const stockCur = data.cur || (stock.cISIN?.startsWith("US") ? CURRENCIES.USD : "");

                const rawDivisor =
                    !stockCur || stockCur === uiCur
                        ? 1
                        : stockCur === "USD"
                            ? runtime.curUsd
                            : stockCur === "EUR"
                                ? runtime.curEur
                                : 1;
                const divisor = rawDivisor > 0 ? rawDivisor : 1;

                stockToUpdate.mMin = toNumber(data.min) / divisor;
                stockToUpdate.mValue = toNumber(data.rate) / divisor;
                stockToUpdate.mMax = toNumber(data.max) / divisor;
                // mEuroChange is deliberately NOT written here. It is derived,
                // not fetched: `portfolio.active` — the getter CompanyContent
                // actually renders — recomputes it on every evaluation from
                // mValue, mPortfolio and mInvest, so any value written into the
                // leaf store is overwritten before it is ever read. Worse, the
                // writing used this page slice's *copies* of mPortfolio/mInvest
                // while the getter derives them fresh, so the two formulas could
                // disagree. One source of truth: the getter.
            }

            const dateData = dateResponse.find((d) => d.key === stock.cID);
            if (dateData) {
                stockToUpdate.cMeetingDay =
                    dateData.value.gm > 0 ? isoDate(dateData.value.gm) : DATE.ISO;
                stockToUpdate.cQuarterDay =
                    dateData.value.qf > 0 ? isoDate(dateData.value.qf) : DATE.ISO;
                stockToUpdate.cAskDates = isoDate(now + ASK_DATE_INTERVAL * MILLISECONDS_PER_DAY);
                datesToPersist.push(stockToUpdate);
            }
        });

        // Unlike the m* price fields, cMeetingDay/cQuarterDay/cAskDates are
        // persisted columns. Writing them only into the store left cAskDates —
        // the "don't re-fetch this stock's dates for 7 days" throttle — alive
        // for the session only: after a reload it reverted to its stored value
        // (in the past), so every session re-fetched dates for every stock
        // whose meeting/quarter day had passed, and the freshly fetched dates
        // themselves were lost. repositories.stocks.save() runs validateStock,
        // which rebuilds the record from an explicit cXxx whitelist, so the RAM
        // m* fields are dropped rather than persisted. Failures are logged, not
        // surfaced: the dates are already correct in memory for this session,
        // and a write failure here must not break the price refresh.
        if (datesToPersist.length > 0) {
            const persisted = await Promise.allSettled(
                datesToPersist.map((stock) => repositories.stocks.save(stock))
            );
            for (const result of persisted) {
                if (result.status === "rejected") {
                    log(
                        "COMPOSABLES useOnlineStockData: failed to persist fetched dates",
                        result.reason,
                        "warn"
                    );
                }
            }
        }

        runtime.markStocksPageLoaded(page);
    }

    async function refreshOnlineData(
        page: number,
        options?: { signal?: AbortSignal; stockIds?: number[] }
    ): Promise<void> {
        runtime.invalidateStocksPage(page);
        await loadOnlineData(page, options);
    }

    async function refreshAllOnlineData(options?: { signal?: AbortSignal }): Promise<void> {
        const totalPages = Math.ceil(portfolio.active.length / settings.stocksPerPage);
        runtime.clearStocksPages();
        for (let page = 1; page <= totalPages; page++) {
            if (options?.signal?.aborted) break;
            await loadOnlineData(page, options);
        }
    }

    return {loadOnlineData, refreshOnlineData, refreshAllOnlineData};
}
