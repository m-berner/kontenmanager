/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {fnetFetcher} from "@/adapters/driven/fetch/providers/fnet";
import {clearCache} from "@/adapters/driven/fetch/httpCache";

function mockHtmlResponse(html: string): void {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            url: "https://example.com/quote",
            text: vi.fn().mockResolvedValue(html)
        })
    );
}

// Mirrors the real finanzen.net markup structure (verified against live-captured
// pages, 2026-08): one <tr> whose <td> cells alternate label/value pairs, except
// the last two cells, which are colspan rows combining their own label + values.
function labeledTbodyHtml(opts: {
    openPrev?: string;
    bidAsk?: string;
    range?: string;
}): string {
    const {
        openPrev = "144,12 / 144,88 EUR",
        bidAsk = "144,36 / 144,40",
        range = "137,64 EUR / 273,50 EUR"
    } = opts;
    return `
        <main>
            <div class="tab-region__container">
                <table><tbody>
                    <tr>
                        <td>Eröffnung / Vortag</td><td>${openPrev}</td>
                        <td>BID / ASK</td><td>${bidAsk}</td>
                        <td>BID- / ASK-Size</td><td>700 / 700</td>
                        <td>Volumen (Stück)</td><td>62.493</td>
                        <td>Tagestief / Hoch 140,84 EUR 145,14 EUR</td>
                        <td>52 Wochen (Hoch/Tief) ${range}</td>
                    </tr>
                </tbody></table>
            </div>
        </main>
    `;
}

// A layout drift with no recognizable labels at all - forces the fixed-index
// fallback path (cell [1] for open/prev, cell [3] for bid/ask, cell [9] for range).
function unlabeledTbodyHtml(cell1: string, cell3: string, cell9: string): string {
    return `
        <main>
            <div class="tab-region__container">
                <table><tbody>
                    <tr><td>x</td><td>${cell1}</td><td>x</td><td>${cell3}</td><td>x</td><td>x</td><td>x</td><td>x</td><td>x</td><td>${cell9}</td></tr>
                </tbody></table>
            </div>
        </main>
    `;
}

describe("fnetFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("finds BID/ASK by label, averages into a rate, and parses the EUR 52-week range", async () => {
        mockHtmlResponse(labeledTbodyHtml({}));

        const result = await fnetFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "144.38", min: "137.64", max: "273.50", cur: "EUR"}
        ]);
    });

    it("detects currency from the Eröffnung/Vortag cell even though the BID/ASK cell itself has no currency suffix", async () => {
        // Real finanzen.net markup: the BID/ASK value cell (e.g. "144,36 / 144,40")
        // never carries a currency suffix - only the Eröffnung/Vortag cell does.
        // Detecting currency from askBidString directly (the pre-fix behavior)
        // would silently return "" here despite the page clearly being EUR-quoted.
        mockHtmlResponse(labeledTbodyHtml({openPrev: "291,80 / 292,05 EUR", bidAsk: "291,80 / 292,05"}));

        const result = await fnetFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result[0]?.cur).toBe("EUR");
    });

    it("defaults min/max to 0 when the 52-week range is not in EUR", async () => {
        mockHtmlResponse(labeledTbodyHtml({range: "8.56 USD / 12.34 USD"}));

        const result = await fnetFetcher([{key: 2, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "144.38", min: "0", max: "0", cur: "EUR"}
        ]);
    });

    it("rejects when the expected table is missing entirely", async () => {
        mockHtmlResponse("<main></main>");

        await expect(
            fnetFetcher([{key: 3, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });

    it("rejects when the bid/ask cell has no parseable numbers", async () => {
        mockHtmlResponse(labeledTbodyHtml({bidAsk: "n/a"}));

        await expect(
            fnetFetcher([{key: 4, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });

    it("defaults min/max to 0 (not a positional mismatch) when only one side of the range is in EUR", async () => {
        // A single match is ambiguous (could be the low or the high) and must
        // not be assigned positionally to `min`.
        mockHtmlResponse(labeledTbodyHtml({range: "N/A / 12,34 EUR"}));

        const result = await fnetFetcher([{key: 5, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 5, isin: "", rate: "144.38", min: "0", max: "0", cur: "EUR"}
        ]);
    });

    it("falls back to fixed-index extraction when no row/cell labels match (page layout drift)", async () => {
        mockHtmlResponse(unlabeledTbodyHtml("9,67 / 9,98 EUR", "9,70 / 9,80", "8,56 EUR / 12,34 EUR"));

        const result = await fnetFetcher([{key: 6, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 6, isin: "", rate: "9.75", min: "8.56", max: "12.34", cur: "EUR"}
        ]);
    });
});
