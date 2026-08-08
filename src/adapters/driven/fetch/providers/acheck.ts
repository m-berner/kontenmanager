/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY} from "@/domain/constants";
import type {FetchResult, NumberStringPair, StockMarketData} from "@/domain/types";
import {detectNumberFormat, log, normalizeNumber} from "@/domain/utils/utils";

import {fetchTextWithCacheFollowRedirect, parseHTML} from "@/adapters/driven/fetch/httpClient";
import {DEFAULT_CURRENCY, DEFAULT_VALUE, parseCurrency} from "@/adapters/driven/fetch/providerUtils";

/** Origin used to resolve and validate aktiencheck's own relative links. */
const ACHECK_BASE_URL = "https://m.aktiencheck.de";

/**
 * aktiencheck's search endpoint no longer serves the quote page itself
 * (verified live 2026-08-06). It answers **HTTP 200** with a body that *embeds*
 * a "302 Found" stub inside `#content`:
 *
 *   <h1>Found</h1><p>The document has moved <a href="/quotes/profil?...">here</a>.</p>
 *
 * Because that is a 200 and not a real 3xx, `fetchTextWithCacheFollowRedirect`
 * has nothing to follow — the scraper got a table-less stub and every lookup
 * failed with "failed to parse stock data". Follow the embedded link ourselves.
 *
 * Fails closed on anything that is not a same-origin HTTPS aktiencheck URL,
 * matching how ard.ts and wstreet.ts treat scraped navigation targets.
 */
function resolveAcheckRedirect(doc: Document): string | null {
    const href = doc
        .querySelector('a[href*="/quotes/profil"]')
        ?.getAttribute("href");
    if (!href) return null;

    try {
        const base = new URL(ACHECK_BASE_URL);
        const url = new URL(href, base);
        if (url.protocol !== "https:") return null;
        if (url.host !== base.host) return null;
        return url.toString();
    } catch (error) {
        log("SERVICES fetch", {parser: "resolveAcheckRedirect", reason: "invalid url", error}, "warn");
        return null;
    }
}

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
            let doc = await parseHTML(html);

            // Search results arrive as an embedded redirect stub; the real quote
            // page is one hop further. A page that already carries the quote
            // tables has no such link and is used as-is.
            const redirectUrl = resolveAcheckRedirect(doc);
            if (redirectUrl) {
                const followedHtml = await fetchTextWithCacheFollowRedirect(
                    redirectUrl,
                    CACHE_POLICY.QUOTE_TTL_MS,
                    {signal: options?.signal}
                );
                doc = await parseHTML(followedHtml);
            }

            const stockData = extractAcheckStockData(doc);

            if (stockData.rate === DEFAULT_VALUE) {
                throw new Error(`acheck: failed to parse stock data for ${urlObj.value}`);
            }

            const cur = stockData.currency;

            // aktiencheck's Hoch/Tief table carries NO currency marker, and for
            // a non-EUR instrument it is not in the same currency as the quote
            // table above it. Verified live 2026-08-06 on Apple: the quote row
            // reads "313,65 / Umsatz 577 M $" (USD, NASDAQ) while the range
            // table reads "Intraday 274.0 / 270.55" — an intraday HIGH some 40
            // below the current price, which is impossible in one currency;
            // 274 EUR is the German listing, matching what goyax/wstreet/ard
            // report for the same moment.
            //
            // Reporting those numbers under the quote's currency makes
            // useOnlineStockData divide an already-EUR range by the USD rate,
            // understating min/max by roughly the FX factor. Since the page
            // gives us no way to attribute the range, report it as unknown —
            // CompanyContent renders an unknown (0) min/max as an empty cell
            // rather than a fabricated price. For EUR instruments both tables
            // agree (BASF: quote 51,24, intraday 51.37/50.85) so nothing is lost
            // in the common case.
            const rangeIsSameCurrency = cur === DEFAULT_CURRENCY;
            const rangeMin = rangeIsSameCurrency ? stockData.min : DEFAULT_VALUE;
            const rangeMax = rangeIsSameCurrency ? stockData.max : DEFAULT_VALUE;

            // The differing strategies are DELIBERATE, not an inconsistency:
            // aktien-check.de mixes number formats on the same page. The quote
            // row is comma-decimal ("303,22") while the 52-week range table is
            // dot-decimal ("174.36") — both verified against real live markup
            // and pinned by the fixtures in this provider's tests. Hardcoding
            // "de" for min/max turns "174.36" into "17436".
            return {
                id: urlObj.key,
                isin: "",
                rate: normalizeNumber(stockData.rate, "de"),
                min: normalizeNumber(rangeMin, detectNumberFormat(rangeMin)),
                max: normalizeNumber(rangeMax, detectNumberFormat(rangeMax)),
                cur
            };
        })
    );
}

