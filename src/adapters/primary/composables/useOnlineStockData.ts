/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CURRENCIES, DATE} from "@/domain/constants";
import type {NumberStringPair, OnlineStorageData} from "@/domain/types";
import {isoDate, log, toNumber, utcDate} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import {usePortfolioStore} from "@/adapters/primary/stores/portfolio";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import {useStocksStore} from "@/adapters/primary/stores/stocks";

const ASK_DATE_INTERVAL = 7;
const MILLISECONDS_PER_DAY = 86400000;

/**
 * Composable that handles online market-data loading for the portfolio view.
 *
 * Owns all side effects that were previously inside the portfolio store:
 * - Fetching min/rate/max and date data per page
 * - Writing fetched values back to the stocks store
 * - Cache invalidation when provider settings change
 *
 * Callers supply AbortSignal support for cancellation on unmount/navigation.
 */
export function useOnlineStockData() {
    const {fetchService, storageAdapter, browserService, alertService} = useServices();
    const portfolio = usePortfolioStore();
    const stocks = useStocksStore();
    const runtime = useRuntimeStore();
    const settings = useSettingsStore();

    async function loadOnlineData(page: number, options?: {signal?: AbortSignal}): Promise<void> {
        log("COMPOSABLES useOnlineStockData: loadOnlineData");
        const {getStorage} = storageAdapter();

        const isin: OnlineStorageData[] = [];
        const isinDates: NumberStringPair[] = [];

        if (portfolio.active.length === 0) return;

        const startIndex = (page - 1) * settings.stocksPerPage;
        const pageStocks = portfolio.active.slice(startIndex, startIndex + settings.stocksPerPage);
        const now = Date.now();

        for (const stock of pageStocks) {
            const id = stock.cID as number;
            isin.push({id, isin: stock.cISIN, min: "0", rate: "0", max: "0", cur: ""});

            const meetingTime = utcDate(stock.cMeetingDay).getTime();
            const quarterTime = utcDate(stock.cQuarterDay).getTime();
            const askTime = utcDate(stock.cAskDates).getTime();

            if ((meetingTime < now || quarterTime < now) && askTime < now) {
                isinDates.push({key: id, value: stock.cISIN});
            }
        }

        const [minRateMaxResponse, dateResponse] = await Promise.all([
            fetchService.fetchMinRateMaxData(isin, getStorage, {signal: options?.signal}),
            fetchService.fetchDateData(isinDates, {signal: options?.signal})
        ]);

        if (minRateMaxResponse.failedIsins.length > 0) {
            const companies = pageStocks
                .filter((s) => minRateMaxResponse.failedIsins.includes(s.cISIN))
                .map((s) => s.cCompany);
            const names = companies.length > 0
                ? companies.join(", ")
                : minRateMaxResponse.failedIsins.join(", ");
            await alertService.feedbackInfo("network", `failed to receive data: ${names}`, {duration: null});
        }

        pageStocks.forEach((stock, i) => {
            const data = minRateMaxResponse.data[i];
            if (!data) return;

            const stockToUpdate = stocks.getById(stock.cID as number);
            if (!stockToUpdate) return;

            const locale = browserService.getUserLocale();
            let region: string | undefined;
            try {
                region = new Intl.Locale(locale).region?.toLowerCase();
            } catch {
                region = undefined;
            }
            const uiCur = region ? CURRENCIES.CODE.get(region) : undefined;

            // When the provider couldn't detect a currency, fall back to inferring
            // USD for US-domiciled securities (ISIN prefix "US").
            const stockCur = data.cur || (stock.cISIN.startsWith("US") ? CURRENCIES.USD : "");

            const divisor =
                !stockCur || stockCur === uiCur
                    ? 1
                    : stockCur === "USD"
                        ? runtime.curUsd
                        : stockCur === "EUR"
                            ? runtime.curEur
                            : 1;

            stockToUpdate.mMin = toNumber(data.min) / divisor;
            stockToUpdate.mValue = toNumber(data.rate) / divisor;
            stockToUpdate.mMax = toNumber(data.max) / divisor;
            stockToUpdate.mEuroChange =
                stockToUpdate.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);

            const dateData = dateResponse.find((d) => d.key === stock.cID);
            if (dateData) {
                stockToUpdate.cMeetingDay =
                    dateData.value.gm > 0 ? isoDate(dateData.value.gm) : DATE.ISO;
                stockToUpdate.cQuarterDay =
                    dateData.value.qf > 0 ? isoDate(dateData.value.qf) : DATE.ISO;
                stockToUpdate.cAskDates = isoDate(now + ASK_DATE_INTERVAL * MILLISECONDS_PER_DAY);
            }
        });

        runtime.markStocksPageLoaded(page);
    }

    async function refreshOnlineData(page: number): Promise<void> {
        runtime.invalidateStocksPage(page);
        await loadOnlineData(page);
    }

    async function refreshAllOnlineData(): Promise<void> {
        const totalPages = Math.ceil(portfolio.active.length / settings.stocksPerPage);
        runtime.clearStocksPages();
        for (let page = 1; page <= totalPages; page++) {
            const firstStock = portfolio.active[(page - 1) * settings.stocksPerPage];
            if (!firstStock || !((firstStock.mPortfolio ?? 0) > 0)) break;
            await loadOnlineData(page);
        }
    }

    return {loadOnlineData, refreshOnlineData, refreshAllOnlineData};
}
