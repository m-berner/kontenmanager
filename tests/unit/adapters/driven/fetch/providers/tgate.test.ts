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
});