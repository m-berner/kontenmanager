/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {DEFAULT_VALUE, detectCurrency} from "@/adapters/secondary/fetch/providerUtils";

export async function fnetFetcher(
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
            const {rate, min, max, currency} = extractFnetStockData(doc);

            if (rate === DEFAULT_VALUE) {
                throw new Error(`fnet: failed to parse rate for ${urlObj.value}`);
            }

            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(rate, "de"),
                min: normalizeNumber(min, "de"),
                max: normalizeNumber(max, "de"),
                cur: currency
            };
        })
    );
}

/**
 * Extracts the arithmetic mean of German-formatted numbers from a string.
 * Input example: "9,67 / 9,98 EUR" (bid / ask).
 * German format: dot as thousands separator, comma as decimal separator.
 * Returns a German-formatted string (e.g. "9,825") or DEFAULT_VALUE on failure.
 */
function extractFnetMean(s: string): string {
    const numbers = s.match(/[\d.]+,\d+/g);
    const values = numbers?.map((n: string) =>
        parseFloat(n.replace(/\./g, "").replace(",", "."))
    ) ?? [];
    if (values.length > 0) {
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        return mean.toString().replace(".", ",");
    }
    return DEFAULT_VALUE;
}

function extractFnetStockData(doc: Document): FetchResult {
    // Primary: fixed-index extraction.
    // Cell [1]: bid/ask string, e.g. "9,67 / 9,98 EUR".
    // Cell [9]: 52-week range string, e.g. "8,56 EUR / 12,34 EUR".
    //           Only EUR values are parsed; other currencies silently yield DEFAULT_VALUE for min/max.
    const SEARCH_RESULT_SELECTOR = "main div.tab-region__container table > tbody";

    const tbody = doc.querySelector(SEARCH_RESULT_SELECTOR);
    if (tbody) {
        const cells = tbody.querySelectorAll("tr td");
        const askBidString = cells[1]?.textContent ?? "";
        const lowHighString = cells[9]?.textContent ?? "";

        const rate = extractFnetMean(askBidString);
        const lowHigh = lowHighString.match(/[\d.]+,\d+(?=\s*EUR)/g);

        if (rate !== DEFAULT_VALUE) {
            return {
                rate,
                min: lowHigh?.[0] ?? DEFAULT_VALUE,
                max: lowHigh?.[1] ?? DEFAULT_VALUE,
                currency: detectCurrency(askBidString)
            };
        }
    }

    return {rate: DEFAULT_VALUE, min: DEFAULT_VALUE, max: DEFAULT_VALUE, currency: "EUR"};
}