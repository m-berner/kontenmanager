/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY, FETCH} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {log, normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/driven/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE, detectCurrency} from "@/adapters/driven/fetch/providerUtils";

export async function wstreetFetcher(
    urls: NumberStringPair[],
    options?: { signal?: AbortSignal }
): Promise<StockMarketData[]> {
    return Promise.all(
        urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
            const searchText = await fetchTextWithCacheFollowRedirect(
                urlObj.value,
                CACHE_POLICY.QUOTE_TTL_MS,
                {signal: options?.signal}
            );
            let responseJson: unknown;
            try {
                responseJson = JSON.parse(searchText);
            } catch {
                throw new Error(`wstreet: invalid JSON response for ${urlObj.value}`);
            }
            const detailUrl = buildWStreetDetailUrl(responseJson);

            if (!detailUrl) {
                throw new Error(`wstreet: no detail URL found for ${urlObj.value}`);
            }

            const html = await fetchTextWithCacheFollowRedirect(
                detailUrl,
                CACHE_POLICY.QUOTE_TTL_MS,
                {signal: options?.signal}
            );
            const doc = await parseHTML(html);
            const {rate, min, max, currency} = extractWStreetStockData(doc);

            if (rate === DEFAULT_VALUE) {
                throw new Error(`wstreet: failed to parse rate for ${urlObj.value}`);
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

function extractFirstNumber(value: string): string {
    const match = value.match(/[-+]?\d[\d.,]*/);
    return match?.[0]?.trim() ?? DEFAULT_VALUE;
}

function buildWStreetDetailUrl(responseJson: unknown): string {
    const detailPath =
        typeof responseJson === "object" &&
        responseJson !== null &&
        "result" in responseJson &&
        Array.isArray(responseJson.result) &&
        responseJson.result.length > 0 &&
        typeof responseJson.result[0] === "object" &&
        responseJson.result[0] !== null &&
        "link" in responseJson.result[0] &&
        typeof responseJson.result[0].link === "string"
            ? responseJson.result[0].link
            : "";
    const baseUrl = FETCH.PROVIDERS["wstreet"]?.HOME ?? "";

    if (!baseUrl || !detailPath) return "";

    // Fail closed: only allow same-origin HTTPS detail URLs.
    try {
        const base = new URL(baseUrl);
        const url = new URL(detailPath, base);

        if (url.protocol !== "https:") return "";
        if (url.host !== base.host) return "";

        return url.toString();
    } catch (error) {
        log(
            "SERVICES fetch",
            {parser: "buildWStreetDetailUrl", reason: "invalid url", error},
            "warn"
        );
        return "";
    }
}

function extractWStreetStockData(doc: Document): FetchResult {
    const ROOT_SELECTOR_QUOTE = "div.alpha table > tbody";
    const ROOT_SELECTOR_HIGH_LOW = "div.omega table > tbody";

    try {
        const result = {rate: DEFAULT_VALUE, min: DEFAULT_VALUE, max: DEFAULT_VALUE, currency: ""};

        // Primary: fixed-index extraction from the scoped quote selector - the
        // rate row's position within div.alpha's own table is stable across
        // both the stock and ETF page layouts.
        const quoteBody = doc.querySelector(ROOT_SELECTOR_QUOTE);
        if (quoteBody !== null) {
            const quote = quoteBody.querySelectorAll("tr td")[3]?.textContent;
            result.rate = extractFirstNumber(quote ?? "");
            // `|| result.currency` — the preserving idiom this file already uses
            // in the rate fallback below. A bare assignment overwrote a detected
            // currency with `""` whenever the marker was missing from this cell,
            // and the fallback that would have recovered it is gated on
            // `result.rate === DEFAULT_VALUE`: it cannot run when the primary
            // selector succeeds, which is precisely when the guard was needed.
            result.currency = detectCurrency(quote ?? "") || result.currency;
        }

        // Preferred for min/max: label-based scan across the whole document,
        // matching by row label text ("52-Wochen Hoch"/"Tief") rather than
        // table position. Unlike the rate, the 52-week row's *table* isn't
        // stable: on a stock page it's the last 2 rows of div.omega, but on
        // an ETF page div.omega is instead an unrelated, fixed-lookback
        // "Performance" table with no Hoch/Tief row at all - a fixed flat-
        // index read into that table (tds[5]/tds[7]) doesn't fail, it just
        // silently returns a real-looking but wrong value (e.g. a %-change
        // figure) from a totally different row. Label matching sidesteps
        // that by finding the right row wherever it actually lives.
        for (const table of doc.querySelectorAll("table")) {
            for (const row of table.querySelectorAll("tr")) {
                const cells = row.querySelectorAll("th,td");
                if (cells.length < 2) continue;
                const label = (cells[0]?.textContent ?? "").toLowerCase().trim();
                const value = (cells[1]?.textContent ?? "").trim();
                if (!label || !value) continue;

                if (result.max === DEFAULT_VALUE && /52.*hoch|hoch.*52/i.test(label)) {
                    result.max = extractFirstNumber(value);
                }
                if (result.min === DEFAULT_VALUE && /52.*tief|tief.*52/i.test(label)) {
                    result.min = extractFirstNumber(value);
                }
            }
        }

        // Fallback: fixed-index extraction from div.omega, kept as a last
        // resort for whichever page layout the label scan above misses.
        if (result.min === DEFAULT_VALUE || result.max === DEFAULT_VALUE) {
            const highLowBody = doc.querySelector(ROOT_SELECTOR_HIGH_LOW);
            if (highLowBody !== null) {
                const tds = highLowBody.querySelectorAll("tr td");
                if (result.max === DEFAULT_VALUE) result.max = extractFirstNumber(tds[5]?.textContent ?? "");
                if (result.min === DEFAULT_VALUE) result.min = extractFirstNumber(tds[7]?.textContent ?? "");
            }
        }

        // Fallback: label-based scan for the rate when the quote selector
        // misses (page redesign).
        if (result.rate === DEFAULT_VALUE) {
            outer: for (const table of doc.querySelectorAll("table")) {
                for (const row of table.querySelectorAll("tr")) {
                    const cells = row.querySelectorAll("th,td");
                    if (cells.length < 2) continue;
                    const label = (cells[0]?.textContent ?? "").toLowerCase().trim();
                    const value = (cells[1]?.textContent ?? "").trim();
                    if (!label || !value) continue;

                    if (/\b(kurs|letzter|aktuell|preis)\b/.test(label)) {
                        result.rate = extractFirstNumber(value);
                        result.currency = detectCurrency(value) || result.currency;
                        break outer;
                    }
                }
            }
        }

        // Text-regex fallback for 52-week values when no labeled table row found.
        if (result.min === DEFAULT_VALUE || result.max === DEFAULT_VALUE) {
            const text = (doc.body?.textContent ?? "").replace(/\s+/g, " ");
            const maxMatch = text.match(/52\s*Wochen\s*Hoch\s*:?\s*([-+]?\d[\d.,]*)/i);
            const minMatch = text.match(/52\s*Wochen\s*Tief\s*:?\s*([-+]?\d[\d.,]*)/i);
            if (result.max === DEFAULT_VALUE && maxMatch?.[1]) result.max = maxMatch[1].trim();
            if (result.min === DEFAULT_VALUE && minMatch?.[1]) result.min = minMatch[1].trim();
        }

        // Never report `cur: ""`. Four of the six providers substitute
        // DEFAULT_CURRENCY for "no marker found at all", and three separate
        // files document why: an empty currency makes `useOnlineStockData` infer
        // USD from a "US" ISIN prefix and divide an EUR-quoted price by the USD
        // rate, corrupting the displayed price, `mChange` and the depot
        // total with a plausible-looking number. `providerUtils.parseCurrency`
        // states it as a rule: the fallback "must not be changed to ''".
        if (result.currency === "") {
            result.currency = DEFAULT_CURRENCY;
        }

        return result;
    } catch (error) {
        log(
            "SERVICES fetch",
            {parser: "extractWStreetStockData", reason: "exception", error},
            "warn"
        );
        // `rate: DEFAULT_VALUE` makes `wstreetFetcher` treat this as a failed
        // fetch, so the currency never reaches the store — but it is set to the
        // default anyway rather than `""`, so no path out of this function can
        // hand a consumer an empty currency.
        return {rate: DEFAULT_VALUE, min: DEFAULT_VALUE, max: DEFAULT_VALUE, currency: DEFAULT_CURRENCY};
    }
}