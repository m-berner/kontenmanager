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
    MarketDataServiceName,
    NumberStringPair,
    OnlineStorageData,
    ServiceName,
    StockMarketData,
    StorageDataType,
    StringNumberPair
} from "@/domain/types";
import {log, toNumber} from "@/domain/utils/utils";

import {clearCache, getCache, getCacheStats, setCache} from "@/adapters/driven/fetch/httpCache";
import {
    fetchTextWithCacheFollowRedirect,
    fetchWithCache,
    fetchWithRetry,
    parseHTML
} from "@/adapters/driven/fetch/httpClient";
import {acheckFetcher} from "@/adapters/driven/fetch/providers/acheck";
import {ardFetcher, sanitizeArdDetailUrlFromOnclick} from "@/adapters/driven/fetch/providers/ard";
import {fnetFetcher} from "@/adapters/driven/fetch/providers/fnet";
import {goyaxFetcher} from "@/adapters/driven/fetch/providers/goyax";
import {tgateFetcher} from "@/adapters/driven/fetch/providers/tgate";
import {wstreetFetcher} from "@/adapters/driven/fetch/providers/wstreet";
import {fetchIndexDataWstreet} from "@/adapters/driven/fetch/providers/wstreetIndexes";
import {fetchMaterialDataWstreet} from "@/adapters/driven/fetch/providers/wstreetMaterials";

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

/**
 * Budget for the whole connectivity probe. Deliberately far below
 * `fetchWithRetry`'s 30 s: this answers a decorative status icon that renders as
 * "no connection" while it waits, so a slow answer is worse than a wrong one.
 */
const CONNECTIVITY_PROBE_TIMEOUT_MS = 5_000;

export type FetchAdapter = ReturnType<typeof createFetchAdapter>;

export {clearCache, fetchWithRetry, getCache, getCacheStats, setCache};
export {fetchTextWithCacheFollowRedirect, fetchWithCache, parseHTML};
export {sanitizeArdDetailUrlFromOnclick};

