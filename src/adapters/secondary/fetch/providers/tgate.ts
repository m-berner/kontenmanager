/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {NumberStringPair, StockMarketData} from "@/domain/types";

import {fetchWithCache, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {calculateMidQuote, DEFAULT_CURRENCY, DEFAULT_VALUE} from "@/adapters/secondary/fetch/providerUtils";

export async function tgateFetcher(
    urls: NumberStringPair[],
    options?: { signal?: AbortSignal }
): Promise<StockMarketData[]> {
    return Promise.all(
        urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
            const html = await fetchWithCache(
                urlObj.value,
                CACHE_POLICY.QUOTE_TTL_MS,
                {signal: options?.signal}
            );
            const doc = await parseHTML(html);
            const {rate} = extractTgateStockData(doc);

            if (rate === DEFAULT_VALUE) {
                throw new Error(`tgate: failed to parse rate for ${urlObj.value}`);
            }

            return {
                id: urlObj.key,
                isin: "",
                rate,
                min: DEFAULT_VALUE,
                max: DEFAULT_VALUE,
                cur: DEFAULT_CURRENCY
            };
        })
    );
}

function extractTgateStockData(doc: Document): { rate: string } {
    const ASK_SELECTOR = "#ask";
    const BID_SELECTOR = "#bid";

    const ask =
        doc.querySelector(ASK_SELECTOR)?.textContent?.trim() ??
        DEFAULT_VALUE;
    const bid =
        doc.querySelector(BID_SELECTOR)?.textContent?.trim() ??
        DEFAULT_VALUE;

    const rate = calculateMidQuote(bid, ask);

    return {rate};
}
