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
 * Maps this app's material keys (`SETTINGS.MATERIALS`) to wallstreet-online.de's
 * per-commodity page slugs under `/rohstoffe/`.
 *
 * Every key currently configured in `SETTINGS.MATERIALS` has an entry here —
 * confirmed reachable (HTTP 200) as of 2026-09. "sn" (tin) is deliberately
 * absent from both maps: wallstreet-online.de has no tin page at all
 * (`/rohstoffe/zinnpreis` and every other spelling tried returned `410 Gone`),
 * which is part of why tin was dropped from the app rather than partially
 * supported.
 */
const WSTREET_MATERIAL_SLUGS: Readonly<Record<string, string>> = {
    au: "goldpreis",
    ag: "silberpreis",
    brent: "oelpreis-brent",
    wti: "oelpreis-wti",
    cu: "kupferpreis",
    pt: "platinpreis",
    al: "aluminiumpreis",
    ni: "nickelpreis",
    pb: "bleipreis",
    pd: "palladiumpreis"
};

/**
 * Reads the current price from a fetched wallstreet-online.de commodity page.
 *
 * Every page checked carries a `.quoteValue span` (the number) and a sibling
 * `.quote_currency` (its unit) inside `#quoteBoxMarker`. Returns `null` for
 * anything this shouldn't report, rather than a phantom 0 — matching
 * `fetchMaterialData`'s finanzen.net path, which skips an unparseable row for
 * the same reason.
 *
 * **The USD check is load-bearing, not defensive decoration.** InfoBar labels
 * every material figure as a USD price outright (`n(value, "currencyUSD")`),
 * the same assumption the finanzen.net path has always made. Two of this
 * site's ten commodity pages (aluminum, lead, as of this writing) carry a
 * "PKT" unit instead of "USD" — an index-points figure, not an actual
 * per-tonne dollar price — so accepting them here would silently mislabel an
 * unrelated number as a USD price, corrupting the USD/local-currency figures
 * InfoBar renders. Skipping them is the same choice this codebase already
 * made for an unparseable finanzen.net row: report nothing rather than a
 * wrong-but-plausible value.
 */
function parseWstreetMaterialPage(doc: Document): number | null {
    // Scoped to #quoteBoxMarker, NOT a document-global `.quote_currency`
    // lookup: every one of these pages also carries a "Kursleiste" ticker
    // ribbon widget higher up the page (DAX and a handful of other
    // instruments), and each of ITS rows renders its own `.quote_currency`
    // span too - for the percent-change figure, so its actual text content is
    // literally "%". Since that widget sits before #quoteBoxMarker in the
    // DOM, an unscoped `doc.querySelector(".quote_currency")` picked up "%"
    // on every page, which never equals "USD" - so every material was
    // rejected and `fetchMaterialDataWstreet` returned an empty array,
    // leaving InfoBar with nothing to show. #quoteBoxMarker is the wrapper
    // around the page's own quote box (see this function's own doc comment
    // above) and is unique per page.
    const quoteBox = doc.querySelector("#quoteBoxMarker");
    if (!quoteBox) return null;

    const currency = quoteBox.querySelector(".quote_currency")?.textContent?.trim().toUpperCase() ?? "";
    if (currency !== "USD") return null;

    const raw = quoteBox.querySelector(".quoteValue span")?.textContent?.trim() ?? "";
    if (!raw) return null;

    const value = toNumber(raw, {locale: "de"});
    return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Fetches current commodity prices from wallstreet-online.de.
 *
 * Unlike finanzen.net's single overview table, this is one request per
 * configured material — `Promise.allSettled` so one bad/blocked page (or one
 * quoted in "PKT" rather than USD, see `parseWstreetMaterialPage`) does not
 * take the rest down with it.
 *
 * @returns Array of material names (matching `SETTINGS.MATERIALS`' German
 *          labels, the same keying `fetchMaterialData`'s finanzen.net path
 *          uses) and their USD prices.
 */
export async function fetchMaterialDataWstreet(
    options?: { signal?: AbortSignal }
): Promise<StringNumberPair[]> {
    log("SERVICES fetch: Fetching material data (wstreet)");

    const home = FETCH.PROVIDERS["wstreet"]?.HOME ?? "";
    if (!home) return [];

    const entries = Object.entries(SETTINGS.MATERIALS)
        .map(([key, label]) => ({key, label, slug: WSTREET_MATERIAL_SLUGS[key]}))
        .filter((entry): entry is { key: string; label: string; slug: string } => Boolean(entry.slug));

    const settled = await Promise.allSettled(
        entries.map(async (entry): Promise<StringNumberPair> => {
            const url = `${home}/rohstoffe/${entry.slug}`;
            const html = await fetchWithCache(url, CACHE_POLICY.DEFAULT_HTTP_TTL_MS, {signal: options?.signal});
            const doc = await parseHTML(html);
            const value = parseWstreetMaterialPage(doc);

            if (value === null) {
                throw new Error(`wstreet materials: no usable USD price for "${entry.key}" (${url})`);
            }

            return {key: entry.label, value};
        })
    );

    const rejected = settled.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (rejected.length > 0) {
        log(
            "SERVICES fetch: fetchMaterialDataWstreet partial failures",
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
