/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    CompanyData,
    DateData,
    ExchangeData,
    FetchResult,
    NumberStringPair,
    OnlineStorageData,
    ServiceFetcherType,
    ServiceName,
    StockMarketData,
    StringNumberPair
} from "@/types";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domains/errors";
import {log, mean, normalizeNumber, toNumber} from "@/domains/utils/utils";
import {BROWSER_STORAGE, ERROR_CATEGORY, FETCH, SETTINGS} from "@/constants";

const FNET = {
    INDEXES: "https://www.finanzen.net/indizes/",
    DATES: "https://www.finanzen.net/termine/",
    MATERIALS: "https://www.finanzen.net/rohstoffe/",
    ONLINE_TEST: "https://www.finanzen.net",
    SEARCH: "https://www.finanzen.net/suchergebnis.asp?_search="
};
const FX = {
    NAME: "fx-rate",
    HOME: "https://fx-rate.net/qwsaq",
    QUOTE: "https://fx-rate.net/calculator/?c_input="
};
const DEFAULT_TTL = 5 * 60 * 1000;
const DEFAULT_VALUE = "0";
const DEFAULT_CURRENCY = "EUR";
const TARGET_PERIOD = "1 Jahr";
const DEFAULT_CURRENCY_SYMBOL = "€"
const ARD_BASE_URL = "https://www.tagesschau.de";
const ARD_ALLOWED_HOSTS = new Set(["www.tagesschau.de", "tagesschau.de"]);
const ARD_ALLOWED_PATH_PREFIX = "/wirtschaft/boersenkurse/";

/**
 * Simple in-memory cache with TTL (time-to-live) expiration.
 *
 * Automatically cleans up expired entries when the cache exceeds 100 items.
 * Used primarily for caching HTTP responses to reduce network requests.
 */
const cache = new Map<string, { data: string; timestamp: number }>();

/**
 * Removes expired entries from the cache.
 * Called automatically when cache size exceeds 100 items.
 */
function cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > DEFAULT_TTL) {
            cache.delete(key);
        }
    }
}

/**
 * Stores data in the cache with the current timestamp.
 * Triggers cleanup if the cache size exceeds 100 entries.
 *
 * @param key - Unique identifier for cached data
 * @param data - String data to cache
 */
export function setCache(key: string, data: string): void {
    cache.set(key, {data, timestamp: Date.now()});
    if (cache.size > 100) cleanupCache();
}

/**
 * Retrieves cached data if it exists and hasn't expired.
 * Automatically removes expired entries on access.
 *
 * @param key - Cache key to retrieve
 * @param ttl - Time-to-live in milliseconds (default: DEFAULT_TTL)
 * @returns Cached data if valid, null if missing or expired
 */
export function getCache(key: string, ttl: number = DEFAULT_TTL): string | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

/**
 * Removes all entries from the cache.
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Returns cache statistics for monitoring and debugging.
 *
 * @returns Object containing current cache size and all keys
 */
export function getCacheStats() {
    return {
        size: cache.size,
        keys: Array.from(cache.keys())
    };
}

