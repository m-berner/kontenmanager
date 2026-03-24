/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY, FETCH} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {log, normalizeNumber} from "@/domain/utils/utils";

import {fetchWithCache, fetchWithRetry, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {DEFAULT_VALUE, detectCurrency} from "@/adapters/secondary/fetch/providerUtils";

export async function wstreetFetcher(
    urls: NumberStringPair[],
    options?: { signal?: AbortSignal }
): Promise<StockMarketData[]> {
    return Promise.all(
        urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
            const response = await fetchWithRetry(urlObj.value, {
                signal: options?.signal
            });
            const responseJson = await response.json();
            const detailUrl = buildWStreetDetailUrl(responseJson);

            if (!detailUrl) {
                throw new Error(`wstreet: no detail URL found for ${urlObj.value}`);
            }

            const html = await fetchWithCache(
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

        // Primary: fixed-index extraction from scoped selectors.
        const quoteBody = doc.querySelector(ROOT_SELECTOR_QUOTE);
        const highLowBody = doc.querySelector(ROOT_SELECTOR_HIGH_LOW);
        if (highLowBody !== null) {
            const tds = highLowBody.querySelectorAll("tr td");
            const high = tds[5]?.textContent;
            const low = tds[7]?.textContent;
            result.max = extractFirstNumber(high ?? "");
            result.min = extractFirstNumber(low ?? "");
        }
        if (quoteBody !== null) {
            const quote = quoteBody.querySelectorAll("tr td")[3]?.textContent;
            result.rate = extractFirstNumber(quote ?? "");
            result.currency = detectCurrency(quote ?? "");
        }

        // Fallback: label-based scan across the whole document when selectors
        // miss (page redesign) or fixed indices returned no values.
        if (result.rate === DEFAULT_VALUE || result.min === DEFAULT_VALUE || result.max === DEFAULT_VALUE) {
            for (const table of doc.querySelectorAll("table")) {
                for (const row of table.querySelectorAll("tr")) {
                    const cells = row.querySelectorAll("th,td");
                    if (cells.length < 2) continue;
                    const label = (cells[0]?.textContent ?? "").toLowerCase().trim();
                    const value = (cells[1]?.textContent ?? "").trim();
                    if (!label || !value) continue;

                    if (result.rate === DEFAULT_VALUE &&
                        /\b(kurs|letzter|aktuell|preis)\b/.test(label)) {
                        result.rate = extractFirstNumber(value);
                        result.currency = detectCurrency(value) || result.currency;
                    }
                    if (result.max === DEFAULT_VALUE &&
                        /52.*hoch|hoch.*52/i.test(label)) {
                        result.max = extractFirstNumber(value);
                    }
                    if (result.min === DEFAULT_VALUE &&
                        /52.*tief|tief.*52/i.test(label)) {
                        result.min = extractFirstNumber(value);
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

        return result;
    } catch (error) {
        log(
            "SERVICES fetch",
            {parser: "extractWStreetStockData", reason: "exception", error},
            "warn"
        );
        return {rate: DEFAULT_VALUE, min: DEFAULT_VALUE, max: DEFAULT_VALUE, currency: ""};
    }
}