/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {NumberStringPair, StockMarketData} from "@/domain/types";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/driven/fetch/httpClient";
import {calculateMidQuote, DEFAULT_CURRENCY, DEFAULT_VALUE} from "@/adapters/driven/fetch/providerUtils";

export async function tgateFetcher(
    urls: NumberStringPair[],
    options?: { signal?: AbortSignal }
): Promise<StockMarketData[]> {
    return Promise.all(
        urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
            const html = await fetchTextWithCacheFollowRedirect(
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
                // EUR is asserted here on purpose, unlike ard/goyax which now
                // detect it: tradegate.de is a German exchange and quotes every
                // instrument in EUR, including US-domiciled ones. Reporting ""
                // (unknown) would be actively wrong — useOnlineStockData would
                // then infer USD from a "US" ISIN prefix and divide an
                // EUR-quoted price by the USD rate.
                cur: DEFAULT_CURRENCY
            };
        })
    );
}

function extractTgateStockData(doc: Document): { rate: string } {
    const ASK_SELECTOR = "#ask";
    const BID_SELECTOR = "#bid";

    // An empty string (element missing entirely, or present but blank) must stay
    // distinguishable from a genuine "0" reading so calculateMidQuote can exclude
    // it instead of averaging a phantom zero into the other, present side.
    const ask = doc.querySelector(ASK_SELECTOR)?.textContent?.trim() ?? "";
    const bid = doc.querySelector(BID_SELECTOR)?.textContent?.trim() ?? "";

    const rate = calculateMidQuote(bid, ask);

    return {rate};
}
