/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {BROWSER_STORAGE, CACHE_POLICY, ERROR_CATEGORY, FETCH, SETTINGS} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import type {
    CompanyData,
    DateData,
    ExchangeData,
    NumberStringPair,
    OnlineStorageData,
    ServiceName,
    StockMarketData,
    StorageDataType,
    StringNumberPair
} from "@/domain/types";
import {log, toNumber} from "@/domain/utils/utils";

import {clearCache, getCache, getCacheStats, setCache} from "@/adapters/secondary/fetch/cache";
import {fetchTextWithCacheFollowRedirect, fetchWithCache, fetchWithRetry, parseHTML} from "@/adapters/secondary/fetch/http";
import {acheckFetcher} from "@/adapters/secondary/fetch/providers/acheck";
import {ardFetcher, sanitizeArdDetailUrlFromOnclick} from "@/adapters/secondary/fetch/providers/ard";
import {fnetFetcher} from "@/adapters/secondary/fetch/providers/fnet";
import {goyaxFetcher} from "@/adapters/secondary/fetch/providers/goyax";
import {tgateFetcher} from "@/adapters/secondary/fetch/providers/tgate";
import {wstreetFetcher} from "@/adapters/secondary/fetch/providers/wstreet";

const FNET = {
    INDEXES: "https://www.finanzen.net/indizes/",
    DATES: "https://www.finanzen.net/termine/",
    MATERIALS: "https://www.finanzen.net/rohstoffe/",
    ONLINE_TEST: "https://www.finanzen.net",
    SEARCH: "https://www.finanzen.net/suchergebnis.asp?_search="
};
const FX = {
    NAME: "fx-rate",
    QUOTE: "https://fx-rate.net/calculator/?c_input="
};

export type FetchService = ReturnType<typeof createFetchService>;

export {clearCache, fetchWithRetry, getCache, getCacheStats, setCache};
export {fetchTextWithCacheFollowRedirect, fetchWithCache, parseHTML};
export {sanitizeArdDetailUrlFromOnclick};

export function createFetchService() {
    return {
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
}

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
 * Fetches upcoming company event dates (general meetings, quarterly reports).
 *
 * @param obj - Array of company identifiers and search terms
 * @param options
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
                    CACHE_POLICY.DEFAULT_HTTP_TTL_MS,
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

    const results = await Promise.allSettled(
        exchangeCodes.map(async (code): Promise<ExchangeData> => {
            const url = `${FX.QUOTE}${code.substring(
                0,
                3
            )}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await fetchWithCache(url);
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

    const html = await fetchWithCache(FNET.INDEXES);
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

/**
 * Fetches current commodity and material prices.
 *
 * @returns Array of material names and prices
 */
export async function fetchMaterialData(): Promise<StringNumberPair[]> {
    log("SERVICES fetch: Fetching material data");

    const html = await fetchWithCache(FNET.MATERIALS);
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
 * Fetches current stock market data (rate, min, max) for multiple securities.
 *
 * @param storageOnline - Array of online storage items containing ISINs
 * @param getStorage - Function to retrieve browser storage data
 * @param options
 * @returns Array of stock market data with normalized values
 * @throws {@link AppError} When service is invalid or fetcher not found
 */
export async function fetchMinRateMaxData(
    storageOnline: OnlineStorageData[],
    getStorage: (_keys?: string[] | null) => Promise<StorageDataType>,
    options?: { signal?: AbortSignal }
): Promise<{ data: (StockMarketData | null)[]; failedIsins: string[] }> {
    if (storageOnline.length === 0) {
        return {data: [], failedIsins: []};
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

    const settled = await Promise.allSettled(
        urls.map((urlObj) => fetcher([urlObj], options).then((arr) => arr[0]!))
    );

    // If the caller's signal was aborted, propagate as AbortError so callers
    // handle it cleanly — avoids spurious "failed to receive data" alerts for
    // fetches that were canceled by navigation, not by a real network error.
    if (options?.signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        throw err;
    }

    const failedIsins = settled
        .map((r, i) => r.status === "rejected" ? storageOnline[i].isin : null)
        .filter((v): v is string => v !== null);

    const data = settled.map((r) =>
        r.status === "fulfilled" ? r.value : null
    );

    return {data, failedIsins};
}

const serviceFetchers: Record<ServiceName, typeof ardFetcher> = {
    acheck: acheckFetcher,
    ard: ardFetcher,
    fnet: fnetFetcher,
    goyax: goyaxFetcher,
    tgate: tgateFetcher,
    wstreet: wstreetFetcher
};