function extractFirstNumber(value: string): string {
    const match = value.match(/[-+]?\d[\d.,]*/);
    return match?.[0]?.trim() ?? DEFAULT_VALUE;
}

/**
 * Extracts the data-row value from the column whose header cell matches
 * `headerPattern`, for a 2-row (header + one data row) table shape - the
 * real live structure of aktien-check.de's rate table (verified 2026-08,
 * m.aktiencheck.de): header row ["Letzter","Vortag","Umsatz","Veraenderung"],
 * data row ["303,22","308,94","6,76 Mrd $","-1,85%"]. Returns "" when the
 * table has fewer than 2 rows or no header cell matches.
 */
function extractByColumnHeader(table: Element, headerPattern: RegExp): string {
    const rows = table.querySelectorAll("tr");
    if (rows.length < 2) return "";
    const headerCells = rows[0].querySelectorAll("th,td");
    const dataCells = rows[1].querySelectorAll("th,td");
    for (let i = 0; i < headerCells.length; i++) {
        const label = (headerCells[i]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
        if (headerPattern.test(label)) {
            return (dataCells[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
        }
    }
    return "";
}

function extractAcheckCurrencySymbol(table: Element): string {
    try {
        // Preferred: column-header extraction. The currency symbol is embedded
        // in the "Umsatz" (volume) column's data cell for both EUR and USD
        // listings (verified against real live markup, 2026-08) - the row-based
        // label:value scans below assume a layout this page no longer has.
        const umsatz = extractByColumnHeader(table, /umsatz|volumen/);
        if (umsatz) {
            const embedded = umsatz.match(/[$€]|\bUSD\b|\bEUR\b|US[- ]?Dollar|\bDollar\b/i);
            if (embedded) return embedded[0];
        }

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
        //
        // "" (not DEFAULT_VALUE) on every not-found path: DEFAULT_VALUE is the
        // string "0", the *price* sentinel, and returning it from a function
        // that yields a currency symbol is a type confusion that reads as
        // correct only because parseCurrency("0") happens to find no marker and
        // fall back to DEFAULT_CURRENCY. "" is the value the sibling
        // detectCurrency already uses for "not known", and parseCurrency
        // treats it identically — so this is a naming fix, not a behaviour
        // change.
        const CURRENCY_ROW = 1;
        const CURRENCY_CELL = 2;
        if (rows.length < CURRENCY_ROW + 1) {
            log("SERVICES fetch", {
                parser: "extractAcheckCurrencySymbol",
                reason: "missing rows",
                rows: rows.length
            }, "warn");
            return "";
        }
        const cells = rows[CURRENCY_ROW].querySelectorAll("td");
        return cells[CURRENCY_CELL]?.textContent?.trim() ?? "";
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckCurrencySymbol", reason: "exception", error}, "warn");
        return "";
    }
}

function extractAcheckMinMax(table: Element): { min: string; max: string } {
    try {
        const rows = table.querySelectorAll("tr");

        // Preferred: the real live table shape (verified 2026-08) is a header
        // row ("Zeitraum"/"Hoch"/"Tief") followed by one data row per period
        // (Intraday/Akt. Jahr/52 Wochen) - find the Hoch/Tief columns from the
        // header, then read them from the row whose own first cell is "52
        // Wochen" (the range this app wants). The row-label scan below assumes
        // "Hoch"/"Tief" are row labels, which this layout doesn't have.
        if (rows.length >= 2) {
            const headerCells = rows[0].querySelectorAll("th,td");
            let hochCol = -1;
            let tiefCol = -1;
            for (let i = 0; i < headerCells.length; i++) {
                const label = (headerCells[i]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
                if (label.includes("hoch")) hochCol = i;
                if (label.includes("tief")) tiefCol = i;
            }
            if (hochCol !== -1 && tiefCol !== -1) {
                for (const row of rows) {
                    const rowLabel = (row.querySelector("th,td")?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
                    if (!/52\s*wochen/.test(rowLabel)) continue;
                    const cells = row.querySelectorAll("th,td");
                    const maxCandidate = extractFirstNumber(cells[hochCol]?.textContent ?? "");
                    const minCandidate = extractFirstNumber(cells[tiefCol]?.textContent ?? "");
                    if (maxCandidate !== DEFAULT_VALUE && minCandidate !== DEFAULT_VALUE) {
                        return {min: minCandidate, max: maxCandidate};
                    }
                }
            }
        }

        // Fallback: scan for labeled rows (older/different layout).
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
                const maxCandidate = extractFirstNumber(cells[1]?.textContent ?? "");
                const minCandidate = extractFirstNumber(cells[2]?.textContent ?? "");
                if (maxCandidate !== DEFAULT_VALUE) max = maxCandidate;
                if (minCandidate !== DEFAULT_VALUE) min = minCandidate;
            }
        }

        // Require BOTH sides before accepting this tier, matching goyax's
        // equivalent gate. An `||` here returned as soon as either side matched,
        // leaving the other at DEFAULT_VALUE ("0") and skipping the fallback
        // below that might have found it - so a half-parsed table silently cost
        // us a real 52-week value (rendered as an empty cell by CompanyContent's
        // hasQuote guard).
        if (min !== DEFAULT_VALUE && max !== DEFAULT_VALUE) return {min, max};

        // Fallback: old fixed structure.
        const MINMAX_ROW = 3;
        const MAX_CELL = 1;
        const MIN_CELL = 2;
        if (rows.length < MINMAX_ROW + 1) {
            log("SERVICES fetch", {parser: "extractAcheckMinMax", reason: "missing rows", rows: rows.length}, "warn");
            return {min, max};
        }
        const cells = rows[MINMAX_ROW].querySelectorAll("td");
        // Fill in only what is still missing. Assigning both unconditionally
        // would let this tier overwrite a side the label scan above DID find
        // with its own DEFAULT_VALUE when these fixed cells are absent - turning
        // the stricter gate above into a regression instead of a fix.
        if (max === DEFAULT_VALUE) {
            max = extractFirstNumber(cells[MAX_CELL]?.textContent?.trim() ?? "");
        }
        if (min === DEFAULT_VALUE) {
            min = extractFirstNumber(cells[MIN_CELL]?.textContent?.trim() ?? "");
        }

        return {min, max};
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckMinMax", reason: "exception", error}, "warn");
        return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
    }
}

function extractAcheckRate(table: Element): string {
    try {
        // Preferred: column-header extraction - matches the real live page
        // structure (verified 2026-08). The row-based label:value scan below
        // misreads this layout: its header row's "Letzter" label cell sits next
        // to a "Vortag" (previous-close) header cell, not a price, and its data
        // row's own first cell is the price itself rather than a label, so
        // neither row satisfies a label:value match - the old fixed fallback
        // then silently returned "Vortag" (previous close), not "Letzter"
        // (the actual current price).
        const byColumn = extractByColumnHeader(table, /letzter|kurs|aktuell|preis/);
        if (byColumn) {
            const rate = extractFirstNumber(byColumn);
            if (rate !== DEFAULT_VALUE) return rate;
        }

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
