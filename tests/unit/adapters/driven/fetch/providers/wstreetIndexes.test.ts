/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {fetchIndexDataWstreet} from "@/adapters/driven/fetch/providers/wstreetIndexes";
import {clearCache} from "@/adapters/driven/fetch/httpCache";
import {SETTINGS} from "@/domain/constants";

const HOME = "https://www.wallstreet-online.de";

// Mirrors WSTREET_INDEX_SLUGS in the module under test.
const SLUGS: Record<string, string> = {
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

// Every real page also carries a "Kursleiste" ticker-ribbon widget (other
// indexes) ABOVE the page's own #quoteBoxMarker. Its rows carry no
// `quoteValue` class of their own on the real site today — only a
// `quote_currency` one (for the %-change figure), which is the exact shape
// that emptied the materials InfoBar via a document-global lookup (see
// wstreetMaterials.test.ts). A decoy `.quoteValue` is included here anyway,
// with a value distinct from the real quote box's: it doesn't reproduce
// today's live markup, but it does turn this into an actual regression test
// of the code's scoping (fails without #quoteBoxMarker-scoping, passes with
// it) rather than one that would pass either way given today's real page
// shape.
function withDecoyWidget(body: string): string {
    return `
        <table><tr><td><a href="/indizes/dax">DAX</a>
            <span class="d-none d-sm-inline quoteValue"><span>99.999,99</span></span>
            <span data-postfix=" <span class=quote_currency>%</span>" >
                <span class="font green">+0,10&nbsp;<span class="quote_currency">%</span></span>
            </span>
        </td></tr></table>
        ${body}
    `;
}

function quotePage(value: string): string {
    return `
        <div id="quoteBoxMarker">
            <div class="quote quoteBoxBigLayout performanceQuotebox secondRow fw-bold sizeBig">
                <div class="float-start quoteValue"><span>${value}</span></div>
                <div table="quotes" class="quote_currency">PKT</div>
            </div>
        </div>
    `;
}

function textResponse(body: string, url: string) {
    return {ok: true, status: 200, url, text: vi.fn().mockResolvedValue(body)};
}

/**
 * Stubs `fetch` for every configured index's detail page. `overrides` maps
 * an index key (e.g. "dax") to the raw HTML body for that one page,
 * overriding the default (decoy-wrapped) quote every other key gets.
 */
function stubIndexPages(overrides: Record<string, string> = {}): void {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
            const entry = Object.entries(SLUGS).find(([, slug]) => url === `${HOME}/indizes/${slug}`);
            if (!entry) return Promise.reject(new Error(`unexpected URL: ${url}`));
            const [key] = entry;
            const body = overrides[key] ?? withDecoyWidget(quotePage("1.234,56"));
            return Promise.resolve(textResponse(body, url));
        })
    );
}

describe("fetchIndexDataWstreet", () => {
    beforeEach(() => {
        clearCache();
    });

    // Same reasoning as wstreetMaterials.test.ts's matching test: every other
    // test here exercises the SLUGS mirror above, not the real
    // SETTINGS.INDEXES key set, so an index added to SETTINGS.INDEXES
    // without a matching entry added to the real WSTREET_INDEX_SLUGS in the
    // module under test would silently vanish from fetchIndexDataWstreet's
    // result in production without failing any test here. This one catches
    // that: it fails the moment this mirror and SETTINGS.INDEXES' real keys
    // disagree.
    it("mirrors every key currently configured in SETTINGS.INDEXES (catches the slug map falling out of sync)", () => {
        expect(Object.keys(SLUGS).sort()).toEqual(Object.keys(SETTINGS.INDEXES).sort());
    });

    it("fetches every configured index and returns its level keyed by the short SETTINGS.INDEXES key", async () => {
        stubIndexPages();

        const result = await fetchIndexDataWstreet();

        expect(result).toEqual(
            expect.arrayContaining(Object.keys(SLUGS).map((key) => ({key, value: 1234.56})))
        );
        expect(result).toHaveLength(Object.keys(SLUGS).length);
        // Keyed by the short key ("dax"), not the display label ("DAX") -
        // unlike fetchMaterialDataWstreet, which keys by label because that
        // is what fetchMaterialData's finanzen.net path already does.
        expect(result.find((r) => r.key === "dax")).toBeDefined();
        expect(result.find((r) => r.key === SETTINGS.INDEXES.dax)).toBeUndefined();
    });

    it("skips a page with no parseable level instead of reporting a phantom value", async () => {
        stubIndexPages({dax: "<div>no data here</div>"});

        const result = await fetchIndexDataWstreet();

        expect(result.find((r) => r.key === "dax")).toBeUndefined();
        expect(result).toHaveLength(Object.keys(SLUGS).length - 1);
    });

    it("does not fail the whole batch when one index's request rejects", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === `${HOME}/indizes/dax`) return Promise.reject(new Error("network error"));
                const entry = Object.entries(SLUGS).find(([, slug]) => url === `${HOME}/indizes/${slug}`);
                if (!entry) return Promise.reject(new Error(`unexpected URL: ${url}`));
                return Promise.resolve(textResponse(withDecoyWidget(quotePage("1.234,56")), url));
            })
        );

        const result = await fetchIndexDataWstreet();

        expect(result.find((r) => r.key === "dax")).toBeUndefined();
        expect(result).toHaveLength(Object.keys(SLUGS).length - 1);
    });

    it("reads the level from the page's own quote box, not the ticker-ribbon widget above it", async () => {
        stubIndexPages({dax: withDecoyWidget(quotePage("26.107,51"))});

        const result = await fetchIndexDataWstreet();

        expect(result.find((r) => r.key === "dax")).toEqual({key: "dax", value: 26107.51});
    });
});
