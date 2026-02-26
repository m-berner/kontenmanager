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
    StockMarketData,
    StringNumberPair
} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import {FETCH} from "@/configs/fetch";
import {STORES} from "@/configs/stores";
import {BROWSER_STORAGE} from "@/domains/configs/storage";

/**
 * Simple in-memory cache with TTL (time-to-live) expiration.
 *
 * Automatically cleans up expired entries when the cache exceeds 100 items.
 * Used primarily for caching HTTP responses to reduce network requests.
 */
class FetchCache {
    /**
     * Internal cache storage mapping keys to data and timestamps.
     * @private
     */
    private cache = new Map<string, { data: string; timestamp: number }>();

    /**
     * Stores data in the cache with the current timestamp.
     * Triggers cleanup if the cache size exceeds 100 entries.
     *
     * @param key - Unique identifier for cached data
     * @param data - String data to cache
     */
    set(key: string, data: string): void {
        this.cache.set(key, {data, timestamp: Date.now()});
        if (this.cache.size > 100) this.cleanup();
    }

    /**
     * Retrieves cached data if it exists and hasn't expired.
     * Automatically removes expired entries on access.
     *
     * @param key - Cache key to retrieve
     * @param ttl - Time-to-live in milliseconds (default: FETCH.DEFAULT_TTL)
     * @returns Cached data if valid, null if missing or expired
     */
    get(key: string, ttl: number = FETCH.DEFAULT_TTL): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Removes all entries from the cache.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Returns cache statistics for monitoring and debugging.
     *
     * @returns Object containing current cache size and all keys
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Removes expired entries from the cache.
     * Called automatically when cache size exceeds 100 items.
     *
     * @private
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > FETCH.DEFAULT_TTL) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * Service for fetching and parsing stock market data from various financial data providers.
 *
 * Provides caching, retry logic, and normalized data extraction from multiple sources
 * including finanzen.net, ARD Börse, wallstreet-online, goyax, aktiencheck, and tradegate.
 */
class FetchService {
    private cache: FetchCache;

