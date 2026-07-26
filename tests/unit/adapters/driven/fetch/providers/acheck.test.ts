/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {acheckFetcher} from "@/adapters/driven/fetch/providers/acheck";
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

describe("acheckFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("parses rate, min/max, and currency from labeled table rows", async () => {
        mockHtmlResponse(`
            <div id="content">
                <table>
                    <tr><th>Kurs</th><td>12,34</td><td>EUR</td></tr>
                </table>
                <table></table>
                <table>
                    <tr><th>Tief</th><td>10,00</td></tr>
                    <tr><th>Hoch</th><td>15,00</td></tr>
                </table>
            </div>
        `);

        const result = await acheckFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "12.34", min: "10.00", max: "15.00", cur: "EUR"}
        ]);
    });

    it("falls back to fixed row/cell indices on older markup without recognizable labels", async () => {
        mockHtmlResponse(`
            <div id="content">
                <table>
                    <tr><td>filler</td></tr>
                    <tr><td>filler</td><td>20,50</td><td>USD</td></tr>
                </table>
                <table></table>
                <table>
                    <tr><td>f</td></tr>
                    <tr><td>f</td></tr>
                    <tr><td>f</td></tr>
                    <tr><td>f</td><td>99,00</td><td>5,00</td></tr>
                </table>
            </div>
        `);

        const result = await acheckFetcher([{key: 2, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "20.50", min: "5.00", max: "99.00", cur: "USD"}
        ]);
    });

    it("rejects when fewer than three content tables are present", async () => {
        mockHtmlResponse(`<div id="content"><table></table></div>`);

        await expect(
            acheckFetcher([{key: 3, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });
});