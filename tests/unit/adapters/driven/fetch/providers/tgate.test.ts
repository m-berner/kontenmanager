/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {tgateFetcher} from "@/adapters/driven/fetch/providers/tgate";
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

describe("tgateFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("computes the mid-quote from bid and ask elements", async () => {
        mockHtmlResponse(`<span id="bid">10,00</span><span id="ask">10,50</span>`);

        const result = await tgateFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "10.25", min: "0", max: "0", cur: "EUR"}
        ]);
    });

    it("uses the ask side alone when the bid side fails to parse", async () => {
        mockHtmlResponse(`<span id="bid">n/a</span><span id="ask">15,00</span>`);

        const result = await tgateFetcher([{key: 2, value: "https://example.com/quote"}]);

        expect(result[0].rate).toBe("15");
    });

    it("uses the bid side alone when the ask side fails to parse", async () => {
        mockHtmlResponse(`<span id="bid">20,00</span><span id="ask">n/a</span>`);

        const result = await tgateFetcher([{key: 3, value: "https://example.com/quote"}]);

        expect(result[0].rate).toBe("20");
    });

    it("rejects when neither bid nor ask can be parsed", async () => {
        mockHtmlResponse(`<span id="bid">n/a</span><span id="ask">n/a</span>`);

        await expect(
            tgateFetcher([{key: 4, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });

    it("rejects when the bid/ask elements are entirely absent", async () => {
        mockHtmlResponse("<div></div>");

        await expect(
            tgateFetcher([{key: 5, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });

    it("uses the bid side alone when the ask element is entirely absent from the markup", async () => {
        mockHtmlResponse(`<span id="bid">45,20</span><div></div>`);

        const result = await tgateFetcher([{key: 6, value: "https://example.com/quote"}]);

        expect(result[0].rate).toBe("45.2");
    });

    it("uses the ask side alone when the bid element is entirely absent from the markup", async () => {
        mockHtmlResponse(`<div></div><span id="ask">45,20</span>`);

        const result = await tgateFetcher([{key: 7, value: "https://example.com/quote"}]);

        expect(result[0].rate).toBe("45.2");
    });

    it("parses a 4-decimal comma quote as German, not as English thousands-grouping", async () => {
        // Regression: low-priced instruments (UK banks, penny stocks) render 4
        // fraction digits on Tradegate, e.g. "1,3105". Without an explicit
        // locale, detectNumberFormat only trusts a lone comma as decimal within
        // the last 4 characters of the string, so "1,3105" (5 chars after the
        // comma) was read as English thousands-grouping and the comma was
        // stripped: 1,3105 -> 13105, a ~10^4 inflation that reached mValue,
        // mChange and the depot total.
        mockHtmlResponse(`<span id="bid">1,3105</span><span id="ask">1,3170</span>`);

        const result = await tgateFetcher([{key: 8, value: "https://example.com/quote"}]);

        expect(result[0].rate).toBe("1.31375");
    });
});