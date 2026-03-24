/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {detectNumberFormat, log, normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE, parseCurrency} from "@/adapters/secondary/fetch/providerUtils";

export async function acheckFetcher(
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
            const stockData = extractAcheckStockData(doc);

            if (stockData.rate === DEFAULT_VALUE) {
                throw new Error(`acheck: failed to parse stock data for ${urlObj.value}`);
            }

            const cur = stockData.currency;

            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(stockData.rate, "de"),
                min: normalizeNumber(stockData.min, detectNumberFormat(stockData.min)),
                max: normalizeNumber(stockData.max, detectNumberFormat(stockData.max)),
                cur
            };
        })
    );
}

function extractFirstNumber(value: string): string {
    const match = value.match(/[-+]?\d[\d.,]*/);
    return match?.[0]?.trim() ?? DEFAULT_VALUE;
}

function extractAcheckCurrencySymbol(table: Element): string {
    try {
        const rows = table.querySelectorAll("tr");

        // First: look for a dedicated currency row (e.g. "Währung", "Währ.").
        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 2) continue;
            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            if (label.includes("währ")) {
                const raw = (cells[1]?.textContent ?? "").trim();
                if (raw) return raw;
            }
        }

        // Second: look for currency in or alongside the rate row.
        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 2) continue;

            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            if (label.includes("kurs") || label.includes("letzter") || label.includes("aktuell") || label.includes("preis")) {
                // Prefer a dedicated currency column (3 cells).
                if (cells.length >= 3) {
                    const raw = (cells[2]?.textContent ?? "").trim();
                    if (raw) return raw;
                }
                // Fallback: currency symbol may be embedded in the rate cell (e.g. "3,00 $", "3,00 US-Dollar").
                const rateText = (cells[1]?.textContent ?? "").trim();
                const embedded = rateText.match(/[$€]|\bUSD\b|\bEUR\b|US[- ]?Dollar|\bDollar\b/i);
                if (embedded) return embedded[0];
            }
        }

        // Fallback: old fixed structure.
        const CURRENCY_ROW = 1;
        const CURRENCY_CELL = 2;
        if (rows.length < CURRENCY_ROW + 1) {
            log("SERVICES fetch", {
                parser: "extractAcheckCurrencySymbol",
                reason: "missing rows",
                rows: rows.length
            }, "warn");
            return DEFAULT_VALUE;
        }
        const cells = rows[CURRENCY_ROW].querySelectorAll("td");
        return cells[CURRENCY_CELL]?.textContent?.trim() ?? DEFAULT_VALUE;
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckCurrencySymbol", reason: "exception", error}, "warn");
        return DEFAULT_VALUE;
    }
}

function extractAcheckMinMax(table: Element): { min: string; max: string } {
    try {
        const rows = table.querySelectorAll("tr");

        // Preferred: scan for labeled rows.
        let min = DEFAULT_VALUE;
        let max = DEFAULT_VALUE;
        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 2) continue;

            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            const value = (cells[1]?.textContent ?? "").replace(/\s+/g, " ").trim();

            if (label.includes("hoch") && !label.includes("tief")) {
                const candidate = extractFirstNumber(value);
                if (candidate !== DEFAULT_VALUE) max = candidate;
            } else if (label.includes("tief") && !label.includes("hoch")) {
                const candidate = extractFirstNumber(value);
                if (candidate !== DEFAULT_VALUE) min = candidate;
            } else if (label.includes("hoch") && label.includes("tief") && cells.length >= 3) {
                max = extractFirstNumber(cells[1]?.textContent ?? "");
                min = extractFirstNumber(cells[2]?.textContent ?? "");
            }
        }

        if (min !== DEFAULT_VALUE || max !== DEFAULT_VALUE) return {min, max};

        // Fallback: old fixed structure.
        const MINMAX_ROW = 3;
        const MAX_CELL = 1;
        const MIN_CELL = 2;
        if (rows.length < MINMAX_ROW + 1) {
            log("SERVICES fetch", {parser: "extractAcheckMinMax", reason: "missing rows", rows: rows.length}, "warn");
            return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
        }
        const cells = rows[MINMAX_ROW].querySelectorAll("td");
        max = extractFirstNumber(cells[MAX_CELL]?.textContent?.trim() ?? "");
        min = extractFirstNumber(cells[MIN_CELL]?.textContent?.trim() ?? "");

        return {min, max};
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckMinMax", reason: "exception", error}, "warn");
        return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
    }
}

function extractAcheckRate(table: Element): string {
    try {
        const rows = table.querySelectorAll("tr");

        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 2) continue;

            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            const value = (cells[1]?.textContent ?? "").replace(/\s+/g, " ").trim();

            if (label.includes("kurs") || label.includes("letzter") || label.includes("aktuell") || label.includes("preis")) {
                const raw = value || (row.textContent ?? "");
                const rate = extractFirstNumber(raw);
                if (rate !== DEFAULT_VALUE) return rate;
            }
        }

        // Fallback: old fixed structure.
        const RATE_ROW = 1;
        const RATE_CELL = 1;
        if (rows.length < RATE_ROW + 1) {
            log("SERVICES fetch", {parser: "extractAcheckRate", reason: "missing rows", rows: rows.length}, "warn");
            return DEFAULT_VALUE;
        }
        const cells = rows[RATE_ROW].querySelectorAll("td");
        return extractFirstNumber(cells[RATE_CELL]?.textContent?.trim() ?? "");
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckRate", reason: "exception", error}, "warn");
        return DEFAULT_VALUE;
    }
}

function extractAcheckStockData(doc: Document): FetchResult {
    const CONTENT_TABLE_SELECTOR = "#content table";
    const MIN_REQUIRED_TABLES = 3;

    const tables = doc.querySelectorAll(CONTENT_TABLE_SELECTOR);

    if (tables.length < MIN_REQUIRED_TABLES) {
        log("SERVICES fetch", {
            parser: "extractAcheckStockData",
            reason: "missing tables",
            selector: CONTENT_TABLE_SELECTOR,
            tables: tables.length
        }, "warn");
        return {
            rate: DEFAULT_VALUE,
            min: DEFAULT_VALUE,
            max: DEFAULT_VALUE,
            currency: DEFAULT_CURRENCY
        };
    }

    const rate = extractAcheckRate(tables[0]);
    const currencySymbol = extractAcheckCurrencySymbol(tables[0]);
    const {min, max} = extractAcheckMinMax(tables[2]);
    const currency = parseCurrency(currencySymbol);

    return {rate, min, max, currency};
}
