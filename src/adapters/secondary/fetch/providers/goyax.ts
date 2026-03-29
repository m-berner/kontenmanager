/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {log, normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/secondary/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE} from "@/adapters/secondary/fetch/providerUtils";

export async function goyaxFetcher(
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
            const {rate, min, max} = extractGoyaxStockData(doc);

            if (rate === DEFAULT_VALUE) {
                throw new Error(`goyax: failed to parse rate for ${urlObj.value}`);
            }

            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(rate, "de"),
                min: normalizeNumber(min, "de"),
                max: normalizeNumber(max, "de"),
                cur: DEFAULT_CURRENCY
            };
        })
    );
}

function extractGoyaxMinMax(doc: Document): { min: string; max: string } {
    const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";

    try {
        const extractLastNumber = (value: string): string => {
            const matches = Array.from(value.matchAll(/[-+]?\d[\d.,]*/g)).map((m) => m[0]).filter(Boolean);
            const last = matches.length > 0 ? matches[matches.length - 1] : null;
            return last?.trim() ?? DEFAULT_VALUE;
        };

        const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);

        if (nodes.length === 0) {
            log("SERVICES fetch", {
                parser: "extractGoyaxMinMax",
                reason: "missing overview nodes",
                selector: OVERVIEW_SELECTOR
            }, "warn");
            return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
        }

        const context = nodes[0] ?? doc;

        // Preferred: label-based scan for 52-week/year high/low values.
        let min = DEFAULT_VALUE;
        let max = DEFAULT_VALUE;
        const rows = context.querySelectorAll("tr, li");
        for (const row of rows) {
            const text = (row.textContent ?? "").replace(/\s+/g, " ").trim();
            if (!text) continue;
            const lower = text.toLowerCase();

            const isYearish = /\b(52|jahr|1\s*j)\b/i.test(text);
            if (!isYearish) continue;

            if (lower.includes("hoch")) {
                const candidate = extractLastNumber(text);
                if (candidate !== DEFAULT_VALUE) max = candidate;
            } else if (lower.includes("tief")) {
                const candidate = extractLastNumber(text);
                if (candidate !== DEFAULT_VALUE) min = candidate;
            }
        }

        if (min !== DEFAULT_VALUE || max !== DEFAULT_VALUE) {
            return {min, max};
        }

        // Fallback: old fixed structure (kept as a last resort).
        const tables = context.querySelectorAll("table");
        if (tables.length < 2) {
            log("SERVICES fetch", {
                parser: "extractGoyaxMinMax",
                reason: "missing tables",
                tables: tables.length
            }, "warn");
            return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
        }
        const tableRows = tables[1].querySelectorAll("tr");
        if (tableRows.length < 6) {
            log("SERVICES fetch", {
                parser: "extractGoyaxMinMax",
                reason: "missing rows",
                rows: tableRows.length
            }, "warn");
            return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
        }
        const maxCells = tableRows[4].querySelectorAll("td");
        const minCells = tableRows[5].querySelectorAll("td");
        max = maxCells[3]?.textContent?.trim() ?? DEFAULT_VALUE;
        min = minCells[3]?.textContent?.trim() ?? DEFAULT_VALUE;
        return {min, max};
    } catch (error) {
        log("SERVICES fetch", {parser: "extractGoyaxMinMax", reason: "exception", error}, "warn");
        return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
    }
}

function extractGoyaxRate(doc: Document): string {
    const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";

    try {
        const extractFirstNumber = (value: string): string => {
            const match = value.match(/[-+]?\d[\d.,]*/);
            return match?.[0]?.trim() ?? DEFAULT_VALUE;
        };

        const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);

        if (nodes.length < 2) {
            log("SERVICES fetch", {
                parser: "extractGoyaxRate",
                reason: "missing overview nodes",
                selector: OVERVIEW_SELECTOR,
                nodes: nodes.length
            }, "warn");
            return DEFAULT_VALUE;
        }

        const context = nodes[1] ?? doc;

        // Prefer labeled list/table entries.
        const candidates = context.querySelectorAll("li, tr");
        for (const candidate of candidates) {
            const text = (candidate.textContent ?? "").replace(/\s+/g, " ").trim();
            if (!text) continue;

            if (/\b(kurs|letzter|aktuell|preis)\b/i.test(text)) {
                // Keep old behavior if the format contains parentheses, but fall back to number extraction.
                const afterParen = text.includes(")") ? text.split(")").slice(1).join(")").trim() : "";
                const raw = afterParen || text;
                const rate = extractFirstNumber(raw);
                if (rate !== DEFAULT_VALUE) return rate;
            }
        }

        // Fallback: old fixed structure (kept as a last resort).
        const listRows = context.querySelectorAll("ul.list-rows");
        const listItems = listRows.length >= 2 ? listRows[1].querySelectorAll("li") : [];
        const rateText = listItems.length >= 4 ? (listItems[3].textContent ?? "") : "";
        const parts = rateText ? rateText.split(")") : [];
        if (parts.length > 1) return parts[1]?.trim() ?? DEFAULT_VALUE;
        return extractFirstNumber(rateText);
    } catch (error) {
        log("SERVICES fetch", {parser: "extractGoyaxRate", reason: "exception", error}, "warn");
        return DEFAULT_VALUE;
    }
}

function extractGoyaxStockData(doc: Document): FetchResult {
    const rate = extractGoyaxRate(doc);
    const {min, max} = extractGoyaxMinMax(doc);

    return {
        rate,
        min,
        max,
        currency: DEFAULT_CURRENCY
    };
}
