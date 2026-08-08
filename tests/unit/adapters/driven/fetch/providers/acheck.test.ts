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

/** Serves different bodies per URL, for the two-hop search -> profile flow. */
function mockByUrl(bodies: Record<string, string>): void {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
            const match = Object.keys(bodies).find((key) => String(url).includes(key));
            if (!match) return Promise.reject(new Error(`unexpected URL: ${url}`));
            return Promise.resolve({
                ok: true,
                status: 200,
                url: String(url),
                text: vi.fn().mockResolvedValue(bodies[match])
            });
        })
    );
}

describe("acheckFetcher", () => {
    beforeEach(() => {
        clearCache();
    });

    // Verified live 2026-08-06: the search endpoint answers HTTP 200 with a body
    // that EMBEDS a "302 Found" stub pointing at the real profile page, so
    // fetchTextWithCacheFollowRedirect has no 3xx to follow. Every lookup failed
    // with "failed to parse stock data" until the stub was followed explicitly.
    it("follows the embedded 302 stub the search endpoint returns", async () => {
        mockByUrl({
            "/quotes/suche/": `
                <div id="content">
                    <html lang=""><head><title>302 Found</title></head><body>
                    <h1>Found</h1><p>The document has moved
                    <a href="/quotes/profil?&amp;secu=293&amp;stack=abc&amp;result_target=xx">here</a>.</p>
                    </body></html>
                </div>
            `,
            "/quotes/profil": `
                <div id="content">
                    <table>
                        <tr><td>Letzter</td><td>Vortag</td><td>Umsatz</td></tr>
                        <tr><td>51,24</td><td>50,70</td><td>26,6 M &euro;</td></tr>
                    </table>
                    <table><tr><td>unused</td></tr></table>
                    <table>
                        <tr><td>Zeitraum</td><td>Hoch</td><td>Tief</td></tr>
                        <tr><td>52 Wochen</td><td>55.05</td><td>41.48</td></tr>
                    </table>
                </div>
            `
        });

        const result = await acheckFetcher([
            {key: 1, value: "https://m.aktiencheck.de/quotes/suche/?search=DE000BASF111"}
        ]);

        expect(result).toEqual([
            {id: 1, isin: "", rate: "51.24", min: "41.48", max: "55.05", cur: "EUR"}
        ]);
    });

    it("ignores a stub link that is not a same-origin aktiencheck URL", async () => {
        mockByUrl({
            "/quotes/suche/": `
                <div id="content">
                    <p>The document has moved
                    <a href="https://evil.example/quotes/profil?x=1">here</a>.</p>
                </div>
            `
        });

        // Fails closed rather than following a scraped cross-origin link — the
        // second fetch is never attempted, so the (table-less) stub is parsed
        // and rejected.
        await expect(
            acheckFetcher([{key: 1, value: "https://m.aktiencheck.de/quotes/suche/?search=X"}])
        ).rejects.toThrow(/failed to parse stock data/);
    });

    // Verified live 2026-08-06 on Apple: the quote table reads
    // "313,65 / Umsatz 577 M $" (USD) while the UNLABELLED Hoch/Tief table reads
    // "Intraday 274.0 / 270.55" — an intraday high ~40 BELOW the current price,
    // impossible in one currency. The range is the EUR listing. Reporting it
    // under the quote's currency made useOnlineStockData divide an already-EUR
    // range by the USD rate.
    it("suppresses the 52-week range when the quote is not in EUR", async () => {
        mockByUrl({
            "/quotes/suche/": `
                <div id="content">
                    <table>
                        <tr><td>Letzter</td><td>Vortag</td><td>Umsatz</td></tr>
                        <tr><td>313,65</td><td>311,00</td><td>577 M $</td></tr>
                    </table>
                    <table><tr><td>unused</td></tr></table>
                    <table>
                        <tr><td>Zeitraum</td><td>Hoch</td><td>Tief</td></tr>
                        <tr><td>52 Wochen</td><td>301.8</td><td>185.82</td></tr>
                    </table>
                </div>
            `
        });

        const [result] = await acheckFetcher([
            {key: 1, value: "https://m.aktiencheck.de/quotes/suche/?search=US0378331005"}
        ]);

        expect(result.cur).toBe("USD");
        expect(result.rate).toBe("313.65");
        // Reported as unknown; CompanyContent renders 0 min/max as an empty cell.
        expect(result.min).toBe("0");
        expect(result.max).toBe("0");
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

    it("does not let a combined hoch/tief row with unparseable values clobber already-parsed min/max", async () => {
        mockHtmlResponse(`
            <div id="content">
                <table>
                    <tr><th>Kurs</th><td>12,34</td><td>EUR</td></tr>
                </table>
                <table></table>
                <table>
                    <tr><th>Tief</th><td>10,00</td></tr>
                    <tr><th>Hoch</th><td>15,00</td></tr>
                    <tr><th>Hoch/Tief</th><td>-</td><td>-</td></tr>
                </table>
            </div>
        `);

        const result = await acheckFetcher([{key: 6, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 6, isin: "", rate: "12.34", min: "10.00", max: "15.00", cur: "EUR"}
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

        // min/max are suppressed because the quote is not EUR — the page's
        // Hoch/Tief table carries no currency marker and is the EUR listing.
        expect(result).toEqual([
            {id: 2, isin: "", rate: "20.50", min: "0", max: "0", cur: "USD"}
        ]);
    });

    it("parses rate and currency from the real live header/data-row table structure (USD stock)", async () => {
        // Real live m.aktiencheck.de structure (verified 2026-08, Apple page): a
        // header row of column labels followed by ONE data row - not label:value
        // row pairs. The old row-based scan misread this: "Letzter" sits in the
        // header row next to "Vortag" (not a price), and the data row's own first
        // cell is the price itself, not a label - so it fell through to a fixed
        // fallback that returned "Vortag" (previous close) as the rate, and to a
        // fixed currency cell that landed on "Umsatz" (matching neither USD nor
        // EUR, silently defaulting to EUR even for a USD stock).
        mockHtmlResponse(`
            <div id="content">
                <table>
                    <tr>
                        <td>Letzter</td><td>Vortag</td><td>Umsatz</td><td>Veränderung</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td>303,22</td><td>308,94</td><td>6,76&nbsp;Mrd $</td><td>-1,85%</td>
                    </tr>
                </table>
                <table><tr><td>unused</td></tr></table>
                <table>
                    <tr><td>Zeitraum</td><td>Hoch</td><td>Tief</td></tr>
                    <tr><td>Intraday</td><td>271.05</td><td>263.0</td></tr>
                    <tr><td>Akt. Jahr</td><td>301.8</td><td>207.8</td></tr>
                    <tr><td>52 Wochen</td><td>301.8</td><td>174.36</td></tr>
                </table>
            </div>
        `);

        const result = await acheckFetcher([{key: 7, value: "https://example.com/quote"}]);

        // Note this very fixture carries the proof that the Hoch/Tief table is a
        // DIFFERENT currency from the quote: it reports "Intraday 271.05" against
        // a current price of 303,22 — an intraday high 32 below the last trade,
        // which cannot happen in one currency. 271 is the EUR listing. The range
        // is therefore reported as unknown for a non-EUR quote rather than being
        // FX-divided a second time.
        expect(result).toEqual([
            {id: 7, isin: "", rate: "303.22", min: "0", max: "0", cur: "USD"}
        ]);
    });

    it("parses rate and currency from the real live header/data-row table structure (EUR stock)", async () => {
        // Same real live structure as above, verified against SAP's page - the
        // currency symbol embedded in the Umsatz cell differs (€ vs $), everything
        // else about the layout is identical.
        mockHtmlResponse(`
            <div id="content">
                <table>
                    <tr>
                        <td>Letzter</td><td>Vortag</td><td>Umsatz</td><td>Veränderung</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td>164,64</td><td>157,68</td><td>654&nbsp;M &euro;</td><td>+4,41%</td>
                    </tr>
                </table>
                <table><tr><td>unused</td></tr></table>
                <table>
                    <tr><td>Zeitraum</td><td>Hoch</td><td>Tief</td></tr>
                    <tr><td>Intraday</td><td>168.7</td><td>159.6</td></tr>
                    <tr><td>Akt. Jahr</td><td>219.4</td><td>127.5</td></tr>
                    <tr><td>52 Wochen</td><td>257.7</td><td>127.5</td></tr>
                </table>
            </div>
        `);

        const result = await acheckFetcher([{key: 8, value: "https://example.com/quote"}]);

        expect(result).toEqual([
            {id: 8, isin: "", rate: "164.64", min: "127.5", max: "257.7", cur: "EUR"}
        ]);
    });

    it("rejects when fewer than three content tables are present", async () => {
        mockHtmlResponse(`<div id="content"><table></table></div>`);

        await expect(
            acheckFetcher([{key: 3, value: "https://example.com/quote"}])
        ).rejects.toThrow();
    });
});