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

function tbodyHtml(cell1: string, cell9: string): string {
    const filler = Array.from({length: 7}, (_, i) => `<td>${i + 2}</td>`).join("");
    return `
        <main>
            <div class="tab-region__container">
                <table><tbody>
                    <tr><td>0</td><td>${cell1}</td>${filler}<td>${cell9}</td></tr>
                </tbody></table>
            </div>
        </main>
    `;
}

describe("fnetFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("averages bid/ask into a rate and parses the EUR 52-week range", async () => {
        mockHtmlResponse(tbodyHtml("9,67 / 9,98 EUR", "8,56 EUR / 12,34 EUR"));

        const result = await fnetFetcher([{key: 1, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "9.825", min: "8.56", max: "12.34", cur: "EUR"}
        ]);
    });

    it("defaults min/max to 0 when the 52-week range is not in EUR", async () => {
        mockHtmlResponse(tbodyHtml("9,67 / 9,98 USD", "8.56 USD / 12.34 USD"));

        const result = await fnetFetcher([{key: 2, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "9.825", min: "0", max: "0", cur: "USD"}
        ]);
    });

    it("rejects when the expected table is missing entirely", async () => {
        mockHtmlResponse("<main></main>");

        await expect(
            fnetFetcher([{key: 3, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });

    it("rejects when the bid/ask cell has no parseable numbers", async () => {
        mockHtmlResponse(tbodyHtml("n/a", "n/a"));

        await expect(
            fnetFetcher([{key: 4, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });
});