/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {normalizeNumber} from "@/domain/utils/utils";

import {fetchWithCache, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL, DEFAULT_VALUE} from "@/adapters/secondary/fetch/providerUtils";

/** Base URL used to resolve relative tagesschau.de navigation paths. */
const ARD_BASE_URL = "https://www.tagesschau.de";

/** Accepted hostnames for ARD detail page URLs — fail-closed allowlist. */
const ARD_ALLOWED_HOSTS = new Set(["www.tagesschau.de", "tagesschau.de"]);

/** Only URLs under this path prefix are considered valid ARD stock detail pages. */
const ARD_ALLOWED_PATH_PREFIX = "/wirtschaft/boersenkurse/";

/**
 * Parses and validates a tagesschau.de detail page URL from a row's `onclick` attribute.
 * Accepts both absolute (`https://www.tagesschau.de/...`) and root-relative (`/wirtschaft/...`) formats.
 * Fails closed: returns `null` for any URL that does not match the expected host, path prefix,
 * or security constraints (non-HTTPS, credentials).
 *
 * @param onclickAttr - Raw value of the `onclick` attribute, e.g. `document.location='/wirtschaft/...'`.
 * @returns The validated absolute URL string, or `null` if the URL is absent or untrusted.
 */
export function sanitizeArdDetailUrlFromOnclick(onclickAttr: string): string | null {
    // Expected formats:
    // - document.location='/wirtschaft/boersenkurse/...';
    // - document.location="https://www.tagesschau.de/wirtschaft/boersenkurse/...";
    const match = onclickAttr.match(/document\.location\s*=\s*(["'])([^"']+)\1/);
    if (!match) return null;

    const rawUrl = match[2]?.trim();
    if (!rawUrl) return null;

    let url: URL;
    try {
        url = new URL(rawUrl, ARD_BASE_URL);
    } catch (err) {
        void err;
        return null;
    }

    // Fail closed to avoid following untrusted navigation strings.
    if (url.protocol !== "https:") return null;
    if (!ARD_ALLOWED_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith(ARD_ALLOWED_PATH_PREFIX)) return null;
    if (url.username || url.password) return null;

    return url.toString();
}

/**
 * Fetches stock market data (rate, min, max, currency) from tagesschau.de (ARD).
 * Performs two HTTP requests per stock: first to the search result page to obtain the
 * detail page URL, then to the detail page itself to extract the quote data.
 * Both responses are cached under `CACHE_POLICY.QUOTE_TTL_MS`.
 *
 * @param urls - Array of `{ key: storeId, value: searchUrl }` pairs, one per stock.
 * @param options - Optional fetch options; `signal` is forwarded to all HTTP calls.
 * @returns Resolved array of normalized stock market data in dot-decimal format.
 * @throws When the detail URL cannot be found or the quote data cannot be parsed.
 */
export async function ardFetcher(
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
            const detailUrl = extractArdDetailUrl(doc);

            if (!detailUrl) {
                throw new Error(`ard: no detail URL found for ${urlObj.value}`);
            }

            const detailHtml = await fetchWithCache(
                detailUrl,
                CACHE_POLICY.QUOTE_TTL_MS,
                {signal: options?.signal}
            );
            const detailDoc = await parseHTML(detailHtml);
            const stockData = extractArdStockData(detailDoc);

            if (!stockData) {
                throw new Error(`ard: failed to parse stock data for ${urlObj.value}`);
            }

            if (stockData.rate === DEFAULT_VALUE) {
                throw new Error(`ard: failed to parse rate for ${urlObj.value}`);
            }

            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(stockData.rate, "de"),
                min: normalizeNumber(stockData.min, "de"),
                max: normalizeNumber(stockData.max, "de"),
                cur: stockData.currency
            };
        })
    );
}

/**
 * Extracts the stock detail page URL from the tagesschau.de search result document.
 * Reads the `onclick` attribute of the first result row and delegates URL validation
 * to `sanitizeArdDetailUrlFromOnclick`.
 *
 * @param doc - Parsed search result document.
 * @returns Validated detail page URL, or `null` if none is found.
 */
function extractArdDetailUrl(doc: Document): string | null {
    const DATA_TABLE_SELECTOR = "#desktopSearchResult > table > tbody > tr";

    const rows = doc.querySelectorAll(DATA_TABLE_SELECTOR);

    if (rows.length === 0) {
        return null;
    }

    const onclickAttr = rows[0].getAttribute("onclick");

    if (!onclickAttr) {
        return null;
    }

    return sanitizeArdDetailUrlFromOnclick(onclickAttr);
}

/**
 * Extracts rate, min, max, and currency from a tagesschau.de stock detail document.
 * Prefers label-based row lookup (resilient to row order changes); falls back to
 * fixed row indices for older markup (rows 0, 6, 7).
 * Returns `null` when neither strategy yields a rate.
 *
 * @param doc - Parsed stock detail document.
 * @returns Extracted quote data, or `null` if the document structure is unrecognized.
 */
function extractArdStockData(doc: Document): FetchResult | null {
    const DATA_TABLE_SELECTOR = "#USFkursdaten table > tbody tr";

    const rows = doc.querySelectorAll<HTMLTableRowElement>(DATA_TABLE_SELECTOR);

    const cleanCell = (row: HTMLTableRowElement, cellIndex: number): string => {
        return (row.cells[cellIndex]?.textContent ?? DEFAULT_VALUE).replace(
            DEFAULT_CURRENCY_SYMBOL,
            ""
        );
    };

    // Prefer label-based extraction since row order is prone to change.
    const findValueByLabel = (terms: string[]): string | null => {
        for (const row of rows) {
            const label = row.cells[0]?.textContent?.trim().toLowerCase() ?? "";
            if (!label) continue;
            if (terms.some((t) => label.includes(t))) {
                return cleanCell(row, 1);
            }
        }
        return null;
    };

    const rateByLabel = findValueByLabel(["Kurs"]);
    const minByLabel = findValueByLabel(["52 Wochen-Tief"]);
    const maxByLabel = findValueByLabel(["52 Wochen-Hoch"]);

    if (rateByLabel) {
        return {
            rate: rateByLabel,
            min: minByLabel ?? DEFAULT_VALUE,
            max: maxByLabel ?? DEFAULT_VALUE,
            currency: DEFAULT_CURRENCY
        };
    }

    // Fallback for older markup where values are in fixed rows.
    if (rows.length >= 8) {
        return {
            rate: cleanCell(rows[0], 1),
            min: cleanCell(rows[6], 1),
            max: cleanCell(rows[7], 1),
            currency: DEFAULT_CURRENCY
        };
    }

    return null;
}