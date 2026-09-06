/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {log, normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/driven/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE, detectCurrency} from "@/adapters/driven/fetch/providerUtils";

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
            const {rate, min, max, currency} = extractGoyaxStockData(doc);

            if (rate === DEFAULT_VALUE) {
                throw new Error(`goyax: failed to parse rate for ${urlObj.value}`);
            }

            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(rate, "de"),
                min: normalizeNumber(min, "de"),
                max: normalizeNumber(max, "de"),
                // The currency extractGoyaxRate actually detected, NOT a hardcoded
                // DEFAULT_CURRENCY. This used to drop the detected value on the
                // floor and always report EUR — re-introducing the exact bug
                // extractGoyaxRate's own doc comment says it was written to fix.
                // A truthy `cur` suppresses useOnlineStockData's ISIN-based USD
                // fallback AND makes `stockCur === uiCur` yield a divisor of 1, so
                // a USD-quoted instrument was carried into mValue/mChange and
                // the depot total with no FX conversion at all. `withCurrency`
                // already falls back to EUR when the page carries no marker, so
                // the common German-market case is unchanged.
                cur: currency
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

        // Require BOTH sides before accepting this tier. An `||` here returned
        // as soon as either matched, leaving the other at DEFAULT_VALUE ("0")
        // and skipping the fallbacks below that might have found it — which the
        // UI then rendered as a real 52-week low/high of 0,00 €.
        if (min !== DEFAULT_VALUE && max !== DEFAULT_VALUE) {
            return {min, max};
        }

        // Preferred, tier 2: goyax's current real page layout no longer has a
        // single row/li combining a yearish label with "hoch"/"tief" (tier 1
        // above) - the 52-week range is now the "1 Jahr" column of a
        // "Statistiken" comparison table, with the period header ("1 Jahr")
        // and the row label ("Hoch"/"Tief") in different cells entirely. Match
        // by label text on both axes (not a fixed row/column index) so this
        // stays resilient if goyax adds/reorders a metric row or a period
        // column.
        for (const table of Array.from(context.querySelectorAll("table"))) {
            const headerCells = Array.from(table.querySelectorAll("thead th"));
            const yearColIdx = headerCells.findIndex((th) => /1\s*jahr/i.test(th.textContent ?? ""));
            if (yearColIdx < 1) continue;
            const cellIdx = yearColIdx - 1; // header includes a leading blank <th> for the row-label column; body <td>s don't.

            for (const row of table.querySelectorAll("tbody tr")) {
                const rowLabel = (row.querySelector("th")?.textContent ?? "").toLowerCase();
                if (!rowLabel.includes("hoch") && !rowLabel.includes("tief")) continue;
                const cell = row.querySelectorAll("td")[cellIdx];
                const cellText = cell?.textContent?.trim();
                if (!cellText) continue;
                // extractLastNumber, NOT the raw cell text — same as tier 1
                // above, and for the same reason: these "Statistiken" cells
                // carry a leading percentage change before the price (e.g.
                // "+12,5 % 123,45"). The raw string then flows through
                // normalizeNumber -> toNumber, which take the FIRST number, so
                // the percentage silently became the 52-week high and was
                // rendered as a currency amount. Tier 2 was added after tier 1
                // and did not adopt its extractor.
                const candidate = extractLastNumber(cellText);
                if (candidate === DEFAULT_VALUE) continue;
                if (rowLabel.includes("hoch")) max = candidate;
                else min = candidate;
            }

            // Same both-sides requirement as tier 1 above.
            if (min !== DEFAULT_VALUE && max !== DEFAULT_VALUE) {
                return {min, max};
            }
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

        // Both protections tiers 1 and 2 carry, which this tier lacked —
        // copied from `acheck.extractAcheckMinMax`'s third tier, which already
        // has them (its both-sides gate is even annotated as "matching goyax's
        // equivalent gate"; the reconciliation stopped short of tier 3 here).
        //
        // `extractLastNumber` rather than the raw cell text: these cells carry a
        // leading percentage change before the price ("+12,5 % 123,45"), and the
        // raw string flows through `normalizeNumber -> toNumber`, which take the
        // FIRST number — so the percentage became the 52-week high and was
        // rendered as a currency amount. That is the exact bug tier 2's own
        // comment records being retrofitted.
        //
        // Filling in only what is still missing rather than assigning both
        // unconditionally: overwriting a side the label scans above DID find
        // with this tier's DEFAULT_VALUE would turn the stricter gates into a
        // regression, and returning one side populated with the other at "0"
        // rendered a real-looking 52-week low/high of 0,00 €.
        if (max === DEFAULT_VALUE) {
            max = extractLastNumber(maxCells[3]?.textContent?.trim() ?? "");
        }
        if (min === DEFAULT_VALUE) {
            min = extractLastNumber(minCells[3]?.textContent?.trim() ?? "");
        }

        return {min, max};
    } catch (error) {
        log("SERVICES fetch", {parser: "extractGoyaxMinMax", reason: "exception", error}, "warn");
        return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
    }
}

/**
 * Extracts the current rate and the currency it is quoted in.
 *
 * The currency used to be hardcoded to EUR, which made useOnlineStockData skip
 * FX conversion for a non-EUR instrument (a truthy `cur` suppresses the
 * ISIN-based USD fallback, and `stockCur === uiCur` then yields a divisor of 1)
 * — the same wrong-currency class round 30 fixed for acheck. Detect it from the
 * same text the rate came from, falling back to EUR when no marker is present
 * so the common German-market case behaves exactly as before.
 */
function extractGoyaxRate(doc: Document): { rate: string; currency: string } {
    const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";
    const withCurrency = (rate: string, source: string) => ({
        rate,
        currency: detectCurrency(source) || DEFAULT_CURRENCY
    });

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
            return withCurrency(DEFAULT_VALUE, "");
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
                // Read the currency off the whole row, not just the slice the
                // number came from: the marker often sits beside the label.
                if (rate !== DEFAULT_VALUE) return withCurrency(rate, text);
            }
        }

        // Fallback: old fixed structure (kept as a last resort).
        const listRows = context.querySelectorAll("ul.list-rows");
        const listItems = listRows.length >= 2 ? listRows[1].querySelectorAll("li") : [];
        const rateText = listItems.length >= 4 ? (listItems[3].textContent ?? "") : "";
        const parts = rateText ? rateText.split(")") : [];
        if (parts.length > 1) {
            return withCurrency(parts[1]?.trim() ?? DEFAULT_VALUE, rateText);
        }
        return withCurrency(extractFirstNumber(rateText), rateText);
    } catch (error) {
        log("SERVICES fetch", {parser: "extractGoyaxRate", reason: "exception", error}, "warn");
        return withCurrency(DEFAULT_VALUE, "");
    }
}

function extractGoyaxStockData(doc: Document): FetchResult {
    const {rate, currency} = extractGoyaxRate(doc);
    const {min, max} = extractGoyaxMinMax(doc);

    return {
        rate,
        min,
        max,
        currency
    };
}