export function createFetchAdapter() {
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
        // Gracefully degrade in environments without a configured service.
        return {company: "", symbol: ""};
    }

    {
        const html = await fetchTextWithCacheFollowRedirect(service.QUOTE + isin);
        const doc = await parseHTML(html);

        const col1 = doc.querySelector("#col1_content");
        const companyRaw =
            col1?.querySelector("h1")?.textContent ??
            col1?.querySelector("h2")?.textContent ??
            col1?.textContent ??
            "";
        const company = companyRaw.split(/[,\n\r]/)[0]?.trim() || "";

        // Prefer label-based extraction for resilience against layout changes.
        // Real tradegate.de markup is a header-row+data-row table (WKN/Kürzel/
        // ISIN/Handelswährung), not label:value row pairs - match the header
        // cell's text to find which data column holds the symbol ("Kürzel").
        let symbol = "";
        // Scope to col1_content's first table specifically (the WKN/Kürzel/
        // ISIN table) - col1_content also contains several unrelated
        // Bid/Ask market-data tables further down, so a plain "table tr"
        // scan across the whole container would silently mix rows from
        // different tables together.
        const col1Rows = col1?.querySelector("table")?.querySelectorAll<HTMLTableRowElement>("tr") ?? [];
        const headerRow = col1Rows[0];
        if (headerRow) {
            const headerCells = Array.from(headerRow.cells);
            const symbolColumnIndex = headerCells.findIndex((cell) => {
                const label = cell.textContent?.trim().toLowerCase() ?? "";
                return label.includes("kürzel") || label.includes("symbol");
            });
            if (symbolColumnIndex !== -1) {
                symbol = col1Rows[1]?.cells[symbolColumnIndex]?.textContent?.trim() || "";
            }
        }
        // Fallback for older/unrecognized markup: fixed row/column within the
        // same scoped table (never falls back to a document-global table).
        if (!symbol && col1Rows.length > 1) {
            symbol = col1Rows[1]?.cells[1]?.textContent?.trim() || "";
        }

        // A page that loaded but simply carries no company/symbol still returns
        // blanks — that is a legitimate "not found", not a failure.
        //
        // Fetch and parse failures are NOT caught here any more. Swallowing
        // every error made a network failure, a 404 and "this page has no
        // symbol" indistinguishable to the caller, which left StockForm.vue's
        // dedicated ISIN-lookup error branch permanently unreachable: a lookup
        // that failed for an infrastructure reason silently looked like "no
        // data found". StockForm already clears the fields and alerts the user
        // on a rejection, which is the intended behaviour.
        return {company: company || "", symbol: symbol || ""};
    }
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

    // A per-entry `null` means "the lookup FAILED", which callers must treat
    // differently from a successful lookup that simply found no dates
    // ({gm: 0, qf: 0}). Previously every failure was swallowed here and still
    // returned a well-formed {gm: 0, qf: 0}, so useOnlineStockData could not
    // tell the two apart: it overwrote the stock's stored cMeetingDay/
    // cQuarterDay with DATE.ISO ("1970-01-01"), persisted that, and pushed
    // cAskDates 7 days out — destroying correct stored dates on a transient
    // network blip and then refusing to retry for a week. Failed entries are
    // dropped from the result so `dateResponse.find(...)` misses them and the
    // consumer leaves the stock untouched.
    const settled = await Promise.all(
        obj.map(async (entry: NumberStringPair): Promise<DateData | null> => {
            const gmqf = {gm: 0, qf: 0};

            const searchUrl = `${FNET.SEARCH}${entry.value}`;
            // Prefixed like `redirectCacheKey` below, to keep this bare-flag
            // cache entry out of the shared HTTP-text cache's key namespace.
            // Remembers a failed lookup for CACHE_POLICY.DATE_LOOKUP_FAILURE_TTL_MS
            // so a host-level failure (e.g. finanzen.net's Akamai protection
            // hard-403ing the extension) does not cost a fresh network
            // request for every affected stock on every page load/reload —
            // there was previously no backoff at all, only the (correct, but
            // separate) refusal to overwrite stored dates with a failure.
            const failureCacheKey = `datefail:${searchUrl}`;
            if (getCache(failureCacheKey, CACHE_POLICY.DATE_LOOKUP_FAILURE_TTL_MS)) {
                return null;
            }

            try {
                // Prefixed to keep this URL-string cache entry out of the
                // shared HTTP-text cache's key namespace (used elsewhere for
                // cached HTML bodies, not bare URLs).
                const redirectCacheKey = `redirect:${searchUrl}`;
                const cachedRedirectUrl = getCache(redirectCacheKey, CACHE_POLICY.DEFAULT_HTTP_TTL_MS);
                let redirectUrl: string;
                if (cachedRedirectUrl) {
                    redirectUrl = cachedRedirectUrl;
                } else {
                    const searchResponse = await fetchWithRetry(searchUrl, {signal: options?.signal});
                    redirectUrl = searchResponse.url;
                    setCache(redirectCacheKey, redirectUrl);
                }
                const atoms = redirectUrl.split("/");
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
                    const rowType = row.cells[0]?.textContent?.trim();

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
                // A cancellation is NOT a failed lookup, and must not arm the
                // backoff below. `fetchWithRetry` rethrows immediately on
                // caller abort, and aborts here are routine rather than
                // exceptional: `CompanyContent`'s `startOnlineLoad()` aborts
                // the previous controller on every `onCurrentItems` emission —
                // a page change, a re-sort, any change to the rendered row set
                // — and on the FX-divisor watcher. Caching those would let one
                // ordinary pagination click suppress meeting/quarter-date
                // lookups for every in-flight stock for the next ten minutes,
                // which is the opposite of what the backoff is for.
                //
                // `fetchMinRateMaxData` already special-cases the same class
                // (see its `signal.aborted` check); this path was the one that
                // missed it, and it also persisted the mistake.
                //
                // Still returns null — "no result", so the caller leaves the
                // stock's stored dates untouched — just without the marker.
                //
                // The caller's own signal is the whole test, and it is exact
                // rather than approximate. Every network call on this path goes
                // through `fetchWithRetry`, which rethrows a raw AbortError in
                // one case only: `controller.signal.aborted && reason !==
                // timeoutReason`, i.e. caller cancellation. Its own 30 s
                // timeout aborts the INTERNAL controller with an AppError
                // reason and is deliberately excluded there, so a timeout still
                // arrives here as an ordinary failure and still arms the
                // backoff — which is right, a timeout being a real failure.
                // Sniffing `error.name` as well would add a branch that cannot
                // be reached independently of this one.
                if (options?.signal?.aborted) {
                    log(
                        "SERVICES fetch: date data fetch aborted",
                        {entry},
                        "info"
                    );
                    return null;
                }
                log(
                    "SERVICES fetch: Failed to fetch date data",
                    {entry, error},
                    "warn"
                );
                setCache(failureCacheKey, "1", CACHE_POLICY.DATE_LOOKUP_FAILURE_TTL_MS);
                // Do NOT fall through to the success return below: the caller
                // would read {gm: 0, qf: 0} as "this stock genuinely has no
                // dates" and wipe whatever it already had stored.
                return null;
            }

            return {key: entry.key, value: gmqf};
        })
    );

    return settled.filter((entry): entry is DateData => entry !== null);
}