    /**
     * Service-specific fetchers Map (refactored with shared logic)
     * Maps service identifiers to their respective fetching implementations.
     * @private
     */
    private serviceFetchers: Record<string, ServiceFetcherType> = {
        /**
         * Fetches stock data from finanzen.net
         * Extracts rate, currency, min/max values from HTML content
         */
        fnet: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch and parse
                    const response = await this.fetchWithRetry(urlObj.value);
                    const html = await this.fetchWithCache(response.url, response.url);
                    const doc = await this.parseHTML(html);

                    // Extract data
                    const {rate, currency} = this.extractFnetRateAndCurrency(doc);
                    const {min, max} = this.extractFnetMinMax(doc);

                    return {
                        id: urlObj.key!,
                        isin: "",
                        rate: DomainUtils.normalizeNumber(rate, "de"),
                        min: DomainUtils.normalizeNumber(min, "de"),
                        max: DomainUtils.normalizeNumber(max, "de"),
                        cur: currency
                    };
                })
            );
        },

        /**
         * Fetches stock data from ARD Börse (Tagesschau)
         * Requires two-step fetch: initial search page, then detail page
         */
        ard: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch and parse the initial page
                    const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                    const doc = await this.parseHTML(html);

                    // Extract detail page URL
                    const detailUrl = this.extractArdDetailUrl(doc);

                    if (!detailUrl) {
                        return this.createDefaultStockData(urlObj.key!);
                    }

                    // Fetch and parse detail page
                    const detailHtml = await this.fetchWithCache(detailUrl, detailUrl);
                    const detailDoc = await this.parseHTML(detailHtml);

                    // Extract stock data
                    const {rate, min, max, currency} =
                        this.extractArdStockData(detailDoc);

                    return {
                        id: urlObj.key!,
                        isin: "",
                        rate: DomainUtils.normalizeNumber(rate, "de"),
                        min: DomainUtils.normalizeNumber(min, "de"),
                        max: DomainUtils.normalizeNumber(max, "de"),
                        cur: currency
                    };
                })
            );
        },

        /**
         * Fetches stock data from wallstreet-online.de
         * Requires two-step fetch: initial search page, then detail page
         */
        wstreet: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch initial data and extract detail URL
                    const response = await this.fetchWithRetry(urlObj.value);
                    const responseJson = await response.json();
                    const detailUrl = this.buildWStreetDetailUrl(responseJson);

                    // Fetch and parse detail page
                    const html = await this.fetchWithCache(detailUrl, detailUrl);
                    const doc = await this.parseHTML(html);

                    // Extract stock data
                    const {rate, min, max, currency} =
                        this.extractWStreetStockData(doc);

                    return {
                        id: urlObj.key ?? 0,
                        isin: "",
                        rate: DomainUtils.normalizeNumber(rate, "de"),
                        min: DomainUtils.normalizeNumber(min, "de"),
                        max: DomainUtils.normalizeNumber(max, "de"),
                        cur: currency
                    };
                })
            );
        },

        /**
         * Fetches stock data from goyax.de
         */
        goyax: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch and parse page
                    const response = await this.fetchWithRetry(urlObj.value);
                    const html = await this.fetchWithCache(response.url, response.url);
                    const doc = await this.parseHTML(html);

                    // Extract stock data
                    const {rate, min, max} = this.extractGoyaxStockData(doc);

                    return {
                        id: urlObj.key!,
                        isin: "",
                        rate: DomainUtils.normalizeNumber(rate, "de"),
                        min: DomainUtils.normalizeNumber(min, "de"),
                        max: DomainUtils.normalizeNumber(max, "de"),
                        cur: FETCH.DEFAULT_CURRENCY
                    };
                })
            );
        },

        /**
         * Fetches stock data from aktiencheck.de
         * Requires two-step fetch: initial search page, then detail page
         */
        acheck: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch and parse page
                    const response = await this.fetchWithRetry(urlObj.value);
                    const html = await this.fetchWithCache(response.url, response.url);
                    const doc = await this.parseHTML(html);

                    // Extract stock data
                    const stockData = this.extractAcheckStockData(doc);

                    // Return default if extraction failed
                    if (!stockData) {
                        return this.createDefaultStockData(-1);
                    }

                    return {
                        id: urlObj.key!,
                        isin: "",
                        rate: DomainUtils.normalizeNumber(stockData.rate, "de"),
                        min: DomainUtils.normalizeNumber(stockData.min, "de"),
                        max: DomainUtils.normalizeNumber(stockData.max, "de"),
                        cur: stockData.currency
                    };
                })
            );
        },

        /**
         * Fetches stock data from tradegate.de
         */
        tgate: async (urls: NumberStringPair[]): Promise<StockMarketData[]> => {
            return Promise.all(
                urls.map(async (urlObj: NumberStringPair): Promise<StockMarketData> => {
                    // Fetch and parse page
                    const html = await this.fetchWithCache(urlObj.value, urlObj.value);
                    const doc = await this.parseHTML(html);

                    // Extract stock data
                    const {rate} = this.extractTgateStockData(doc);

                    return {
                        id: urlObj.key!,
                        isin: "",
                        rate,
                        min: FETCH.DEFAULT_VALUE,
                        max: FETCH.DEFAULT_VALUE,
                        cur: FETCH.DEFAULT_CURRENCY
                    };
                })
            );
        }
    };

    constructor() {
        this.cache = new FetchCache();
    }

    /**
     * Performs a fetch request with automatic retries on failure.
     * Includes 30-second timeout and exponential backoff between attempts.
     *
     * @param url - The URL to fetch
     * @param options - Optional fetch configuration
     * @param maxRetries - Maximum retry attempts (default: 3)
     * @returns Response object from successful fetch
     * @throws {AppError} When all retry attempts fail
     *
     * @example
     * ```
     * const response = await fetchService.fetchWithRetry('https://example.com/api');
     * ```
     */
    async fetchWithRetry(
        url: string,
        options: RequestInit = {},
        maxRetries = 3
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        let lastStatus: number | undefined;
        let lastError: unknown;

        try {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, {
                        ...options,
                        signal: options.signal || controller.signal
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
                    lastError = error;
                    if (attempt < maxRetries) {
                        await this.delay(1000 * attempt);
                    }
                }
            }
        } finally {
            clearTimeout(timeoutId);
        }

        throw new AppError(
            ERROR_CODES.SERVICES.FETCH.A,
            ERROR_CATEGORY.NETWORK,
            true,
            {url, maxRetries, lastStatus, lastError}
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
    async fetchWithCache(
        key: string,
        url: string,
        ttl = FETCH.DEFAULT_TTL
    ): Promise<string> {
        const cached = this.cache.get(key, ttl);
        if (cached) {
            DomainUtils.log(`SERVICES fetch: Cache hit for ${key}`);
            return cached;
        }

        DomainUtils.log(`SERVICES fetch: Cache miss for ${key}, fetching...`);
        const response = await this.fetchWithRetry(url);
        const text = await response.text();

        this.cache.set(key, text);
        return text;
    }

    /**
     * Parses HTML string into a Document object for DOM manipulation.
     *
     * @param text - HTML content as string
     * @returns Parsed Document object
     * @throws {AppError} When text is empty or invalid
     */
    async parseHTML(text: string): Promise<Document> {
        if (!text) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.B,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
        return new DOMParser().parseFromString(text, "text/html");
    }

    /**
     * Fetches company metadata (name and symbol) from ISIN.
     * Uses tradegate.de as the data source.
     *
     * @param isin - International Securities Identification Number (12 characters)
     * @returns Company name and trading symbol
     * @throws {AppError} When ISIN is invalid or company not found
     */
    async fetchCompanyData(isin: string): Promise<CompanyData> {
        if (!isin || isin.length !== 12) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.C,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        const service = FETCH.PROVIDERS["tgate"];
        if (!service) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.D,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        const firstResponse = await this.fetchWithRetry(service.QUOTE + isin);
        const secondResponse = await this.fetchWithRetry(firstResponse.url);
        const html = await secondResponse.text();
        const doc = await this.parseHTML(html);

        const nameNode = doc.querySelector("#col1_content")?.childNodes[1];
        const company = nameNode?.textContent?.split(",")[0].trim() || "";

        if (!company || company.includes("Die Gattung wird")) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.E,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        const tables: NodeListOf<HTMLTableRowElement> =
            doc.querySelectorAll("table > tbody tr");
        const symbol = tables[1]?.cells[1]?.textContent?.trim() || "";

        if (!symbol) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.F,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        return {company, symbol};
    }

    /**
     * Fetches current stock market data (rate, min, max) for multiple securities.
     * Service provider is determined from browser storage settings.
     *
     * @param storageOnline - Array of online storage items containing ISINs
     * @param getStorage - Function to retrieve browser storage data
     * @returns Array of stock market data with normalized values
     * @throws {AppError} When service is invalid or fetcher not found
     */
    async fetchMinRateMaxData(
        storageOnline: OnlineStorageData[],
        getStorage: (_keys: string[]) => Promise<Record<string, unknown>>
    ): Promise<StockMarketData[]> {
        if (storageOnline.length === 0) {
            return [];
        }

        DomainUtils.log("SERVICES fetch: Fetching min/rate/max data", {
            count: storageOnline.length
        });

        const storageService = await getStorage([BROWSER_STORAGE.SERVICE.key]);
        const serviceName = storageService[BROWSER_STORAGE.SERVICE.key] as string;
        const service = FETCH.PROVIDERS[serviceName];

        if (!service) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.G,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        const fetcher = this.serviceFetchers[serviceName];
        if (!fetcher) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.H,
                ERROR_CATEGORY.NETWORK,
                false
            );
        }

        const urls = storageOnline.map((item) => ({
            value: service.QUOTE + item.isin,
            key: item.id ?? -1
        }));

        return fetcher(urls);
    }

    /**
     * Fetches upcoming company event dates (general meetings, quarterly reports).
     * Source: finanzen.net
     *
     * @param obj - Array of company identifiers and search terms
     * @returns Array of date data with timestamps for GM and quarterly reports
     */
    async fetchDateData(obj: NumberStringPair[]): Promise<DateData[]> {
        if (obj.length === 0) return [];

        const parseGermanDate = (germanDateString: string): number => {
            const parts = germanDateString.match(/(\d+)/g) ?? ["01", "01", "1970"];
            const year =
                parts.length === 3 && parts[2].length === 4 ? parts[2] : "1970";
            const month = parts.length === 3 ? parts[1].padStart(2, "0") : "01";
            const day = parts.length === 3 ? parts[0].padStart(2, "0") : "01";
            return new Date(`${year}-${month}-${day}`).getTime();
        };

        return Promise.all(
            obj.map(async (entry: NumberStringPair): Promise<DateData> => {
                const gmqf = {gm: 0, qf: 0};

                try {
                    const firstResponse = await this.fetchWithRetry(
                        `${FETCH.FNET.SEARCH}${entry.value}`
                    );
                    const atoms = firstResponse.url.split("/");
                    const stockName = atoms[atoms.length - 1].replace("-aktie", "");

                    const html = await this.fetchWithCache(
                        `${FETCH.FNET.DATES}${stockName}`,
                        `${FETCH.FNET.DATES}${stockName}`
                    );
                    const doc = await this.parseHTML(html);
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
                    DomainUtils.log(
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
    async fetchExchangesData(exchangeCodes: string[]): Promise<ExchangeData[]> {
        if (exchangeCodes.length === 0) return [];

        const service = FETCH.FX;
        if (!service) {
            throw new AppError(
                ERROR_CODES.SERVICES.FETCH.I,
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
                const html = await this.fetchWithCache(url, url);
                const doc = await this.parseHTML(html);

                const rateElement = doc.querySelector("[data-rate]");
                if (!rateElement) {
                    throw new AppError(
                        ERROR_CODES.SERVICES.FETCH.J,
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

        return results
            .filter(
                (r): r is PromiseFulfilledResult<ExchangeData> =>
                    r.status === "fulfilled"
            )
            .map((r) => r.value);
    }

    /**
     * Fetches current values for major stock market indices.
     * Source: finanzen.net world indices map
     *
     * @returns Array of index names and current values
     */
    async fetchIndexData(): Promise<StringNumberPair[]> {
        DomainUtils.log("SERVICES fetch: Fetching index data");

        const html = await this.fetchWithCache(
            FETCH.FNET.INDEXES,
            FETCH.FNET.INDEXES
        );
        const doc = await this.parseHTML(html);
        const links = doc.querySelectorAll(".index-world-map a");

        const indexes: StringNumberPair[] = [];
        for (const property of Object.keys(STORES.INDEXES)) {
            for (const link of links) {
                const title = link.getAttribute("title");
                const valueText = link.children[0]?.textContent;

                if (STORES.INDEXES[property]?.includes(title || "") && valueText) {
                    indexes.push({
                        key: property,
                        value: DomainUtils.toNumber(valueText)
                    });
                    break;
                }
            }
        }

        return indexes;
    }

    /**
     * Fetches current commodity and material prices.
     * Source: finanzen.net commodities table
     *
     * @returns Array of material names and prices
     */
    async fetchMaterialData(): Promise<StringNumberPair[]> {
        DomainUtils.log("SERVICES fetch: Fetching material data");

        const html = await this.fetchWithCache(
            FETCH.FNET.MATERIALS,
            FETCH.FNET.MATERIALS
        );
        const doc = await this.parseHTML(html);
        const rows = doc.querySelectorAll("#commodity_prices > table > tbody tr");

        const materials: StringNumberPair[] = [];
        for (const row of rows) {
            const nameCell = row.children[0];
            const valueCell = row.children[1];

            if (nameCell?.tagName === "TD" && valueCell) {
                const name = nameCell.textContent?.trim();
                const value = DomainUtils.toNumber(valueCell.textContent);

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
    async fetchIsOk(): Promise<boolean> {
        try {
            const response = await this.fetchWithRetry(FETCH.FNET.ONLINE_TEST);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Clears all cached fetch results.
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Returns cache statistics for monitoring and debugging.
     *
     * @returns Object containing cache metrics (hits, misses, size, etc.)
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Creates a promise that resolves after the specified delay.
     * Used for retry backoff logic.
     * @private
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Parses currency code or symbol from text into standardized currency code.
     * @private
     * @param code - Text containing currency information
     * @returns Standardized currency code (USD, EUR, or default)
     */
    private parseCurrency(code: string): string {
        if (code.includes("USD") || code.includes("$")) {
            return "USD";
        }

        if (code.includes("EUR") || code.includes("€") || code.includes("â‚¬")) {
            return "EUR";
        }

        return FETCH.DEFAULT_CURRENCY;
    }

    /**
     * Extracts rate and currency from the finanzen.net document.
     * @private
     */
    private extractFnetRateAndCurrency(doc: Document): {
        rate: string;
        currency: string;
    } {
        const SEARCH_RESULT_SELECTOR = "#snapshot-value-fst-current-0 > span";

        const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);

        if (nodes.length < 2) {
            return {rate: FETCH.DEFAULT_VALUE, currency: FETCH.DEFAULT_CURRENCY};
        }

        return {
            rate: nodes[0]?.textContent?.trim() || FETCH.DEFAULT_VALUE,
            currency: nodes[1]?.textContent?.trim() || FETCH.DEFAULT_CURRENCY
        };
    }

    /**
     * Extracts min and max from the finanzen.net document.
     * @private
     */
    private extractFnetMinMax(doc: Document): { min: string; max: string } {
        const SEARCH_RESULT_SELECTOR = "main div[class=accordion__content]";

        const nodes = doc.querySelectorAll(SEARCH_RESULT_SELECTOR);

        if (nodes.length === 0) {
            return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
        }

        const rows = nodes[0].querySelectorAll("table > tbody > tr");

        for (const row of rows) {
            if (row.textContent?.includes(FETCH.TARGET_PERIOD)) {
                const cells = row.querySelectorAll("td");
                return {
                    min: cells[3]?.textContent?.trim() || FETCH.DEFAULT_VALUE,
                    max: cells[4]?.textContent?.trim() || FETCH.DEFAULT_VALUE
                };
            }
        }

        return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
    }

    /**
     * Extracts detail URL from tagesschau.de document.
     * @private
     */
    private extractArdDetailUrl(doc: Document): string | null {
        const DATA_TABLE_SELECTOR = "#desktopSearchResult > table > tbody > tr";

        const rows = doc.querySelectorAll(DATA_TABLE_SELECTOR);

        if (rows.length === 0) {
            return null;
        }

        const onclickAttr = rows[0].getAttribute("onclick");

        if (!onclickAttr) {
            return null;
        }

        // Extract URL from the onclick attribute
        return onclickAttr.replace("document.location='", "").replace("';", "");
    }

    /**
     * Extracts rate, min, max, and currency from the tagesschau.de document.
     * @private
     */
    private extractArdStockData(doc: Document): FetchResult {
        const DATA_TABLE_SELECTOR = "#USFkursdaten table > tbody tr";

        const rows = doc.querySelectorAll<HTMLTableRowElement>(DATA_TABLE_SELECTOR);

        if (rows.length < 8) {
            return {
                rate: FETCH.DEFAULT_VALUE,
                min: FETCH.DEFAULT_VALUE,
                max: FETCH.DEFAULT_VALUE,
                currency: FETCH.DEFAULT_CURRENCY
            };
        }

        const cleanCell = (row: HTMLTableRowElement, cellIndex: number): string => {
            return (row.cells[cellIndex]?.textContent ?? FETCH.DEFAULT_VALUE).replace(
                FETCH.DEFAULT_CURRENCY_SYMBOL,
                ""
            );
        };

        return {
            rate: cleanCell(rows[0], 1),
            min: cleanCell(rows[6], 1),
            max: cleanCell(rows[7], 1),
            currency: FETCH.DEFAULT_CURRENCY
        };
    }

    private createDefaultStockData(id: number): StockMarketData {
        return {
            id,
            isin: "",
            rate: FETCH.DEFAULT_VALUE,
            min: FETCH.DEFAULT_VALUE,
            max: FETCH.DEFAULT_VALUE,
            cur: FETCH.DEFAULT_CURRENCY
        };
    }

    private buildWStreetDetailUrl(responseJson: unknown): string {
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
        return baseUrl + detailPath;
    }

    private extractWStreetStockData(doc: Document): FetchResult {
        const rate = this.extractWStreetRate(doc);
        const {min, max} = this.extractWStreetMinMax(doc);
        const currency = this.parseCurrency(rate);

        return {
            rate,
            min,
            max,
            currency
        };
    }

    private extractWStreetRate(doc: Document): string {
        const RATE_TABLE_SELECTOR = "div.c2 table";

        const tables = doc.querySelectorAll(RATE_TABLE_SELECTOR);

        if (tables.length === 0) {
            return FETCH.DEFAULT_VALUE;
        }

        const rows = tables[0].querySelectorAll("tr");

        if (rows.length < 2) {
            return FETCH.DEFAULT_VALUE;
        }

        const cells = rows[1].querySelectorAll("td");

        return cells[1]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
    }

    private extractWStreetMinMax(doc: Document): { min: string; max: string } {
        const FUNDAMENTAL_SELECTOR = "div.fundamental > div > div.float-start";

        const nodes = doc.querySelectorAll(FUNDAMENTAL_SELECTOR);

        if (nodes.length < 2) {
            return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
        }

        const text = nodes[1]?.textContent ?? "";

        // Parse format: "...WochenTief[min]Hoch[max]..."
        const parts = text.split("Hoch");

        if (parts.length < 2) {
            return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
        }

        const max = parts[1]?.trim() ?? FETCH.DEFAULT_VALUE;
        const minParts = parts[0].split("WochenTief");
        const min =
            minParts.length > 1
                ? (minParts[1]?.trim() ?? FETCH.DEFAULT_VALUE)
                : FETCH.DEFAULT_VALUE;

        return {min, max};
    }

    private extractGoyaxStockData(doc: Document): FetchResult {
        const rate = this.extractGoyaxRate(doc);
        const {min, max} = this.extractGoyaxMinMax(doc);

        return {
            rate,
            min,
            max,
            currency: FETCH.DEFAULT_CURRENCY
        };
    }

    private extractGoyaxRate(doc: Document): string {
        const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";

        try {
            const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);

            if (nodes.length < 2) {
                return FETCH.DEFAULT_VALUE;
            }

            const listRows = nodes[1].querySelectorAll("ul.list-rows");

            if (listRows.length < 2) {
                return FETCH.DEFAULT_VALUE;
            }

            const listItems = listRows[1].querySelectorAll("li");

            if (listItems.length < 4) {
                return FETCH.DEFAULT_VALUE;
            }

            const rateText = listItems[3].textContent ?? FETCH.DEFAULT_VALUE;

            // Parse format: "...(xxx)rate"
            const parts = rateText.split(")");

            return parts.length > 1
                ? (parts[1]?.trim() ?? FETCH.DEFAULT_VALUE)
                : FETCH.DEFAULT_VALUE;
        } catch {
            return FETCH.DEFAULT_VALUE;
        }
    }

    private extractGoyaxMinMax(doc: Document): { min: string; max: string } {
        const OVERVIEW_SELECTOR = "div#instrument-ueberblick > div";

        try {
            const nodes = doc.querySelectorAll(OVERVIEW_SELECTOR);

            if (nodes.length === 0) {
                return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
            }

            const tables = nodes[0].querySelectorAll("table");

            if (tables.length < 2) {
                return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
            }

            const rows = tables[1].querySelectorAll("tr");

            if (rows.length < 6) {
                return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
            }

            const maxCells = rows[4].querySelectorAll("td");
            const minCells = rows[5].querySelectorAll("td");

            const max = maxCells[3]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            const min = minCells[3]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;

            return {min, max};
        } catch {
            return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
        }
    }

    private extractAcheckStockData(doc: Document): FetchResult {
        const CONTENT_TABLE_SELECTOR = "#content table";
        const MIN_REQUIRED_TABLES = 3;

        const tables = doc.querySelectorAll(CONTENT_TABLE_SELECTOR);

        if (tables.length < MIN_REQUIRED_TABLES) {
            return {
                rate: FETCH.DEFAULT_VALUE,
                min: FETCH.DEFAULT_VALUE,
                max: FETCH.DEFAULT_VALUE,
                currency: FETCH.DEFAULT_CURRENCY
            };
        }

        const rate = this.extractAcheckRate(tables[0]);
        const currencySymbol = this.extractAcheckCurrencySymbol(tables[0]);
        const {min, max} = this.extractAcheckMinMax(tables[2]);
        const currency = this.parseCurrency(currencySymbol);

        return {rate, min, max, currency};
    }

    private extractAcheckRate(table: Element): string {
        const RATE_ROW = 1;
        const RATE_CELL = 1;

        try {
            const rows = table.querySelectorAll("tr");

            if (rows.length < RATE_ROW + 1) {
                return FETCH.DEFAULT_VALUE;
            }

            const cells = rows[RATE_ROW].querySelectorAll("td");

            return cells[RATE_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
        } catch {
            return FETCH.DEFAULT_VALUE;
        }
    }

    private extractAcheckCurrencySymbol(table: Element): string {
        const CURRENCY_ROW = 1;
        const CURRENCY_CELL = 2;

        try {
            const rows = table.querySelectorAll("tr");

            if (rows.length < CURRENCY_ROW + 1) {
                return FETCH.DEFAULT_VALUE;
            }

            const cells = rows[CURRENCY_ROW].querySelectorAll("td");

            return cells[CURRENCY_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
        } catch {
            return FETCH.DEFAULT_VALUE;
        }
    }

    private extractAcheckMinMax(table: Element): { min: string; max: string } {
        const MINMAX_ROW = 3;
        const MAX_CELL = 1;
        const MIN_CELL = 2;

        try {
            const rows = table.querySelectorAll("tr");

            if (rows.length < MINMAX_ROW + 1) {
                return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
            }

            const cells = rows[MINMAX_ROW].querySelectorAll("td");

            const max = cells[MAX_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;
            const min = cells[MIN_CELL]?.textContent?.trim() ?? FETCH.DEFAULT_VALUE;

            return {min, max};
        } catch {
            return {min: FETCH.DEFAULT_VALUE, max: FETCH.DEFAULT_VALUE};
        }
    }

    private extractTgateStockData(doc: Document): { rate: string } {
        const ASK_SELECTOR = "#ask";
        const BID_SELECTOR = "#bid";

        const ask =
            doc.querySelector(ASK_SELECTOR)?.textContent?.trim() ??
            FETCH.DEFAULT_VALUE;
        const bid =
            doc.querySelector(BID_SELECTOR)?.textContent?.trim() ??
            FETCH.DEFAULT_VALUE;

        const rate = this.calculateMidQuote(bid, ask);

        return {rate};
    }

    private calculateMidQuote(bid: string, ask: string): string {
        try {
            const bidNumber = DomainUtils.toNumber(bid);
            const askNumber = DomainUtils.toNumber(ask);

            // If either value is invalid, return default
            if (!Number.isFinite(bidNumber) || !Number.isFinite(askNumber)) {
                return FETCH.DEFAULT_VALUE;
            }

            const midQuote = DomainUtils.mean([bidNumber, askNumber]);

            return midQuote.toString();
        } catch {
            return FETCH.DEFAULT_VALUE;
        }
    }
}

/**
 * Creates a singleton instance of the fetch service and exports it.
 */
export const fetchService = new FetchService();

DomainUtils.log("SERVICES fetch");
