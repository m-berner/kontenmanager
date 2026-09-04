/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CACHE_POLICY, FETCH, SETTINGS} from "@/domain/constants";
import type {StringNumberPair} from "@/domain/types";
import {log, toNumber} from "@/domain/utils/utils";

import {fetchWithCache, parseHTML} from "@/adapters/driven/fetch/httpClient";

/**
 * Maps this app's index keys (`SETTINGS.INDEXES`) to wallstreet-online.de's
 * per-index page slugs under `/indizes/`.
 *
 * Every key currently configured in `SETTINGS.INDEXES` has an entry here.
 * "straits" (Straits Times), "asx" (Australia All Ordinaries) and "rts"
 * (RTS) are deliberately absent, and were dropped from the app rather than
 * partially supported: wallstreet-online.de has no page at all for the
 * first two searched, and no live quote box for the third — checked as of
 * 2026-09.
 */
const WSTREET_INDEX_SLUGS: Readonly<Record<string, string>> = {
    dax: "dax",
    dow: "dowjones",
    nasdaq: "nasdaq-composite",
    nikkei: "nikkei225",
    hang: "hang-seng",
    ibex: "ibex-35-index",
    bovespa: "indice-bovespa",
    sensex: "mumbai-stock-exchange-sensitive-index-30-leading-stocks",
    sci: "cnm000000019-composite-index",
    ftse: "ftse-100",
    smi: "smi",
    cac: "cac-40",
    stoxx: "euro-stoxx-50",
    tsx: "s-p-tsx-60-index",
    sp: "s-p-500-index"
};

/**
 * Reads the current level from a fetched wallstreet-online.de index page.
 *
 * **Scoped to `#quoteBoxMarker`, not a document-global `.quoteValue`
 * lookup** — this is the exact bug `fetchMaterialDataWstreet`'s currency
 * check hit: every one of these pages also carries a "Kursleiste"
 * ticker-ribbon widget (other indexes) above the page's own quote box.
 * That widget's value spans carry no `quoteValue` class of their own, so an
 * unscoped `.quoteValue` lookup happens not to collide today — but its
 * `.quote_currency` spans DO (used there for the %-change figure), which is
 * exactly what emptied the materials InfoBar. There is no currency check
 * needed here at all: unlike materials, index levels are plain points, not
 * a value InfoBar treats as a currency amount — `fetchIndexData`'s
 * finanzen.net path never captured or checked one either. Scoping
 * everything to `#quoteBoxMarker` regardless keeps this file from being the
 * next place that same document-global-lookup mistake gets made.
 *
 * Returns `null` for anything unparseable, matching `fetchIndexData`'s
 * finanzen.net path, which drops a match with no parseable number instead
 * of reporting a phantom 0.
 */
function parseWstreetIndexPage(doc: Document): number | null {
    const quoteBox = doc.querySelector("#quoteBoxMarker");
    if (!quoteBox) return null;

    const raw = quoteBox.querySelector(".quoteValue span")?.textContent?.trim() ?? "";
    if (!raw) return null;

    const value = toNumber(raw, {locale: "de"});
    return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Fetches current index levels from wallstreet-online.de.
 *
 * Unlike finanzen.net's single overview page, this is one request per
 * configured index — `Promise.allSettled` so one bad/blocked page does not
 * take the rest down with it.
 *
 * @returns Array of index levels keyed by the SHORT `SETTINGS.INDEXES` key
 *          (e.g. "dax"), matching `fetchIndexData`'s finanzen.net path —
 *          NOT the display label, unlike `fetchMaterialDataWstreet`, which
 *          keys by label because that is what `fetchMaterialData`'s
 *          finanzen.net path already does for materials.
 */
export async function fetchIndexDataWstreet(
    options?: { signal?: AbortSignal }
): Promise<StringNumberPair[]> {
    log("SERVICES fetch: Fetching index data (wstreet)");

    const home = FETCH.PROVIDERS["wstreet"]?.HOME ?? "";
    if (!home) return [];

    const entries = Object.keys(SETTINGS.INDEXES)
        .map((key) => ({key, slug: WSTREET_INDEX_SLUGS[key]}))
        .filter((entry): entry is { key: string; slug: string } => Boolean(entry.slug));

    const settled = await Promise.allSettled(
        entries.map(async (entry): Promise<StringNumberPair> => {
            const url = `${home}/indizes/${entry.slug}`;
            const html = await fetchWithCache(url, CACHE_POLICY.DEFAULT_HTTP_TTL_MS, {signal: options?.signal});
            const doc = await parseHTML(html);
            const value = parseWstreetIndexPage(doc);

            if (value === null) {
                throw new Error(`wstreet indexes: no usable level for "${entry.key}" (${url})`);
            }

            return {key: entry.key, value};
        })
    );

    const rejected = settled.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (rejected.length > 0) {
        log(
            "SERVICES fetch: fetchIndexDataWstreet partial failures",
            {
                total: entries.length,
                rejected: rejected.length,
                errors: rejected.slice(0, 3).map((r) => String(r.reason))
            },
            "warn"
        );
    }

    return settled
        .filter((r): r is PromiseFulfilledResult<StringNumberPair> => r.status === "fulfilled")
        .map((r) => r.value);
}