/**
 * Creates a promise that resolves after the specified delay.
 * Used for retry backoff logic.
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a fetch request with automatic retries on failure.
 * Includes 30-second timeout and exponential backoff between attempts.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch configuration
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Response object from successful fetch
 * @throws {@link AppError} When all retry attempts fail
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3
): Promise<Response> {
    const controller = new AbortController();
    const TIMEOUT_MS = 30_000;
    const timeoutReason = appError(
        ERROR_DEFINITIONS.SERVICES.FETCH.A.CODE,
        ERROR_CATEGORY.NETWORK,
        true,
        {url, timeoutMs: TIMEOUT_MS, reason: "timeout"}
    );
    const timeoutId = setTimeout(() => controller.abort(timeoutReason), TIMEOUT_MS);
    let lastStatus: number | undefined;
    let lastError: unknown;

    // Always enforce our own timeout, but still respect any caller-provided abort signal.
    // We do this by always passing our controller.signal to fetch, and mirroring the
    // caller abort into it.
    const callerSignal = options.signal;
    const onCallerAbort = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) {
        controller.abort(callerSignal.reason);
    } else {
        callerSignal?.addEventListener("abort", onCallerAbort, {once: true});
    }

    try {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Do not pass the caller signal directly, otherwise the timeout abort above
                // would be bypassed when a caller supplies its own signal.
                const {signal: _ignoredSignal, ...restOptions} = options;
                const response = await fetch(url, {
                    ...restOptions,
                    signal: controller.signal
                });

                if (response.ok) {
                    return response;
                }

                lastStatus = response.status;
                const isRetryable =
                    response.status === 429 || response.status >= 500;

                if (!isRetryable || attempt === maxRetries) {
                    break;
                }
            } catch (error) {
                // Prefer a structured abort reason (e.g. timeout AppError) if available.
                lastError =
                    controller.signal.aborted && controller.signal.reason !== undefined
                        ? controller.signal.reason
                        : error;

                // Caller cancellation should stop immediately (no retries).
                if (
                    controller.signal.aborted &&
                    controller.signal.reason !== timeoutReason
                ) {
                    throw lastError;
                }

                if (attempt < maxRetries) {
                    await delay(1000 * attempt);
                }
            }
        }
    } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", onCallerAbort);
    }

    throw appError(
        ERROR_DEFINITIONS.SERVICES.FETCH.A.CODE,
        ERROR_CATEGORY.NETWORK,
        true,
        {url, maxRetries, lastStatus, lastError: serializeError(lastError)}
    );
}

/**
 * Fetches text content with automatic caching.
 * Returns cached content if available and not expired.
 *
 * @param key - Unique cache identifier
 * @param url - URL to fetch if cache miss occurs
 * @param ttl - Cache time-to-live in milliseconds (default: 5 minutes)
 * @returns Cached or freshly fetched text content
 */
export async function fetchWithCache(
    key: string,
    url: string,
    ttl = DEFAULT_TTL,
    options: RequestInit = {}
): Promise<string> {
    const cached = getCache(key, ttl);
    if (cached) {
        log(`SERVICES fetch: Cache hit for ${key}`);
        return cached;
    }

    log(`SERVICES fetch: Cache miss for ${key}, fetching...`);
    const response = await fetchWithRetry(url, options);
    const text = await response.text();

    setCache(key, text);
    return text;
}

/**
 * Fetches text content once, while still handling redirects/canonical URLs.
 *
 * Use this when the initial URL may redirect and callers previously did
 * `fetchWithRetry(url)` only to discover `response.url`, then fetched again via
 * `fetchWithCache(response.url, response.url)`.
 *
 * Caches the returned HTML under both the original URL and the final URL.
 */
export async function fetchTextWithCacheFollowRedirect(
    url: string,
    ttl = DEFAULT_TTL,
    options: RequestInit = {}
): Promise<string> {
    const cached = getCache(url, ttl);
    if (cached) {
        log(`SERVICES fetch: Cache hit for ${url}`);
        return cached;
    }

    log(`SERVICES fetch: Cache miss for ${url}, fetching (follow redirect)...`);
    const response = await fetchWithRetry(url, options);
    const text = await response.text();

    // Prefer the canonical/final URL, but keep a short-lived alias for callers
    // that keep using the original URL.
    const finalUrl = response.url || url;
    setCache(finalUrl, text);
    if (finalUrl !== url) {
        setCache(url, text);
    }
    return text;
}

/**
 * Parses HTML string into a Document object for DOM manipulation.
 *
 * @param text - HTML content as string
 * @returns Parsed Document object
 * @throws {@link AppError} When text is empty or invalid
 */
export async function parseHTML(text: string): Promise<Document> {
    if (!text) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    return new DOMParser().parseFromString(text, "text/html");
}

/**
 * Parses currency code or symbol from text into standardized currency code.
 * @param code - Text containing currency information
 * @returns Standardized currency code (USD, EUR, or default)
 */
function parseCurrency(code: string): string {
    const normalized = code.toUpperCase();

    // Prefer explicit ISO codes.
    if (/\bUSD\b/.test(normalized) || normalized.includes("US$") || code.includes("$")) {
        return "USD";
    }
    if (/\bEUR\b/.test(normalized) || code.includes("€")) {
        return "EUR";
    }

    return DEFAULT_CURRENCY;
}

/**
 * Extracts rate and currency from the finanzen.net document.
 */
