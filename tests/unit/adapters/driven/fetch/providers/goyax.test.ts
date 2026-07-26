/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {goyaxFetcher} from "@/adapters/driven/fetch/providers/goyax";
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

describe("goyaxFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("parses rate and 52-week min/max from labeled list entries", async () => {
        mockHtmlResponse(`
            <div id="instrument-ueberblick">
                <div>
                    <ul>
                        <li>52 Wochen Hoch 20,00</li>
                        <li>52 Wochen Tief 10,00</li>
                    </ul>
                </div>
                <div>
                    <ul><li>Kurs 12,50</li></ul>
                </div>
            </div>
        `);

        const result = await goyaxFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "12.50", min: "10.00", max: "20.00", cur: "EUR"}
        ]);
    });

    it("falls back to fixed list/table structure on older markup", async () => {
        mockHtmlResponse(`
            <div id="instrument-ueberblick">
                <div>
                    <table></table>
                    <table>
                        <tr><td>r0</td></tr>
                        <tr><td>r1</td></tr>
                        <tr><td>r2</td></tr>
                        <tr><td>r3</td></tr>
                        <tr><td>a</td><td>b</td><td>c</td><td>77,00</td></tr>
                        <tr><td>a</td><td>b</td><td>c</td><td>22,00</td></tr>
                    </table>
                </div>
                <div>
                    <ul class="list-rows"><li>skip</li></ul>
                    <ul class="list-rows">
                        <li>a</li><li>b</li><li>c</li><li>Label) 33,30</li>
                    </ul>
                </div>
            </div>
        `);

        const result = await goyaxFetcher([{key: 2, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "33.30", min: "22.00", max: "77.00", cur: "EUR"}
        ]);
    });

    it("rejects when the overview container is missing", async () => {
        mockHtmlResponse("<div></div>");

        await expect(
            goyaxFetcher([{key: 3, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });
});