/**
 * Fetches current exchange rates for currency pairs.
 *
 * @param exchangeCodes - Array of 6-character currency pair codes (e.g., 'USDEUR')
 * @returns Array of exchange rates, filtering out failed requests
 */
export async function fetchExchangesData(
    exchangeCodes: string[],
    options?: { signal?: AbortSignal }
): Promise<ExchangeData[]> {
    if (exchangeCodes.length === 0) return [];

    const results = await Promise.allSettled(
        exchangeCodes.map(async (code): Promise<ExchangeData> => {
            const url = `${FX.QUOTE}${code.substring(
                0,
                3
            )}&cp_input=${code.substring(3, 6)}&amount_from=1`;
            const html = await fetchWithCache(url, CACHE_POLICY.DEFAULT_HTTP_TTL_MS, {signal: options?.signal});
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
            // fx-rate.net renders very small rates in scientific notation
            // (e.g. "3.80749993431E-5" for low-value currencies like VND/IDR/
            // IRR) - the exponent suffix must be captured, or a naive
            // decimal-only match silently truncates to the mantissa and
            // Number.parseFloat returns a value ~10^5 too large.
            const rateMatch = rateString?.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
            if (!rateMatch) {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.FETCH.J.CODE,
                    ERROR_CATEGORY.NETWORK,
                    false,
                    {code, rateString}
                );
            }
            const rate = Number.parseFloat(rateMatch[0]);

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
 * @param options
 * @param provider - Which site to scrape. "fnet" (finanzen.net, the
 *        long-standing default) reads a single overview page; "wstreet"
 *        (wallstreet-online.de) is a per-index alternative added for the
 *        same reason `fetchMaterialData` got one — see
 *        `fetchIndexDataWstreet` for its own caveats.
 * @returns Array of index names and current values
 */
export async function fetchIndexData(
    options?: { signal?: AbortSignal },
    provider: MarketDataServiceName = "fnet"
): Promise<StringNumberPair[]> {
    if (provider === "wstreet") {
        return fetchIndexDataWstreet(options);
    }

    log("SERVICES fetch: Fetching index data");

    const html = await fetchWithCache(FNET.INDEXES, CACHE_POLICY.DEFAULT_HTTP_TTL_MS, {signal: options?.signal});
    const doc = await parseHTML(html);
    const links = doc.querySelectorAll(".index-world-map a");

    // A link with no `title` cannot identify an index and is dropped up front.
    // `getAttribute` returns null when the attribute is absent, and the old
    // `title || ""` fallback turned the membership test into
    // `"DAX".includes("")` — which is `true`. One untitled link carrying any
    // parseable number therefore matched the first index property tested, and,
    // since it matched every other property just as well, would have filled all
    // configured indexes with that single value.
    //
    // Titles are trimmed and case-folded here rather than compared raw: the
    // comparison used to be neither, so a title differing from its label only in
    // case or padding did not match at all.
    const titledLinks = [...links]
        .map((link) => ({link, title: link.getAttribute("title")?.trim().toLowerCase() ?? ""}))
        .filter((entry) => entry.title !== "");

    const indexes: StringNumberPair[] = [];
    // A link may be claimed by at most ONE index. The fallback below is a
    // containment test, so a short scraped title can satisfy several configured
    // labels — "S&P" is contained in both "S&P 500" and "S&P/TSX" — and the old
    // loop took the first link each property matched independently, so one
    // link's value could be reported as the current level of two different
    // indexes.
    const claimed = new Set<Element>();

    for (const property of Object.keys(SETTINGS.INDEXES)) {
        const label = (SETTINGS.INDEXES[property] ?? "").trim().toLowerCase();
        if (label === "") continue;

        const candidates = titledLinks.filter((entry) => !claimed.has(entry.link));
        // An exact title wins over a merely-contained one, and is looked for
        // across ALL candidates before falling back — rather than accepting
        // whichever partial match happened to appear earliest in the document.
        const match =
            candidates.find((entry) => entry.title === label) ??
            candidates.find((entry) => label.includes(entry.title));
        if (!match) continue;

        // finanzen.net markup changes occasionally; be resilient:
        // - sometimes value is in a nested element
        // - sometimes it's included directly in the link text
        const valueText =
            match.link.querySelector(":scope > *")?.textContent ??
            match.link.textContent ??
            "";
        const numberText = valueText.match(/[-+]?\d[\d.,]*/)?.[0] ?? "";
        if (!numberText) continue;

        claimed.add(match.link);
        indexes.push({
            key: property,
            // Locale pinned to "de", matching every sibling that reads this same
            // host: `providers/fnet.ts` runs `normalizeNumber(value, "de")` on
            // finanzen.net markup, and ard/wstreet/goyax pin their (equally
            // German) sources too. Bare `toNumber` fell through to
            // `detectNumberFormat`, whose one-dot-no-comma branch reads "24.123"
            // as English — so a DAX quoted without decimals came back as 24.123
            // and `InfoBar`'s `n(value, "integer")` rendered it as "24".
            value: toNumber(numberText, {locale: "de"})
        });
    }

    return indexes;
}

/**
 * Tests internet connectivity by attempting to reach a known endpoint.
 *
 * **Any HTTP response means we are online — including a rejection.** This used
 * to go through `fetchWithRetry` and return `response.ok`, which conflated two
 * different facts: "there is no internet" and "that one server refused us".
 * finanzen.net sits behind Akamai bot protection and answers an extension's
 * fetch (no site cookies, a `moz-extension://` origin) with a flat
 * `403 Forbidden` + `Set-Cookie: Bot-Information=…` — every path, not just this
 * one. `fetchWithRetry` treats 403 as final, threw, and TitleBar showed the
 * "disconnected" icon permanently to a user whose connection was fine. A 403 is
 * proof of connectivity: the packets reached Akamai and came back. Only a
 * request that never completes at all — DNS failure, no route, timeout — says
 * anything about the network.
 *
 * `fetchWithRetry` is bypassed for the same reason: its retry ladder exists to
 * turn a flaky request into a good response, and this probe does not need a good
 * response. Retrying a 403 three times over 3 s only delays the answer.
 *
 * @returns True if the endpoint answered at all, false if the request could not
 *          complete
 */
export async function fetchIsOk(options?: { signal?: AbortSignal }): Promise<boolean> {
    // Free, request-free negative. `false` is authoritative (the OS reports no
    // network); `true` means nothing on its own, so it only short-circuits the
    // failure case.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECTIVITY_PROBE_TIMEOUT_MS);
    const callerSignal = options?.signal;
    const onCallerAbort = () => controller.abort();
    if (callerSignal?.aborted) {
        controller.abort();
    } else {
        callerSignal?.addEventListener("abort", onCallerAbort, {once: true});
    }

    try {
        // `HEAD`, because the body is never read: a `GET` downloaded the entire
        // finanzen.net homepage on every app start and discarded it. A server
        // that refuses HEAD answers 405, which still proves the point.
        await fetch(FNET.ONLINE_TEST, {method: "HEAD", signal: controller.signal});
        return true;
    } catch (err) {
        // This is a non-critical connectivity probe; callers only need a boolean.
        void err;
        return false;
    } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", onCallerAbort);
    }
}

/**
 * Fetches current commodity and material prices.
 *
 * @param options
 * @param provider - Which site to scrape. "fnet" (finanzen.net, the
 *        long-standing default) reads a single overview table; "wstreet"
 *        (wallstreet-online.de) is a per-material alternative added because
 *        finanzen.net sits behind Akamai bot protection that intermittently
 *        403s this call — see `fetchMaterialDataWstreet` for its own caveats
 *        (notably: two commodities it cannot supply a USD price for at all).
 * @returns Array of material names and prices
 */
export async function fetchMaterialData(
    options?: { signal?: AbortSignal },
    provider: MarketDataServiceName = "fnet"
): Promise<StringNumberPair[]> {
    if (provider === "wstreet") {
        return fetchMaterialDataWstreet(options);
    }

    log("SERVICES fetch: Fetching material data");

    const html = await fetchWithCache(FNET.MATERIALS, CACHE_POLICY.DEFAULT_HTTP_TTL_MS, {signal: options?.signal});
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

            if (name && numberText) {
                // Locale pinned to "de" for the same reason as
                // `fetchIndexData` above: this is finanzen.net markup, and
                // auto-detection misreads a decimal-less thousands value
                // ("2.650" -> 2.65, rendered by InfoBar as "2,65 €").
                materials.push({key: name, value: toNumber(numberText, {locale: "de"})});
            } else if (name) {
                // Row matched but no parseable number in the value cell (e.g. a
                // temporarily missing quote, or the price column shifted after a
                // markup change) - skip instead of silently reporting a phantom
                // 0 price for this material.
                log(
                    "SERVICES fetch: fetchMaterialData could not parse value",
                    {name, valueText},
                    "warn"
                );
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

    // Test/E2E mode: when service is disabled, do not perform any network calls
    if (serviceName === "none") {
        log("SERVICES fetch: service=none; skipping min/rate/max fetch");
        return {data: [], failedIsins: []};
    }
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

    // No non-null assertion on `arr[0]`: a fetcher that resolved an empty array
    // would put `undefined` into `data` despite the declared
    // `(StockMarketData | null)[]`. Consumers only guard with `if (data)`, so it
    // happened to work — but the assertion was a type lie of exactly the shape
    // that hides real defects. Normalize a missing entry to `null` instead.
    const settled = await Promise.allSettled(
        urls.map((urlObj) => fetcher([urlObj], options).then((arr) => arr[0] ?? null))
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

const serviceFetchers: Partial<Record<ServiceName, typeof ardFetcher>> = {
    acheck: acheckFetcher,
    ard: ardFetcher,
    fnet: fnetFetcher,
    goyax: goyaxFetcher,
    tgate: tgateFetcher,
    wstreet: wstreetFetcher
};