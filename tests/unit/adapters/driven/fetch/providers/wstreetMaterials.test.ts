/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {fetchMaterialDataWstreet} from "@/adapters/driven/fetch/providers/wstreetMaterials";
import {clearCache} from "@/adapters/driven/fetch/httpCache";
import {SETTINGS} from "@/domain/constants";

const HOME = "https://www.wallstreet-online.de";

// Mirrors WSTREET_MATERIAL_SLUGS in the module under test.
const SLUGS: Record<string, string> = {
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

// Every real page also carries a "Kursleiste" ticker-ribbon widget (DAX and a
// handful of other instruments) ABOVE the page's own #quoteBoxMarker, and each
// of that widget's rows renders its own `.quote_currency` span too — for the
// percent-change figure, so its real text content is literally "%". A
// document-global `.quote_currency` lookup picks that up instead of the
// commodity's actual currency on every real page — this is the shape that
// bug had, and `withDecoyWidget` reproduces it.
function withDecoyWidget(body: string): string {
    return `
        <table><tr><td><a href="/indizes/dax">DAX</a>
            <span data-postfix=" <span class=quote_currency>%</span>" >
                <span class="font green">+0,10&nbsp;<span class="quote_currency">%</span></span>
            </span>
        </td></tr></table>
        ${body}
    `;
}

function quotePage(value: string, currency: string): string {
    return `
        <div id="quoteBoxMarker">
            <div class="quote quoteBoxBigLayout performanceQuotebox secondRow fw-bold sizeBig">
                <div class="float-start quoteValue"><span>${value}</span></div>
                <div table="quotes" class="quote_currency">${currency}</div>
            </div>
        </div>
    `;
}

function textResponse(body: string, url: string) {
    return {ok: true, status: 200, url, text: vi.fn().mockResolvedValue(body)};
}

/**
 * Stubs `fetch` for every configured material's detail page. `overrides` maps
 * a material key (e.g. "al") to the raw HTML body for that one page,
 * overriding the default USD quote every other key gets.
 */
function stubMaterialPages(overrides: Record<string, string> = {}): void {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
            const entry = Object.entries(SLUGS).find(([, slug]) => url === `${HOME}/rohstoffe/${slug}`);
            if (!entry) return Promise.reject(new Error(`unexpected URL: ${url}`));
            const [key] = entry;
            // Wrapped in the decoy widget by default so every test exercises the
            // real page shape, not the simplified markup a document-global
            // selector would have gotten away with.
            const body = overrides[key] ?? withDecoyWidget(quotePage("1.234,56", "USD"));
            return Promise.resolve(textResponse(body, url));
        })
    );
}

describe("fetchMaterialDataWstreet", () => {
    beforeEach(() => {
        clearCache();
    });

    it("fetches every configured material and returns its USD price under the shared German label", async () => {
        stubMaterialPages();

        const result = await fetchMaterialDataWstreet();

        expect(result).toEqual(
            expect.arrayContaining(
                Object.keys(SLUGS).map((key) => ({key: SETTINGS.MATERIALS[key], value: 1234.56}))
            )
        );
        expect(result).toHaveLength(Object.keys(SLUGS).length);
    });

    it("skips a page quoted in something other than USD (e.g. index points) instead of reporting it as a USD price", async () => {
        // wallstreet-online.de quotes some commodities (aluminum, lead, as of
        // this writing) via a "PKT" index-points figure rather than an actual
        // dollar price. Reporting that number under InfoBar's hard-coded USD
        // label would be a wrong-but-plausible price - it must be dropped,
        // not coerced.
        stubMaterialPages({al: withDecoyWidget(quotePage("3.271,14", "PKT"))});

        const result = await fetchMaterialDataWstreet();

        expect(result.find((r) => r.key === SETTINGS.MATERIALS.al)).toBeUndefined();
        expect(result).toHaveLength(Object.keys(SLUGS).length - 1);
    });

    it("skips a page with no parseable value instead of reporting a phantom price", async () => {
        stubMaterialPages({au: "<div>no data here</div>"});

        const result = await fetchMaterialDataWstreet();

        expect(result.find((r) => r.key === SETTINGS.MATERIALS.au)).toBeUndefined();
        expect(result).toHaveLength(Object.keys(SLUGS).length - 1);
    });

    // Regression test for the exact real-world bug: a document-global
    // `.quote_currency` lookup found the decoy widget's "%" before the page's
    // own quote box and rejected every material, leaving `infoMaterials`
    // (and InfoBar) empty on every single load — not intermittently, every
    // time, because every real page carries that widget. Scoping the lookup
    // to `#quoteBoxMarker` is what `stubMaterialPages`' now-default
    // `withDecoyWidget` wrapping already exercises for every other test in
    // this file; this one pins the failure mode explicitly.
    it("reads the currency from the page's own quote box, not the ticker-ribbon widget above it", async () => {
        stubMaterialPages({au: withDecoyWidget(quotePage("4.467,37", "USD"))});

        const result = await fetchMaterialDataWstreet();

        expect(result.find((r) => r.key === SETTINGS.MATERIALS.au)).toEqual({
            key: SETTINGS.MATERIALS.au,
            value: 4467.37
        });
    });

    it("does not fail the whole batch when one material's request rejects", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === `${HOME}/rohstoffe/goldpreis`) return Promise.reject(new Error("network error"));
                const entry = Object.entries(SLUGS).find(([, slug]) => url === `${HOME}/rohstoffe/${slug}`);
                if (!entry) return Promise.reject(new Error(`unexpected URL: ${url}`));
                return Promise.resolve(textResponse(quotePage("1.234,56", "USD"), url));
            })
        );

        const result = await fetchMaterialDataWstreet();

        expect(result.find((r) => r.key === SETTINGS.MATERIALS.au)).toBeUndefined();
        expect(result).toHaveLength(Object.keys(SLUGS).length - 1);
    });
});
