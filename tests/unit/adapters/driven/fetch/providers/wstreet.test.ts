/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {wstreetFetcher} from "@/adapters/driven/fetch/providers/wstreet";
import {clearCache} from "@/adapters/driven/fetch/httpCache";

const SEARCH_URL = "https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/?q=apple";

function textResponse(body: string, url: string) {
    return {ok: true, status: 200, url, text: vi.fn().mockResolvedValue(body)};
}

function stubFetch(searchBody: string, detailHtml?: string): void {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
            if (url === SEARCH_URL) return Promise.resolve(textResponse(searchBody, SEARCH_URL));
            if (detailHtml !== undefined) return Promise.resolve(textResponse(detailHtml, url));
            return Promise.reject(new Error(`unexpected URL: ${url}`));
        })
    );
}

describe("wstreetFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("follows the JSON search result to the detail page and parses the fixed-index tables", async () => {
        stubFetch(
            JSON.stringify({result: [{link: "/aktien/apple-aktie"}]}),
            `
                <div class="alpha"><table><tbody>
                    <tr><td>0</td><td>1</td><td>2</td><td>123,45 EUR</td></tr>
                </tbody></table></div>
                <div class="omega"><table><tbody>
                    <tr><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>150,00</td><td>6</td><td>100,00</td></tr>
                </tbody></table></div>
            `
        );

        const result = await wstreetFetcher([{key: 1, value: SEARCH_URL}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "123.45", min: "100.00", max: "150.00", cur: "EUR"}
        ]);
    });

    it("falls back to a label-based scan across the whole document when the scoped tables are absent", async () => {
        stubFetch(
            JSON.stringify({result: [{link: "/aktien/apple-aktie"}]}),
            `
                <table>
                    <tr><th>Kurs</th><td>50,00 EUR</td></tr>
                    <tr><th>52 Wochen Hoch</th><td>80,00</td></tr>
                    <tr><th>52 Wochen Tief</th><td>30,00</td></tr>
                </table>
            `
        );

        const result = await wstreetFetcher([{key: 2, value: SEARCH_URL}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "50.00", min: "30.00", max: "80.00", cur: "EUR"}
        ]);
    });

    it("rejects when the search response is not valid JSON", async () => {
        stubFetch("not JSON");

        await expect(wstreetFetcher([{key: 3, value: SEARCH_URL}])).rejects.toThrow();
    });

    it("rejects when the search result has no detail link", async () => {
        stubFetch(JSON.stringify({result: []}));

        await expect(wstreetFetcher([{key: 4, value: SEARCH_URL}])).rejects.toThrow();
    });

    it("rejects a detail link pointing off the wallstreet-online host (fail-closed)", async () => {
        stubFetch(JSON.stringify({result: [{link: "https://evil.example/aktien/apple-aktie"}]}));

        await expect(wstreetFetcher([{key: 5, value: SEARCH_URL}])).rejects.toThrow();
    });

    it("rejects when the detail page has no parseable rate", async () => {
        stubFetch(
            JSON.stringify({result: [{link: "/aktien/apple-aktie"}]}),
            "<div>no data here</div>"
        );

        await expect(wstreetFetcher([{key: 6, value: SEARCH_URL}])).rejects.toThrow();
    });
});