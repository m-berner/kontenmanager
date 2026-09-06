/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {ardFetcher, sanitizeArdDetailUrlFromOnclick} from "@/adapters/driven/fetch/providers/ard";
import {clearCache} from "@/adapters/driven/fetch/httpCache";

const SEARCH_URL = "https://www.tagesschau.de/wirtschaft/boersenkurse/suche?q=apple";
const DETAIL_URL = "https://www.tagesschau.de/wirtschaft/boersenkurse/aktien/apple-aktie";

function htmlResponse(html: string, url: string) {
    return {ok: true, status: 200, url, text: vi.fn().mockResolvedValue(html)};
}

describe("sanitizeArdDetailUrlFromOnclick", () => {
    it("accepts a root-relative tagesschau path", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            "document.location='/wirtschaft/boersenkurse/aktien/apple-aktie';"
        );
        expect(result).toBe(DETAIL_URL);
    });

    it("accepts an absolute https tagesschau URL", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            `document.location="${DETAIL_URL}";`
        );
        expect(result).toBe(DETAIL_URL);
    });

    it("rejects a URL on an untrusted host", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            "document.location='https://evil.example/wirtschaft/boersenkurse/aktien/apple-aktie';"
        );
        expect(result).toBeNull();
    });

    it("rejects a non-https protocol", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            "document.location='http://www.tagesschau.de/wirtschaft/boersenkurse/aktien/apple-aktie';"
        );
        expect(result).toBeNull();
    });

    it("rejects a path outside the allowed prefix", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            "document.location='/other/path';"
        );
        expect(result).toBeNull();
    });

    it("rejects a URL carrying embedded credentials", () => {
        const result = sanitizeArdDetailUrlFromOnclick(
            "document.location='https://user:pass@www.tagesschau.de/wirtschaft/boersenkurse/aktien/apple-aktie';"
        );
        expect(result).toBeNull();
    });

    it("returns null when the onclick attribute has no ´document.location´ assignment", () => {
        expect(sanitizeArdDetailUrlFromOnclick("doSomethingElse();")).toBeNull();
    });
});

describe("ardFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    it("follows the search result to the detail page and parses labeled quote data", async () => {
        const searchHtml = `
            <div id="desktopSearchResult">
                <table><tbody>
                    <tr onclick="document.location='/wirtschaft/boersenkurse/aktien/apple-aktie';"></tr>
                </tbody></table>
            </div>
        `;
        const detailHtml = `
            <div id="USFkursdaten">
                <table><tbody>
                    <tr><td>Kurs</td><td>123,45€</td></tr>
                    <tr><td>52 Wochen-Tief</td><td>100,00€</td></tr>
                    <tr><td>52 Wochen-Hoch</td><td>150,00€</td></tr>
                </tbody></table>
            </div>
        `;

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === SEARCH_URL) return Promise.resolve(htmlResponse(searchHtml, SEARCH_URL));
                if (url === DETAIL_URL) return Promise.resolve(htmlResponse(detailHtml, DETAIL_URL));
                return Promise.reject(new Error(`unexpected URL: ${url}`));
            })
        );

        const result = await ardFetcher([{key: 1, value: SEARCH_URL}]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "123.45", min: "100.00", max: "150.00", cur: "EUR"}
        ]);
    });

    // The currency used to be hardcoded to EUR. useOnlineStockData treats a
    // truthy `cur` as authoritative — it suppresses the ISIN-based USD fallback,
    // and `stockCur === uiCur` then yields a divisor of 1 — so a USD-quoted
    // instrument was stored as if it were euros. tagesschau.de's Börsenkurse
    // section does list non-EUR instruments, so the currency must come off the
    // page. (Same class round 30 fixed for acheck.)
    it("reads USD off the quote cell instead of asserting EUR", async () => {
        const searchHtml = `
            <div id="desktopSearchResult">
                <table><tbody>
                    <tr onclick="document.location='/wirtschaft/boersenkurse/aktien/apple-aktie';"></tr>
                </tbody></table>
            </div>
        `;
        const detailHtml = `
            <div id="USFkursdaten">
                <table><tbody>
                    <tr><td>Kurs</td><td>123,45 $</td></tr>
                    <tr><td>52 Wochen-Tief</td><td>100,00 $</td></tr>
                    <tr><td>52 Wochen-Hoch</td><td>150,00 $</td></tr>
                </tbody></table>
            </div>
        `;

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === SEARCH_URL) return Promise.resolve(htmlResponse(searchHtml, SEARCH_URL));
                if (url === DETAIL_URL) return Promise.resolve(htmlResponse(detailHtml, DETAIL_URL));
                return Promise.reject(new Error(`unexpected URL: ${url}`));
            })
        );

        const [result] = await ardFetcher([{key: 1, value: SEARCH_URL}]);

        expect(result.cur).toBe("USD");
    });

    it("still falls back to EUR when the page carries no currency marker", async () => {
        const searchHtml = `
            <div id="desktopSearchResult">
                <table><tbody>
                    <tr onclick="document.location='/wirtschaft/boersenkurse/aktien/apple-aktie';"></tr>
                </tbody></table>
            </div>
        `;
        const detailHtml = `
            <div id="USFkursdaten">
                <table><tbody>
                    <tr><td>Kurs</td><td>123,45</td></tr>
                </tbody></table>
            </div>
        `;

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === SEARCH_URL) return Promise.resolve(htmlResponse(searchHtml, SEARCH_URL));
                if (url === DETAIL_URL) return Promise.resolve(htmlResponse(detailHtml, DETAIL_URL));
                return Promise.reject(new Error(`unexpected URL: ${url}`));
            })
        );

        const [result] = await ardFetcher([{key: 1, value: SEARCH_URL}]);

        // Preserves the previous behavior for the common German-market case.
        // Returning "" would make useOnlineStockData infer USD from a "US" ISIN
        // and wrongly divide an EUR-quoted price by the USD rate.
        expect(result.cur).toBe("EUR");
    });

    it("falls back to fixed row indices when no labeled rows are found", async () => {
        const searchHtml = `
            <div id="desktopSearchResult">
                <table><tbody>
                    <tr onclick="document.location='/wirtschaft/boersenkurse/aktien/apple-aktie';"></tr>
                </tbody></table>
            </div>
        `;
        const rows = Array.from({length: 8}, (_, i) => {
            if (i === 0) return "<tr><td>row0</td><td>50,00€</td></tr>";
            if (i === 6) return "<tr><td>row6</td><td>40,00€</td></tr>";
            if (i === 7) return "<tr><td>row7</td><td>60,00€</td></tr>";
            return "<tr><td>filler</td><td>x</td></tr>";
        }).join("");
        const detailHtml = `<div id="USFkursdaten"><table><tbody>${rows}</tbody></table></div>`;

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation((url: string) => {
                if (url === SEARCH_URL) return Promise.resolve(htmlResponse(searchHtml, SEARCH_URL));
                if (url === DETAIL_URL) return Promise.resolve(htmlResponse(detailHtml, DETAIL_URL));
                return Promise.reject(new Error(`unexpected URL: ${url}`));
            })
        );

        const result = await ardFetcher([{key: 2, value: SEARCH_URL}]);

        expect(result).toEqual([
            {id: 2, isin: "", rate: "50.00", min: "40.00", max: "60.00", cur: "EUR"}
        ]);
    });

    it("rejects when the search page yields no detail URL", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(htmlResponse("<div id=\"desktopSearchResult\"></div>", SEARCH_URL))
        );

        await expect(ardFetcher([{key: 3, value: SEARCH_URL}])).rejects.toThrow();
    });
});