function extractFnetRateAndCurrency(doc: Document): {
    rate: string;
    currency: string;
} {
    const SEARCH_RESULT_SELECTOR = "#snapshot-value-fst-current-0 > span";

    const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);

    if (nodes.length >= 2) {
        return {
            rate: nodes[0]?.textContent?.trim() || DEFAULT_VALUE,
            currency: nodes[1]?.textContent?.trim() || DEFAULT_CURRENCY
        };
    }

    // Fallback: try to parse a combined string like "123,45 EUR" / "123.45 USD".
    const raw =
        doc.querySelector("#snapshot-value-fst-current-0")?.textContent?.trim() ??
        "";
    if (!raw) return {rate: DEFAULT_VALUE, currency: DEFAULT_CURRENCY};

    const rateMatch = raw.match(/[-+]?\d[\d.,]*/);
    const currencyMatch = raw.match(/(EUR|USD|\$|€)/);
    const rate = rateMatch?.[0]?.trim() ?? DEFAULT_VALUE;
    const currency = currencyMatch?.[0]?.trim() ?? DEFAULT_CURRENCY;
    return {rate, currency: parseCurrency(currency)};
}

/**
 * Extracts min and max from the finanzen.net document.
 */
function extractFnetMinMax(doc: Document): { min: string; max: string } {
    // Use a class selector so this keeps working even if finanzen.net adds extra classes.
    const SEARCH_RESULT_SELECTOR = "main .accordion__content";

    const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);

    // Preferred: use the scoped results table, but fall back to a global scan since
    // the exact wrapper structure changes occasionally.
    const rows =
        nodes.length > 0
            ? nodes[0].querySelectorAll<HTMLTableRowElement>("table > tbody > tr")
            : doc.querySelectorAll<HTMLTableRowElement>("table > tbody > tr");

    for (const row of rows) {
        const rowText = (row.textContent ?? "").toLowerCase();
        const rowTextNoWs = rowText.replace(/\s+/g, "");
        const targetNoWs = TARGET_PERIOD.toLowerCase().replace(/\s+/g, "");
        if (rowText.includes(TARGET_PERIOD.toLowerCase()) || rowTextNoWs.includes(targetNoWs)) {
            const cells = row.querySelectorAll("td");
            const cellTexts = Array.from(cells)
                .map((c) => c.textContent?.trim() ?? "")
                .filter(Boolean);

            // Preferred: old stable indices (if present).
            const minByIndex = cells[3]?.textContent?.trim();
            const maxByIndex = cells[4]?.textContent?.trim();
            if (minByIndex && maxByIndex) {
                return {
                    min: minByIndex,
                    max: maxByIndex
                };
            }

            // Fallback: some layouts have fewer columns; pick the last 2 numeric-looking cells.
            // Keep this strict so labels like "1 Jahr" don't get treated as a number.
            const numericCandidates = cellTexts.filter((t) => /^-?\d[\d.,]*$/.test(t));
            if (numericCandidates.length >= 2) {
                const min = numericCandidates[numericCandidates.length - 2] ?? DEFAULT_VALUE;
                const max = numericCandidates[numericCandidates.length - 1] ?? DEFAULT_VALUE;
                return {min, max};
            }

            return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
        }
    }

    return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
}

/**
 * Extracts detail URL from tagesschau.de document.
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
 * Extracts rate, min, max, and currency from the tagesschau.de document.
 */
