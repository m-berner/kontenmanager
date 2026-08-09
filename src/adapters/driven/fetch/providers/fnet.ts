/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/driven/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE, detectCurrency} from "@/adapters/driven/fetch/providerUtils";

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
 * German format: dot as a thousand separator comma as decimal separator.
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

/**
 * Scans a flat list of label/value table cells (alternating pairs within one
 * row, e.g. ["Eröffnung / Vortag", "144,12 / 144,88 EUR", "BID / ASK", "144,36 / 144,40", ...])
 * for the value cell immediately following a label matching `labelPattern`.
 */
function findPairedValueByLabel(cells: (Element | null)[], labelPattern: RegExp): string | undefined {
    for (let i = 0; i < cells.length - 1; i++) {
        const label = (cells[i]?.textContent ?? "").trim();
        if (labelPattern.test(label)) {
            return cells[i + 1]?.textContent ?? undefined;
        }
    }
    return undefined;
}

function extractFnetStockData(doc: Document): FetchResult {
    // Preferred: label-based scan across the row's label/value cell pairs -
    // a flat cell index has already drifted at least twice on this page.
    // Cell [1] is "Eröffnung / Vortag" (open/previous close), not bid/ask -
    // the real BID/ASK pair lives at cell [3] (verified against live-captured
    // markup). A stale flat-index read wouldn't fail loudly, it would
    // silently return a real-looking but wrong rate. Matching by label is
    // resilient to further row reordering.
    // Fallback: fixed-index extraction (cell [3] for bid/ask, cell [9] for
    // the 52-week range), kept as a last resort for whichever layout the
    // label scan misses.
    // Only EUR 52-week values are parsed; other currencies silently yield DEFAULT_VALUE for min/max.
    const SEARCH_RESULT_SELECTOR = "main div.tab-region__container table > tbody";

    const tbody = doc.querySelector(SEARCH_RESULT_SELECTOR);
    if (tbody) {
        const cells = Array.from(tbody.querySelectorAll("tr td"));
        // The BID/ASK value cell itself never carries a currency suffix (verified
        // against live-captured markup for both an EUR- and a USD-underlying
        // stock) - the "Eröffnung / Vortag" cell right before it does, so
        // currency detection reads from that one specifically, not from
        // whichever string produced the rate.
        const openPrevString =
            findPairedValueByLabel(cells, /^eröffnung\s*\/\s*vortag$/i) ?? cells[1]?.textContent ?? "";
        const askBidString =
            findPairedValueByLabel(cells, /^bid\s*\/\s*ask$/i) ?? cells[3]?.textContent ?? "";
        const rangeCell = cells.find((c) => /52\s*wochen/i.test(c.textContent ?? "")) ?? cells[9];
        const lowHighString = rangeCell?.textContent ?? "";

        const rate = extractFnetMean(askBidString);
        const lowHigh = lowHighString.match(/[\d.]+,\d+(?=\s*EUR)/g);
        // Only trust the pair when both low and high are present — a single match
        // is ambiguous (could be either side) and must not be assigned positionally.
        const hasFullRange = lowHigh?.length === 2;

        if (rate !== DEFAULT_VALUE) {
            return {
                rate,
                min: hasFullRange ? lowHigh[0] : DEFAULT_VALUE,
                max: hasFullRange ? lowHigh[1] : DEFAULT_VALUE,
                // `|| DEFAULT_CURRENCY`, matching ard/goyax/acheck/tgate.
                // `detectCurrency` returns "" when the page carries no marker,
                // and a falsy `cur` is unsafe downstream: `useOnlineStockData`
                // falls back to inferring the currency from the ISIN prefix, so
                // a US-domiciled stock quoted in EUR on this German page had its
                // price divided by the USD rate — silently, producing a
                // plausible-looking number in `mValue`, `mChange` and the
                // depot total. `providerUtils.parseCurrency` states the rule
                // outright: the fallback "must not be changed to ''".
                currency: detectCurrency(openPrevString) || DEFAULT_CURRENCY
            };
        }
    }

    return {rate: DEFAULT_VALUE, min: DEFAULT_VALUE, max: DEFAULT_VALUE, currency: "EUR"};
}