function extractArdStockData(doc: Document): FetchResult {
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

    const rateByLabel = findValueByLabel(["kurs", "letzter", "aktuell"]);
    const minByLabel = findValueByLabel(["tief", "tagestief", "minimum"]);
    const maxByLabel = findValueByLabel(["hoch", "tageshoch", "maximum"]);

    if (rateByLabel || minByLabel || maxByLabel) {
        return {
            rate: rateByLabel ?? DEFAULT_VALUE,
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

    return {
        rate: DEFAULT_VALUE,
        min: DEFAULT_VALUE,
        max: DEFAULT_VALUE,
        currency: DEFAULT_CURRENCY
    };
}

function createDefaultStockData(id: number): StockMarketData {
    return {
        id,
        isin: "",
        rate: DEFAULT_VALUE,
        min: DEFAULT_VALUE,
        max: DEFAULT_VALUE,
        cur: DEFAULT_CURRENCY
    };
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

function extractWStreetRateAndCurrency(doc: Document): { rate: string; currency: string | null } {
    const ROOT_SELECTOR = "div.c2";

    try {
        const extractFirstNumber = (value: string): string => {
            const match = value.match(/[-+]?\d[\d.,]*/);
            return match?.[0]?.trim() ?? DEFAULT_VALUE;
        };

        const detectCurrency = (value: string): string | null => {
            // Return null when unknown. Do not collapse to DEFAULT_CURRENCY here,
            // otherwise we can't distinguish "EUR" from "unknown".
            if (value.includes("USD") || value.includes("$")) return "USD";
            if (value.includes("EUR") || value.includes("€")) return "EUR";
            return null;
        };

        const root = doc.querySelector(ROOT_SELECTOR) ?? doc;

        // Prefer key/value tables by label ("Kurs", "Letzter", ...).
        const tables = root.querySelectorAll("table");
        for (const table of tables) {
            const rows = table.querySelectorAll("tr");
            for (const row of rows) {
                const cells = row.querySelectorAll("th,td");
                if (cells.length < 2) continue;

                const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim();
                if (!label) continue;

                if (/^(kurs|letzter|aktuell|preis)\b/i.test(label)) {
                    const value = (cells[1]?.textContent ?? "").replace(/\s+/g, " ").trim();
                    if (value) {
                        return {
                            rate: extractFirstNumber(value),
                            currency: detectCurrency(value)
                        };
                    }
                }
            }
        }

        // Fallback: try to extract a rate from nearby text.
        // We deliberately require a label to reduce false positives.
        const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
        const labeled =
            text.match(
                /\b(Kurs|Letzter|Aktuell|Preis)\b\s*:?\s*([-+]?\d[\d.,]*\s*(?:EUR|USD|CHF|€|\$)?)/i
            ) ?? null;
        if (labeled?.[2]) {
            const raw = labeled[2].trim();
            return {
                rate: extractFirstNumber(raw),
                currency: detectCurrency(raw)
            };
        }

        return {rate: DEFAULT_VALUE, currency: null};
    } catch (error) {
        log(
            "SERVICES fetch",
            {parser: "extractWStreetRate", reason: "exception", error},
            "warn"
        );
        return {rate: DEFAULT_VALUE, currency: null};
    }
}

function extractWStreetMinMax(doc: Document): { min: string; max: string } {
    const ROOT_SELECTOR = "div.fundamental";

    try {
        const extractFirstNumber = (value: string): string => {
            const match = value.match(/[-+]?\d[\d.,]*/);
            return match?.[0]?.trim() ?? DEFAULT_VALUE;
        };

        const root = doc.querySelector(ROOT_SELECTOR) ?? doc;

        // 1) Look for labeled patterns in text, e.g. "52-Wochen-Tief 1,23 ... 52-Wochen-Hoch 4,56".
        const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();

        const minMatch =
            text.match(
                /\b(52\s*[- ]?\s*Wochen\s*[- ]?\s*Tief|WochenTief|Wochentief)\b\s*:?\s*([-+]?\d[\d.,]*)/i
            ) ?? null;
        const maxMatch =
            text.match(
                /\b(52\s*[- ]?\s*Wochen\s*[- ]?\s*Hoch|WochenHoch|Wochenhoch|Hoch)\b\s*:?\s*([-+]?\d[\d.,]*)/i
            ) ?? null;

        if (minMatch?.[2] && maxMatch?.[2]) {
            return {
                min: extractFirstNumber(minMatch[2]),
                max: extractFirstNumber(maxMatch[2])
            };
        }

        // 2) Key/value tables by label.
        let min = DEFAULT_VALUE;
        let max = DEFAULT_VALUE;
        const tables = root.querySelectorAll("table");
        for (const table of tables) {
            const rows = table.querySelectorAll("tr");
            for (const row of rows) {
                const cells = row.querySelectorAll("th,td");
                if (cells.length < 2) continue;

                const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim();
                const value = (cells[1]?.textContent ?? "").replace(/\s+/g, " ").trim();
                if (!label || !value) continue;

                if (
                    /\b(52\s*[- ]?\s*Wochen\s*[- ]?\s*Tief|WochenTief|Wochentief)\b/i.test(
                        label
                    )
                ) {
                    min = extractFirstNumber(value);
                } else if (
                    /\b(52\s*[- ]?\s*Wochen\s*[- ]?\s*Hoch|WochenHoch|Wochenhoch)\b/i.test(
                        label
                    )
                ) {
                    max = extractFirstNumber(value);
                }
            }
        }

        return {min, max};
    } catch (error) {
        log(
            "SERVICES fetch",
            {parser: "extractWStreetMinMax", reason: "exception", error},
            "warn"
        );
        return {min: DEFAULT_VALUE, max: DEFAULT_VALUE};
    }
}

function extractWStreetStockData(doc: Document): FetchResult {
    const rateResult = extractWStreetRateAndCurrency(doc);
    const {min, max} = extractWStreetMinMax(doc);
    const currency = (() => {
        if (rateResult.currency) return rateResult.currency;

        // Fallback: try to infer currency from the most relevant sections.
        const c2Text = doc.querySelector("div.c2")?.textContent ?? "";
        const fundamentalText =
            doc.querySelector("div.fundamental")?.textContent ?? "";
        const combined = `${c2Text} ${fundamentalText}`;

        const inferred = (() => {
            // Prefer symbols over plain codes to reduce false positives.
            if (combined.includes("€")) return "EUR";
            if (combined.includes("$")) return "USD";
            if (combined.includes("EUR")) return "EUR";
            if (combined.includes("USD")) return "USD";
            return null;
        })();
        if (inferred) return inferred;

        // Last resort: check for a data attribute, e.g. data-currency="USD".
        const attrValue =
            doc
                .querySelector<HTMLElement>("[data-currency]")
                ?.getAttribute("data-currency") ?? "";
        if (attrValue.includes("USD")) return "USD";
        if (attrValue.includes("EUR")) return "EUR";
        return DEFAULT_CURRENCY;
    })();

    return {
        rate: rateResult.rate,
        min,
        max,
        currency
    };
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

function extractAcheckRate(table: Element): string {
    try {
        const extractFirstNumber = (value: string): string => {
            const match = value.match(/[-+]?\d[\d.,]*/);
            return match?.[0]?.trim() ?? DEFAULT_VALUE;
        };

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
        return cells[RATE_CELL]?.textContent?.trim() ?? DEFAULT_VALUE;
    } catch (error) {
        log("SERVICES fetch", {parser: "extractAcheckRate", reason: "exception", error}, "warn");
        return DEFAULT_VALUE;
    }
}

function extractAcheckCurrencySymbol(table: Element): string {
    try {
        const rows = table.querySelectorAll("tr");

        // Prefer extracting the currency from the same row as the rate (often 3 columns).
        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 3) continue;

            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            if (label.includes("kurs") || label.includes("letzter") || label.includes("aktuell") || label.includes("preis")) {
                const raw = (cells[2]?.textContent ?? "").trim();
                if (raw) return raw;
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
        const extractFirstNumber = (value: string): string => {
            const match = value.match(/[-+]?\d[\d.,]*/);
            return match?.[0]?.trim() ?? DEFAULT_VALUE;
        };

        const rows = table.querySelectorAll("tr");

        // Preferred: scan for labeled rows.
        let min = DEFAULT_VALUE;
        let max = DEFAULT_VALUE;
        for (const row of rows) {
            const cells = row.querySelectorAll("th,td");
            if (cells.length < 2) continue;

            const label = (cells[0]?.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
            const value = (cells[1]?.textContent ?? "").replace(/\s+/g, " ").trim();

            if (label.includes("hoch")) {
                const raw = value || (row.textContent ?? "");
                const candidate = extractFirstNumber(raw);
                if (candidate !== DEFAULT_VALUE) max = candidate;
            } else if (label.includes("tief")) {
                const raw = value || (row.textContent ?? "");
                const candidate = extractFirstNumber(raw);
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

function calculateMidQuote(bid: string, ask: string): string {
    try {
        const bidNumber = toNumber(bid);
        const askNumber = toNumber(ask);

        // If either value is invalid, return default
        if (!Number.isFinite(bidNumber) || !Number.isFinite(askNumber)) {
            log("SERVICES fetch", {
                parser: "calculateMidQuote",
                reason: "non-finite bid/ask",
                bid,
                ask,
                bidNumber,
                askNumber
            }, "warn");
            return DEFAULT_VALUE;
        }

        const midQuote = mean([bidNumber, askNumber]);

        return midQuote.toString();
    } catch (error) {
        log("SERVICES fetch", {parser: "calculateMidQuote", reason: "exception", error, bid, ask}, "warn");
        return DEFAULT_VALUE;
    }
}

function extractTgateStockData(doc: Document): { rate: string } {
    const ASK_SELECTOR = "#ask";
    const BID_SELECTOR = "#bid";

    const ask =
        doc.querySelector(ASK_SELECTOR)?.textContent?.trim() ??
        DEFAULT_VALUE;
    const bid =
        doc.querySelector(BID_SELECTOR)?.textContent?.trim() ??
        DEFAULT_VALUE;

    const rate = calculateMidQuote(bid, ask);

    return {rate};
}

/**
 * Service-specific fetchers Map
 */
const serviceFetchers: Record<ServiceName, ServiceFetcherType> = {
    fnet: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const html = await fetchTextWithCacheFollowRedirect(
                    urlObj.value,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);

                const {rate, currency} = extractFnetRateAndCurrency(doc);
                const {min, max} = extractFnetMinMax(doc);

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
    },

    ard: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const html = await fetchWithCache(
                    urlObj.value,
                    urlObj.value,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const detailUrl = extractArdDetailUrl(doc);

                if (!detailUrl) {
                    return createDefaultStockData(urlObj.key);
                }

                const detailHtml = await fetchWithCache(
                    detailUrl,
                    detailUrl,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const detailDoc = await parseHTML(detailHtml);
                const {rate, min, max, currency} = extractArdStockData(detailDoc);

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
    },

    wstreet: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const response = await fetchWithRetry(urlObj.value, {
                    signal: options?.signal
                });
                const responseJson = await response.json();
                const detailUrl = buildWStreetDetailUrl(responseJson);

                if (!detailUrl) {
                    log(
                        "SERVICES fetch",
                        {
                            service: "wstreet",
                            reason: "missing detail url",
                            url: urlObj.value
                        },
                        "warn"
                    );
                    return createDefaultStockData(urlObj.key);
                }

                const html = await fetchWithCache(
                    detailUrl,
                    detailUrl,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const {rate, min, max, currency} = extractWStreetStockData(doc);

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
    },

    goyax: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const html = await fetchTextWithCacheFollowRedirect(
                    urlObj.value,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const {rate, min, max} = extractGoyaxStockData(doc);

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
    },

    acheck: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const html = await fetchTextWithCacheFollowRedirect(
                    urlObj.value,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const stockData = extractAcheckStockData(doc);

                if (!stockData) {
                    return createDefaultStockData(-1);
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
    },

    tgate: async (
        urls: NumberStringPair[],
        options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]> => {
        return Promise.all(
            urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                const html = await fetchWithCache(
                    urlObj.value,
                    urlObj.value,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const {rate} = extractTgateStockData(doc);

                return {
                    id: urlObj.key,
                    isin: "",
                    rate,
                    min: DEFAULT_VALUE,
                    max: DEFAULT_VALUE,
                    cur: DEFAULT_CURRENCY
                };
            })
        );
    }
};

/**
 * Fetches company metadata (name and symbol) from ISIN.
 *
 * @param isin - International Securities Identification Number (12 characters)
 * @returns Company name and trading symbol
 * @throws {@link AppError} When ISIN is invalid or company not found
 */
export async function fetchCompanyData(isin: string): Promise<CompanyData> {
    if (!isin || isin.length !== 12) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.C.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    const service = FETCH.PROVIDERS["tgate"];
    if (!service) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.D.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    const firstResponse = await fetchWithRetry(service.QUOTE + isin);
    const secondResponse = await fetchWithRetry(firstResponse.url);
    const html = await secondResponse.text();
    const doc = await parseHTML(html);

    const col1 = doc.querySelector("#col1_content");
    const companyRaw =
        col1?.querySelector("h1")?.textContent ??
        col1?.querySelector("h2")?.textContent ??
        col1?.textContent ??
        "";
    const company = companyRaw.split(/[,\n\r]/)[0]?.trim() || "";

    if (!company || company.includes("Die Gattung wird")) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.E.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    // Prefer label-based extraction for resilience against layout changes.
    let symbol = "";
    const rows = doc.querySelectorAll<HTMLTableRowElement>("table > tbody tr");
    for (const row of rows) {
        const label = row.cells[0]?.textContent?.trim().toLowerCase() ?? "";
        if (!label) continue;
        if (label.includes("symbol")) {
            symbol = row.cells[1]?.textContent?.trim() || "";
            break;
        }
    }
    // Fallback for older markup where symbol was in a fixed row.
    if (!symbol) {
        symbol = rows[1]?.cells[1]?.textContent?.trim() || "";
    }

    if (!symbol) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.F.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    return {company, symbol};
}

/**
 * Fetches current stock market data (rate, min, max) for multiple securities.
 *
 * @param storageOnline - Array of online storage items containing ISINs
 * @param getStorage - Function to retrieve browser storage data
 * @returns Array of stock market data with normalized values
 * @throws {@link AppError} When service is invalid or fetcher not found
 */
export async function fetchMinRateMaxData(
    storageOnline: OnlineStorageData[],
    getStorage: (_keys: string[]) => Promise<Record<string, unknown>>,
    options?: { signal?: AbortSignal }
): Promise<StockMarketData[]> {
    if (storageOnline.length === 0) {
        return [];
    }

    log("SERVICES fetch: Fetching min/rate/max data", {
        count: storageOnline.length
    });

    const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
    const serviceName = storageService[BROWSER_STORAGE.SERVICE.key] as ServiceName;
    const service = FETCH.PROVIDERS[serviceName];

    if (!service) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.G.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    const fetcher = serviceFetchers[serviceName];
    if (!fetcher) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.H.CODE,
            ERROR_CATEGORY.NETWORK,
            false
        );
    }

    const urls = storageOnline.map((item) => ({
        value: service.QUOTE + item.isin,
        key: item.id ?? -1
    }));

    return fetcher(urls, options);
}

/**
 * Fetches upcoming company event dates (general meetings, quarterly reports).
 *
 * @param obj - Array of company identifiers and search terms
 * @returns Array of date data with timestamps for GM and quarterly reports
 */
export async function fetchDateData(
    obj: NumberStringPair[],
    options?: { signal?: AbortSignal }
): Promise<DateData[]> {
    if (obj.length === 0) return [];

    const parseGermanDate = (germanDateString: string): number => {
        const parts = germanDateString.match(/(\d+)/g) ?? ["01", "01", "1970"];
        const year =
            parts.length === 3 && parts[2].length === 4 ? parts[2] : "1970";
        const month = parts.length === 3 ? parts[1].padStart(2, "0") : "01";
        const day = parts.length === 3 ? parts[0].padStart(2, "0") : "01";
        // Use UTC to avoid timezone/DST shifts affecting the date.
        const y = Number.parseInt(year, 10);
        const m = Number.parseInt(month, 10);
        const d = Number.parseInt(day, 10);
        return Date.UTC(
            Number.isFinite(y) ? y : 1970,
            Number.isFinite(m) ? m - 1 : 0,
            Number.isFinite(d) ? d : 1
        );
    };

    return Promise.all(
        obj.map(async (entry: NumberStringPair): Promise<DateData> => {
            const gmqf = {gm: 0, qf: 0};

            try {
                const firstResponse = await fetchWithRetry(
                    `${FNET.SEARCH}${entry.value}`,
                    {signal: options?.signal}
                );
                const atoms = firstResponse.url.split("/");
                const stockName = atoms[atoms.length - 1].replace("-aktie", "");

                const html = await fetchWithCache(
                    `${FNET.DATES}${stockName}`,
                    `${FNET.DATES}${stockName}`,
                    DEFAULT_TTL,
                    {signal: options?.signal}
                );
                const doc = await parseHTML(html);
                const tables = doc.querySelectorAll(".table");

                if (tables.length < 2) {
                    return {key: entry.key, value: gmqf};
                }

                const rows = tables[1].querySelectorAll("tr");
                let stopGm = false;
                let stopQf = false;

                for (const row of rows) {
                    if (!row.cells[3]) continue;

                    const dateText =
                        row.cells[3].textContent?.replaceAll("(e)*", "").trim() ??
                        "01.01.1970";
                    const rowType = row.cells[0]?.textContent;

                    if (
                        rowType === "Quartalszahlen" &&
                        !stopQf &&
                        dateText !== "01.01.1970" &&
                        dateText.length === 10
                    ) {
                        gmqf.qf = parseGermanDate(dateText);
                        stopQf = true;
                    } else if (
                        rowType === "Hauptversammlung" &&
                        !stopGm &&
                        dateText !== "01.01.1970" &&
                        dateText.length === 10
                    ) {
                        gmqf.gm = parseGermanDate(dateText);
                        stopGm = true;
                    }

                    if (stopQf && stopGm) break;
                }
            } catch (error) {
                log(
                    "SERVICES fetch: Failed to fetch date data",
                    {entry, error},
                    "warn"
                );
            }

            return {key: entry.key, value: gmqf};
        })
    );
}

/**
 * Fetches current exchange rates for currency pairs.
 *
 * @param exchangeCodes - Array of 6-character currency pair codes (e.g., 'USDEUR')
 * @returns Array of exchange rates, filtering out failed requests
 */
export async function fetchExchangesData(exchangeCodes: string[]): Promise<ExchangeData[]> {
    if (exchangeCodes.length === 0) return [];

    const service = FX;
    if (!service) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.FETCH.I.CODE,
            ERROR_CATEGORY.NETWORK,
            false
        );
    }

    const results = await Promise.allSettled(
        exchangeCodes.map(async (code): Promise<ExchangeData> => {
            const url = `${service.QUOTE}${code.substring(
                0,
                3
            )}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await fetchWithCache(url, url);
            const doc = await parseHTML(html);

            const rateElement = doc.querySelector("[data-rate]");
            if (!rateElement) {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.FETCH.J.CODE,
                    ERROR_CATEGORY.NETWORK,
                    false
                );
            }

            const rateString = rateElement.getAttribute("data-rate");
            const rateMatch = rateString?.match(/[0-9]*\.?[0-9]+/g);
            const rate = rateMatch ? Number.parseFloat(rateMatch[0]) : 1;

            return {key: code, value: rate};
        })
    );

    const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    if (rejected.length > 0) {
        log(
            "SERVICES fetch: fetchExchangesData partial failures",
            {
                total: exchangeCodes.length,
                rejected: rejected.length,
                errors: rejected.slice(0, 3).map((r) => serializeError(r.reason))
            },
            "warn"
        );
    }

    return results
        .filter(
            (r): r is PromiseFulfilledResult<ExchangeData> =>
                r.status === "fulfilled"
        )
        .map((r) => r.value);
}

/**
 * Fetches current values for major stock market indices.
 *
 * @returns Array of index names and current values
 */
export async function fetchIndexData(): Promise<StringNumberPair[]> {
    log("SERVICES fetch: Fetching index data");

    const html = await fetchWithCache(
        FNET.INDEXES,
        FNET.INDEXES
    );
    const doc = await parseHTML(html);
    const links = doc.querySelectorAll(".index-world-map a");

    const indexes: StringNumberPair[] = [];
    for (const property of Object.keys(SETTINGS.INDEXES)) {
        for (const link of links) {
            const title = link.getAttribute("title");
            // finanzen.net markup changes occasionally; be resilient:
            // - sometimes value is in a nested element
            // - sometimes it's included directly in the link text
            const valueText =
                link.querySelector(":scope > *")?.textContent ??
                link.textContent ??
                "";
            const numberText = valueText.match(/[-+]?\d[\d.,]*/)?.[0] ?? "";

            if (SETTINGS.INDEXES[property]?.includes(title || "") && numberText) {
                indexes.push({
                    key: property,
                    value: toNumber(numberText)
                });
                break;
            }
        }
    }

    return indexes;
}

/**
 * Fetches current commodity and material prices.
 *
 * @returns Array of material names and prices
 */
export async function fetchMaterialData(): Promise<StringNumberPair[]> {
    log("SERVICES fetch: Fetching material data");

    const html = await fetchWithCache(
        FNET.MATERIALS,
        FNET.MATERIALS
    );
    const doc = await parseHTML(html);
    const rows = doc.querySelectorAll("#commodity_prices > table > tbody tr");

    const materials: StringNumberPair[] = [];
    for (const row of rows) {
        const cells = row.querySelectorAll("td");
        const nameCell = cells[0];
        const valueCell = cells[1];

        if (nameCell && valueCell) {
            const name = nameCell.textContent?.trim();
            const valueText = valueCell.textContent ?? "";
            const numberText = valueText.match(/[-+]?\d[\d.,]*/)?.[0] ?? "";
            const value = toNumber(numberText);

            if (name) {
                materials.push({key: name, value});
            }
        }
    }

    return materials;
}

/**
 * Tests internet connectivity by attempting to fetch a known endpoint.
 *
 * @returns True if connection successful, false otherwise
 */
export async function fetchIsOk(): Promise<boolean> {
    try {
        const response = await fetchWithRetry(FNET.ONLINE_TEST);
        return response.ok;
    } catch (err) {
        // This is a non-critical connectivity probe; callers only need a boolean.
        void err;
        return false;
    }
}

// Export for compatibility
export const fetchService = {
    fetchWithRetry,
    fetchWithCache,
    parseHTML,
    fetchCompanyData,
    fetchMinRateMaxData,
    fetchDateData,
    fetchExchangesData,
    fetchIndexData,
    fetchMaterialData,
    fetchIsOk,
    clearCache,
    getCacheStats
};
