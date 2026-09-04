/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {createFetchAdapter, sanitizeArdDetailUrlFromOnclick} from "@/adapters/driven/fetchAdapter";
import {isAppError} from "@/domain/errors";
import {BROWSER_STORAGE} from "@/domain/constants";

describe("FetchService", () => {
    const fetchAdapter = createFetchAdapter();

    beforeAll(() => {
        vi.stubGlobal("browser", {
            i18n: {
                getMessage: (key: string) => key
            }
        });
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        fetchAdapter.clearCache();
    });

    describe("fetchWithRetry", () => {
        it("should return response immediately when request succeeds", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("ok", {status: 200}));

            const response = await fetchAdapter.fetchWithRetry("https://example.test");

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should retry for retryable status codes", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(new Response("fail", {status: 500}))
                .mockResolvedValueOnce(new Response("ok", {status: 200}));

            const response = await fetchAdapter.fetchWithRetry("https://example.test");

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it("should throw AppError for non-retryable failures", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("missing", {status: 404}));

            await expect(
                fetchAdapter.fetchWithRetry("https://example.test")
            ).rejects.toSatisfy(isAppError);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should enforce timeout even when caller provides an AbortSignal", async () => {
            vi.useFakeTimers();

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
                const signal = init?.signal as AbortSignal | undefined;

                // Simulate a request that never completes unless aborted.
                return new Promise((_resolve, reject) => {
                    if (!signal) {
                        reject(new Error("expected abortable fetch"));
                        return;
                    }

                    if (signal.aborted) {
                        reject(signal.reason ?? new Error("AbortError"));
                        return;
                    }

                    signal.addEventListener(
                        "abort",
                        () => reject(signal.reason ?? new Error("AbortError")),
                        {once: true}
                    );
                }) as unknown as Promise<Response>;
            });

            const caller = new AbortController();

            const promise = fetchAdapter.fetchWithRetry(
                "https://example.test",
                {signal: caller.signal},
                3
            );
            // Attach the rejection handler immediately to avoid unhandledRejection
            // warnings while we advance fake timers.
            const assertion = expect(promise).rejects.toSatisfy(isAppError);

            // Comfortably past the 30 s internal timeout.
            await vi.advanceTimersByTimeAsync(33_000);

            await assertion;

            // ONE attempt, not three.
            //
            // The 30 s timeout is a budget for the whole call: a single
            // AbortController and timer are created before the retry loop and
            // shared by every attempt. Once it fires the signal stays aborted
            // permanently. So attempts 2 and 3 could only call fetch() with an
            // already-aborted signal (instant AbortError) while delay() returned
            // immediately via its own aborted-signal fast path — three calls,
            // two of which could never succeed, before throwing the timeout
            // error anyway. fetchWithRetry now breaks out as soon as the abort
            // reason is its own timeout.
            //
            // The assertion this test is named for — that the internal timeout
            // still fires and rejects with an AppError even though the caller
            // supplied its own signal — is unchanged above.
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should not retry when caller aborts the request", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
                const signal = init?.signal as AbortSignal | undefined;
                return new Promise((_resolve, reject) => {
                    if (!signal) {
                        reject(new Error("expected abortable fetch"));
                        return;
                    }
                    if (signal.aborted) {
                        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
                        return;
                    }
                    signal.addEventListener(
                        "abort",
                        () => reject(signal.reason ?? new DOMException("Aborted", "AbortError")),
                        {once: true}
                    );
                }) as unknown as Promise<Response>;
            });

            const controller = new AbortController();
            controller.abort(new DOMException("Aborted", "AbortError"));

            await expect(
                fetchAdapter.fetchWithRetry("https://example.test", {signal: controller.signal}, 3)
            ).rejects.toBeTruthy();

            // One attempt only, no retries on abort.
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("fetchWithCache", () => {
        it("should return cached response for repeated key within ttl", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("cached", {status: 200}));

            const first = await fetchAdapter.fetchWithCache(
                "https://example.test/data"
            );
            const second = await fetchAdapter.fetchWithCache(
                "https://example.test/data"
            );

            expect(first).toBe("cached");
            expect(second).toBe("cached");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should refresh cached entry after ttl expires", async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(new Response("first", {status: 200}))
                .mockResolvedValueOnce(new Response("second", {status: 200}));

            const first = await fetchAdapter.fetchWithCache(
                "https://example.test/data",
                1_000
            );

            vi.setSystemTime(new Date("2026-01-01T00:00:00.500Z"));
            const second = await fetchAdapter.fetchWithCache(
                "https://example.test/data",
                1_000
            );

            vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
            const third = await fetchAdapter.fetchWithCache(
                "https://example.test/data",
                1_000
            );

            expect(first).toBe("first");
            expect(second).toBe("first");
            expect(third).toBe("second");
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe("fetchIsOk", () => {
        it("should report online when the endpoint answers with a rejection status", async () => {
            // The regression this exists for: finanzen.net answers the
            // extension's fetch with Akamai's bot-protection 403 on every path.
            // The probe used to read `response.ok` through `fetchWithRetry`, so
            // a reachable-but-unwelcoming server was indistinguishable from a
            // dead network and TitleBar showed "disconnected" for the whole
            // session. A 403 came back over the wire — that is connectivity.
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("forbidden", {status: 403}));

            await expect(fetchAdapter.fetchIsOk()).resolves.toBe(true);
            // One attempt only: there is nothing for a retry ladder to improve.
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({method: "HEAD"});
        });

        it("should report offline when the request cannot complete", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network error"));

            await expect(fetchAdapter.fetchIsOk()).resolves.toBe(false);
        });

        it("should report offline without a request when the OS reports no network", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch");
            vi.spyOn(globalThis.navigator, "onLine", "get").mockReturnValue(false);

            await expect(fetchAdapter.fetchIsOk()).resolves.toBe(false);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it("should report offline when the caller aborts", async () => {
            vi.spyOn(globalThis, "fetch").mockImplementation(
                (_input, init) =>
                    new Promise((_resolve, reject) => {
                        init?.signal?.addEventListener(
                            "abort",
                            () => reject(new DOMException("aborted", "AbortError")),
                            {once: true}
                        );
                    })
            );

            const controller = new AbortController();
            const pending = fetchAdapter.fetchIsOk({signal: controller.signal});
            controller.abort();

            await expect(pending).resolves.toBe(false);
        });
    });

    describe("validation and guards", () => {
        it("should throw AppError when parsing empty HTML", async () => {
            await expect(fetchAdapter.parseHTML("")).rejects.toSatisfy(isAppError);
        });

        it("should throw AppError for invalid ISIN in fetchCompanyData", async () => {
            await expect(fetchAdapter.fetchCompanyData("SHORT")).rejects.toSatisfy(
                isAppError
            );
        });

        it("should return empty list for empty online storage", async () => {
            const getStorage = vi.fn();

            const result = await fetchAdapter.fetchMinRateMaxData([], getStorage);

            expect(result.data).toEqual([]);
            expect(getStorage).not.toHaveBeenCalled();
        });

        it("should throw AppError when configured service is unknown", async () => {
            const getStorage = vi.fn(async () => ({
                [BROWSER_STORAGE.SERVICE.key]: "unknown"
            }));

            await expect(
                fetchAdapter.fetchMinRateMaxData(
                    [{id: 1, isin: "US0378331005", min: "0", rate: "0", max: "0", cur: "USD"}],
                    getStorage
                )
            ).rejects.toSatisfy(isAppError);
        });
    });

    describe("ARD detail URL sanitization", () => {
        it("should accept a relative tagesschau detail URL in onclick", () => {
            const onclick =
                "document.location='/wirtschaft/boersenkurse/aktien/irgendwas-123.html';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick))
                .toBe("https://www.tagesschau.de/wirtschaft/boersenkurse/aktien/irgendwas-123.html");
        });

        it("should accept an absolute tagesschau detail URL in onclick", () => {
            const onclick =
                "document.location=\"https://www.tagesschau.de/wirtschaft/boersenkurse/aktien/abc-123.html\";";
            expect(sanitizeArdDetailUrlFromOnclick(onclick))
                .toBe("https://www.tagesschau.de/wirtschaft/boersenkurse/aktien/abc-123.html");
        });

        it("should reject non-https schemes", () => {
            const onclick =
                "document.location='http://www.tagesschau.de/wirtschaft/boersenkurse/aktien/abc.html';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick)).toBeNull();
        });

        it("should reject unexpected hosts", () => {
            const onclick =
                "document.location='https://evil.example/wirtschaft/boersenkurse/aktien/abc.html';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick)).toBeNull();
        });

        it("should reject unexpected paths", () => {
            const onclick =
                "document.location='https://www.tagesschau.de/other/path';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick)).toBeNull();
        });

        it("should reject JavaScript URLs", () => {
            const onclick =
                "document.location='javascript:alert(1)';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick)).toBeNull();
        });
    });

    describe("fetchCompanyData", () => {
        it("should extract company and symbol using resilient selectors (real tradegate.de page structure: header-row+data-row table, not label:value pairs)", async () => {
            const html = `
                <div id="col1_content">
                  <h2>Example AG</h2>
                  <table class="full grid noHeadBorder">
                    <tr><th>WKN</th><th>K&uuml;rzel</th><th>ISIN</th><th>Handelsw&auml;hrung</th></tr>
                    <tr><td>123456</td><td>EXM</td><td>DE0000000001</td><td>EUR</td></tr>
                  </table>
                  <div id="ListRight">
                    <table class="full fixed right lines marketdata">
                      <tr><th>Bid</th><td>1,00</td></tr>
                    </table>
                  </div>
                </div>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: "https://example.test/detail",
                    text: async () => html
                } as unknown as Response);
            });

            const data = await fetchAdapter.fetchCompanyData("DE0000000001");
            expect(data).toEqual({company: "Example AG", symbol: "EXM"});
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should not mistake an unrelated table's row for the symbol row when no header matches", async () => {
            const html = `
                <div id="col1_content">
                  <h2>Example AG</h2>
                  <table>
                    <tr><th>Foo</th><th>Bar</th></tr>
                    <tr><td>1</td><td>2</td></tr>
                  </table>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: "https://example.test/detail",
                    text: async () => html
                } as unknown as Response);
            });

            const data = await fetchAdapter.fetchCompanyData("DE0000000001");
            // No "Kürzel"/"Symbol" header found -> falls back to the scoped
            // table's own row 1 / col 1 ("2"), not a document-global guess.
            expect(data).toEqual({company: "Example AG", symbol: "2"});
        });
    });

    describe("fetchMinRateMaxData (ard)", () => {
        it("should parse ARD detail data using fixed-row fallback extraction", async () => {
            const searchHtml = `
                <div id="desktopSearchResult">
                  <table><tbody>
                    <tr onclick="document.location='/wirtschaft/boersenkurse/aktien/xyz-aktie-123.html';"></tr>
                  </tbody></table>
                </div>
            `;

            const detailHtml = `
                <div id="USFkursdaten">
                  <table><tbody>
                    <tr><td>Wert</td><td>2,00</td></tr>
                    <tr><td>x</td><td>x</td></tr>
                    <tr><td>x</td><td>x</td></tr>
                    <tr><td>x</td><td>x</td></tr>
                    <tr><td>x</td><td>x</td></tr>
                    <tr><td>x</td><td>x</td></tr>
                    <tr><td>Tagestief</td><td>1,00</td></tr>
                    <tr><td>Tageshoch</td><td>3,00</td></tr>
                  </tbody></table>
                </div>
            `;

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(new Response(searchHtml, {status: 200}))
                .mockResolvedValueOnce(new Response(detailHtml, {status: 200}));

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "ard"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "2.00",
                min: "1.00",
                max: "3.00",
                cur: "EUR"
            });
        });
    });

    describe("fetchMinRateMaxData (fnet)", () => {
        it("should extract rate, min and max from tab-region table", async () => {
            const fnetHtml = `
                <main>
                  <div class="tab-region__container">
                    <table><tbody>
                      <tr>
                        <td>Eröffnung / Vortag</td>
                        <td>123,40 / 123,50 EUR</td>
                        <td>BID / ASK</td>
                        <td>123,40 / 123,50</td>
                        <td>x</td><td>x</td><td>x</td><td>x</td>
                        <td>52 Wochen (Hoch/Tief) 1,00 EUR 9,00 EUR</td>
                      </tr>
                    </tbody></table>
                  </div>
                </main>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url) => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => fnetHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "fnet"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "123.45",
                min: "1.00",
                max: "9.00",
                cur: "EUR"
            });
        });
    });

    describe("fetchMinRateMaxData (wstreet)", () => {
        it("should parse rate and 52-week min/max by labels (not fixed row positions)", async () => {
            const searchJson = {
                result: [
                    {
                        link: "/aktien/example-aktie-123"
                    }
                ]
            };

            // Intentionally breaks the old assumptions:
            // - rate table has only one row (old parser required rows[1])
            // - min/max are in a labeled table, not the 'float-start' nodes[1] blob
            const detailHtml = `
                <div class="c2">
                  <table>
                    <tr><td>Kurs</td><td>12,34 €</td></tr>
                  </table>
                </div>
                <div class="fundamental">
                  <table>
                    <tr><td>52-Wochen-Tief</td><td>10,00 €</td></tr>
                    <tr><td>52-Wochen-Hoch</td><td>20,00 €</td></tr>
                  </table>
                </div>
            `;

            let call = 0;
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                call += 1;

                if (call === 1) {
                    // Search RPC request.
                    return Promise.resolve(
                        new Response(JSON.stringify(searchJson), {status: 200})
                    );
                }

                // Detail HTML request.
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(url),
                    text: async () => detailHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "wstreet"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "12.34",
                min: "10.00",
                max: "20.00",
                cur: "EUR"
            });
        });

        it("should parse an ETF page's 52-week min/max from ´div.alpha's own table´, not ´div.omega's´ unrelated Performance table (real page structure)", async () => {
            const searchJson = {
                result: [
                    {
                        link: "/etf/a0rpwh-ishares-core-msci-world-ucits-etf"
                    }
                ]
            };

            // Real structure (captured 2026-08-03, IE00B4L5Y983): on an ETF
            // page, div.omega is repurposed as a fixed-lookback "Performance"
            // table (3 <td> per row: period, price, %-change) with no
            // Hoch/Tief row at all - unlike a stock page, where div.omega
            // holds the 52-week Hoch/Tief rows. The real values live as the
            // last 2 rows of div.alpha's own table instead.
            const detailHtml = `
                <div class="module c2 refreshBox alpha first">
                  <table class="t-data">
                    <tbody>
                      <tr><td>Börsenplatz</td><td class="right wrap">Stuttgart</td></tr>
                      <tr><td>Letzter Kurs</td><td class="right wrap">125,40 <span class="curSymbol">EUR</span></td></tr>
                      <tr><td>Vortageskurs</td><td class="right wrap">124,92 <span class="curSymbol">EUR</span></td></tr>
                      <tr><td>Volumen</td><td class="right wrap">5,78 Tsd.<span class="curSymbol">Stk.</span></td></tr>
                      <tr><td>52-Wochen Hoch</td><td class="right wrap">126,65 <span class="curSymbol">EUR</span></td></tr>
                      <tr><td>52-Wochen Tief</td><td class="right wrap">102,00 <span class="curSymbol">EUR</span></td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="module c2 first omega">
                  <table class="t-data">
                    <tbody>
                      <tr><td>1 Tag</td><td class="right">125,40 EUR</td><td class="right">+0,38 %</td></tr>
                      <tr><td>1 Woche</td><td class="right">125,64 EUR</td><td class="right">-0,19 %</td></tr>
                      <tr><td>1 Monat</td><td class="right">125,73 EUR</td><td class="right">-0,26 %</td></tr>
                      <tr><td>1 Jahr</td><td class="right">102,12 EUR</td><td class="right">+22,80 %</td></tr>
                    </tbody>
                  </table>
                </div>
            `;

            let call = 0;
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                call += 1;

                if (call === 1) {
                    return Promise.resolve(
                        new Response(JSON.stringify(searchJson), {status: 200})
                    );
                }

                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(url),
                    text: async () => detailHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "IE00B4L5Y983", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "wstreet"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "125.40",
                min: "102.00",
                max: "126.65",
                cur: "EUR"
            });
        });
    });

    describe("fetchMinRateMaxData (goyax)", () => {
        it("should parse rate and year high/low by labels (not fixed row positions)", async () => {
            const goyaxHtml = `
                <div id="instrument-ueberblick">
                  <div>
                    <table>
                      <tbody>
                        <tr><td>52 Wochen-Hoch</td><td>9,00</td></tr>
                        <tr><td>52 Wochen-Tief</td><td>1,00</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <ul class="list-rows">
                      <li>Foo</li>
                    </ul>
                    <ul class="list-rows">
                      <li>Bar</li>
                      <li>Kurs (EUR) 2,00</li>
                    </ul>
                  </div>
                </div>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url) => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => goyaxHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "goyax"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "2.00",
                min: "1.00",
                max: "9.00",
                cur: "EUR"
            });
        });

        it("should parse 52-week high/low from the real 'Statistiken' matrix table (no combined 52-week label exists on the live site)", async () => {
            const goyaxHtml = `
                <div id="instrument-ueberblick">
                  <div>
                    <table>
                      <tbody>
                        <tr><td>unused</td></tr>
                      </tbody>
                    </table>
                    <div class="instrument-statistik">
                      <table>
                        <thead>
                          <tr><th></th><th>7 Tage</th><th>1 Monat</th><th>6 Monate</th><th>1 Jahr</th><th>3 Jahre</th><th>5 Jahre</th></tr>
                        </thead>
                        <tbody>
                          <tr><th>Performance [%]</th><td>+9,06</td><td>+18,00</td><td>-1,71</td><td>-33,06</td><td>+35,71</td><td>+34,25</td></tr>
                          <tr><th>Hoch</th><td>164,72</td><td>164,72</td><td>178,98</td><td>257,70</td><td>283,95</td><td>283,95</td></tr>
                          <tr><th>Tief</th><td>141,82</td><td>127,52</td><td>127,52</td><td>127,52</td><td>120,02</td><td>79,59</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <ul class="list-rows">
                      <li>Foo</li>
                    </ul>
                    <ul class="list-rows">
                      <li>Bar</li>
                      <li>Kurs (EUR) 164,24</li>
                    </ul>
                  </div>
                </div>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url) => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => goyaxHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0007164600", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "goyax"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "164.24",
                min: "127.52",
                max: "257.70",
                cur: "EUR"
            });
        });

        it("reports the currency detected on the page, not a hardcoded EUR", async () => {
            // extractGoyaxRate detects the currency (and its doc comment says the
            // old hardcoded EUR was the bug), but goyaxFetcher used to destructure
            // it away and return DEFAULT_CURRENCY regardless. A truthy `cur`
            // suppresses useOnlineStockData's ISIN-based USD fallback AND makes
            // stockCur === uiCur yield a divisor of 1, so a USD-quoted instrument
            // was carried into mValue/mEuroChange/the depot total unconverted.
            // The two tests above both use EUR markup, so neither discriminates.
            const goyaxHtml = `
                <div id="instrument-ueberblick">
                  <div>
                    <table><tbody>
                      <tr><td>52 Wochen-Hoch</td><td>9,00</td></tr>
                      <tr><td>52 Wochen-Tief</td><td>1,00</td></tr>
                    </tbody></table>
                  </div>
                  <div>
                    <ul class="list-rows"><li>Foo</li></ul>
                    <ul class="list-rows">
                      <li>Bar</li>
                      <li>Kurs (USD) 2,00 $</li>
                    </ul>
                  </div>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation((_url) =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => goyaxHtml
                } as unknown as Response)
            );

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "US0378331005", min: "0", rate: "0", max: "0", cur: ""}],
                async (keys) =>
                    (keys ?? []).includes(BROWSER_STORAGE.SERVICE.key)
                        ? {[BROWSER_STORAGE.SERVICE.key]: "goyax"}
                        : {}
            );

            expect(result.data[0]).toMatchObject({id: 1, cur: "USD"});
        });

        it("still falls back to EUR when the page carries no currency marker", async () => {
            const goyaxHtml = `
                <div id="instrument-ueberblick">
                  <div>
                    <table><tbody>
                      <tr><td>52 Wochen-Hoch</td><td>9,00</td></tr>
                      <tr><td>52 Wochen-Tief</td><td>1,00</td></tr>
                    </tbody></table>
                  </div>
                  <div>
                    <ul class="list-rows"><li>Foo</li></ul>
                    <ul class="list-rows">
                      <li>Bar</li>
                      <li>Kurs 2,00</li>
                    </ul>
                  </div>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation((_url) =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => goyaxHtml
                } as unknown as Response)
            );

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0007164600", min: "0", rate: "0", max: "0", cur: ""}],
                async (keys) =>
                    (keys ?? []).includes(BROWSER_STORAGE.SERVICE.key)
                        ? {[BROWSER_STORAGE.SERVICE.key]: "goyax"}
                        : {}
            );

            expect(result.data[0]).toMatchObject({id: 1, cur: "EUR"});
        });
    });

    describe("fetchMinRateMaxData (acheck)", () => {
        it("should handle dot-decimal min/max and detect currency (real page structure, header + one data row, verified against live m.aktiencheck.de markup 2026-08)", async () => {
            const acheckHtml = `
                <div id="content">
                  <table>
                    <tbody>
                      <tr><td>Letzter</td><td>Vortag</td><td>Umsatz</td><td>Veränderung</td></tr>
                      <tr style="font-weight: bold;"><td>247,18</td><td>245,00</td><td>6,76&nbsp;Mrd $</td><td>+0,89%</td></tr>
                    </tbody>
                  </table>
                  <table><tbody><tr><td>unused</td></tr></tbody></table>
                  <table>
                    <tbody>
                      <tr><td>Zeitraum</td><td>Hoch</td><td>Tief</td></tr>
                      <tr><td>Intraday</td><td>215.95</td><td>213.35</td></tr>
                      <tr><td>Akt. Jahr</td><td>237.6</td><td>207.8</td></tr>
                      <tr><td>52 Wochen</td><td>247.55</td><td>152</td></tr>
                    </tbody>
                  </table>
                </div>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url) => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => acheckHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "US0378331005", min: "0", rate: "0", max: "0", cur: "USD"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "acheck"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            // The quote is USD ("6,76 Mrd $") but the Hoch/Tief table carries no
            // currency marker and is the EUR listing — note Intraday 215.95
            // against a last trade of 247,18. The range is therefore reported as
            // unknown rather than being FX-divided as if it were USD.
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "247.18",
                min: "0",
                max: "0",
                cur: "USD"
            });
        });

        it("should parse rate/min/max by labels and detect currency beyond fixed cells", async () => {
            const acheckHtml = `
                <div id="content">
                  <table>
                    <tbody>
                      <tr><td>Something else</td><td>n/a</td></tr>
                      <tr><td>Kurs</td><td>3,00</td><td>$</td></tr>
                    </tbody>
                  </table>
                  <table><tbody><tr><td>unused</td></tr></tbody></table>
                  <table>
                    <tbody>
                      <tr><td>Other</td><td>n/a</td></tr>
                      <tr><td>52 Wochen-Hoch</td><td>5,00</td></tr>
                      <tr><td>52 Wochen-Tief</td><td>1,00</td></tr>
                    </tbody>
                  </table>
                </div>
            `;

            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url) => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => acheckHtml
                } as unknown as Response);
            });

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    const k = keys ?? [];
                    if (k.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "acheck"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            // Currency is detected as USD from the "$" beside the rate, so the
            // unlabelled 52-week range is suppressed (see acheck.ts).
            expect(result.data[0]).toMatchObject({
                id: 1,
                rate: "3.00",
                min: "0",
                max: "0",
                cur: "USD"
            });
        });

        it("falls through to the fixed-cell tier for the side the label scan missed", async () => {
            // The label scan below finds only "Hoch"; the tier gate used to accept
            // that partial result (an `||`, where goyax's equivalent requires
            // both) and skip the fixed-structure fallback that carries the low.
            // The fallback must fill in ONLY the missing side, never overwrite the
            // one already found.
            const acheckHtml = `
                <div id="content">
                  <table>
                    <tbody>
                      <tr><td>Something else</td><td>n/a</td></tr>
                      <tr><td>Kurs</td><td>3,00</td><td>€</td></tr>
                    </tbody>
                  </table>
                  <table><tbody><tr><td>unused</td></tr></tbody></table>
                  <table>
                    <tbody>
                      <tr><td>Other</td><td>n/a</td></tr>
                      <tr><td>52 Wochen-Hoch</td><td>5,00</td></tr>
                      <tr><td>filler</td><td>n/a</td></tr>
                      <tr><td>ignored</td><td>9,00</td><td>1,00</td></tr>
                    </tbody>
                  </table>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation((_url) =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    url: String(_url),
                    text: async () => acheckHtml
                } as unknown as Response)
            );

            const result = await fetchAdapter.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) =>
                    (keys ?? []).includes(BROWSER_STORAGE.SERVICE.key)
                        ? {[BROWSER_STORAGE.SERVICE.key]: "acheck"}
                        : {}
            );

            // max stays the label scan's 5,00 (NOT overwritten by the fixed
            // tier's 9,00); min is filled in from the fixed tier's cell.
            expect(result.data[0]).toMatchObject({id: 1, max: "5.00", min: "1.00"});
        });
    });

    describe("fetchIndexData", () => {
        it("should extract index values even when the link wraps the value in nested markup", async () => {
            const indexHtml = `
                <div class="index-world-map">
                  <a title="DAX"><span><strong>18.123,45</strong></span></a>
                  <a title="DJI">42.000,00</a>
                </div>
            `;

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response(indexHtml, {status: 200}));

            const result = await fetchAdapter.fetchIndexData();

            // Should not depend on exact SETTINGS mapping, but must return at least one number.
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.some((r) => Number.isFinite(r.value))).toBe(true);
        });

        it("ignores a link that carries no title instead of matching every index with it", async () => {
            // `SETTINGS.INDEXES[property].includes(title || "")` degenerates to
            // `"DAX".includes("")`, which is true — so one untitled link holding any
            // parseable number was attributed to the first index tested, and, since
            // it matched every other property equally, would have filled every
            // configured index with that single bogus value.
            const indexHtml = `
                <div class="index-world-map">
                  <a>99.999,99</a>
                  <a title="DAX">18.123,45</a>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(indexHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchIndexData();

            // The untitled link's number must appear nowhere in the result...
            expect(result.every((r) => r.value !== 99999.99)).toBe(true);
            // ...and exactly one index (dax) is resolved, not all of them.
            expect(result).toEqual([{key: "dax", value: 18123.45}]);
        });

        // The fallback match is a containment test, so a short scraped title can
        // satisfy several configured labels — "S&P" is inside both "S&P 500"
        // (sp) and "S&P/TSX" (tsx). Each property used to scan the links
        // independently and take the first hit, so ONE link's value was reported
        // as the current level of two different indexes.
        it("does not let one link be claimed by two indexes", async () => {
            const indexHtml = `
                <div class="index-world-map">
                  <a title="S&P">5.500,00</a>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(indexHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchIndexData();

            expect(result).toHaveLength(1);
            expect(result[0].value).toBe(5500);
        });

        // An exact title is searched for across every candidate before falling
        // back to containment, so the specific index wins over one that merely
        // contains its name.
        it("prefers an exact title match over a contained one", async () => {
            const indexHtml = `
                <div class="index-world-map">
                  <a title="S&P">1,00</a>
                  <a title="S&P 500">5.500,00</a>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(indexHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchIndexData();

            expect(result).toContainEqual({key: "sp", value: 5500});
        });

        // Comparison is trimmed and case-folded; it used to be neither, so a
        // title differing from its label only in case or padding matched nothing.
        it("matches a title that differs only in case or padding", async () => {
            const indexHtml = `
                <div class="index-world-map">
                  <a title="  dax  ">18.123,45</a>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(indexHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchIndexData();

            expect(result).toEqual([{key: "dax", value: 18123.45}]);
        });

        it("defaults to finanzen.net when no provider is given, unchanged from before the wstreet option existed", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    `<div class="index-world-map"><a title="DAX">18.123,45</a></div>`,
                    {status: 200}
                )
            );

            await fetchAdapter.fetchIndexData();

            expect(fetchMock).toHaveBeenCalledWith(
                "https://www.finanzen.net/indizes/",
                expect.anything()
            );
        });

        it("delegates to the wstreet per-index fetcher when that provider is selected, without touching finanzen.net", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                const href = typeof url === "string" ? url : url.toString();
                const parsedUrl = new URL(href);
                if (parsedUrl.protocol === "https:" && parsedUrl.hostname === "www.finanzen.net") {
                    throw new Error("must not call finanzen.net when provider is wstreet");
                }
                return Promise.resolve(
                    new Response(
                        `<div id="quoteBoxMarker">
                            <div class="quoteValue"><span>26.107,51</span></div>
                        </div>`,
                        {status: 200}
                    )
                );
            });

            const result = await fetchAdapter.fetchIndexData(undefined, "wstreet");

            expect(result.length).toBeGreaterThan(0);
            expect(fetchMock.mock.calls.every(([url]) => {
                const href = typeof url === "string" ? url : (url as URL).toString();
                return href.startsWith("https://www.wallstreet-online.de/indizes/");
            })).toBe(true);
        });
    });

    describe("fetchExchangesData", () => {
        it("should correctly parse a data-rate value in scientific notation (real fx-rate.net markup for low-value currencies like VND/IDR/IRR)", async () => {
            const fxHtml = `
                <div class="display_area parameters" data-amount="1"
                    data-rate="3.80749993431E-5"
                    data-currency="VND"
                    data-currency_pair="USD">
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(fxHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchExchangesData(["VNDUSD"]);

            expect(result).toEqual([{key: "VNDUSD", value: 3.80749993431e-5}]);
        });

        it("should still parse a plain decimal data-rate value", async () => {
            const fxHtml = `
                <div class="display_area parameters" data-amount="1" data-rate="1.0854"></div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(fxHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchExchangesData(["EURUSD"]);

            expect(result).toEqual([{key: "EURUSD", value: 1.0854}]);
        });
    });

    describe("fetchDateData", () => {
        it("should match row-type cells despite surrounding whitespace in the label cell", async () => {
            const datesHtml = `
                <div class="table">ignored, only used for tables.length check</div>
                <div class="table">
                  <table><tbody>
                    <tr><td>\n  Quartalszahlen  \n</td><td>x</td><td>x</td><td>15.05.2025</td></tr>
                    <tr><td>\n  Hauptversammlung  \n</td><td>x</td><td>x</td><td>20.06.2025</td></tr>
                  </tbody></table>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                const urlString = String(url);
                if (urlString.includes("suchergebnis")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        url: "https://www.finanzen.net/aktien/example-aktie",
                        text: async () => ""
                    } as unknown as Response);
                }
                return Promise.resolve(new Response(datesHtml, {status: 200}));
            });

            const [result] = await fetchAdapter.fetchDateData([{key: 1, value: "Example"}]);

            expect(result?.value.qf).toBe(Date.UTC(2025, 4, 15));
            expect(result?.value.gm).toBe(Date.UTC(2025, 5, 20));
        });

        // A failed lookup must be OMITTED, not reported as {gm: 0, qf: 0}.
        // useOnlineStockData cannot otherwise tell "the fetch failed" from
        // "this stock genuinely has no dates": it overwrote cMeetingDay/
        // cQuarterDay with DATE.ISO ("1970-01-01"), PERSISTED that, and pushed
        // cAskDates 7 days out — so a transient network blip destroyed
        // correct stored dates and then blocked any retry for a week.
        it("omits an entry whose lookup failed, so the caller leaves its stored dates alone", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

            const result = await fetchAdapter.fetchDateData([{key: 1, value: "Example"}]);

            expect(result).toEqual([]);
        });

        it("still reports a successful lookup that found no dates, so its 7-day throttle applies", async () => {
            // Two ".table" elements so the tables.length >= 2 guard passes, but
            // no Quartalszahlen/Hauptversammlung rows to find.
            const emptyDatesHtml = `
                <div class="table">ignored</div>
                <div class="table"><table><tbody>
                  <tr><td>Sonstiges</td><td>x</td><td>x</td><td>15.05.2025</td></tr>
                </tbody></table></div>
            `;

            vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                const urlString = String(url);
                if (urlString.includes("suchergebnis")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        url: "https://www.finanzen.net/aktien/example-aktie",
                        text: async () => ""
                    } as unknown as Response);
                }
                return Promise.resolve(new Response(emptyDatesHtml, {status: 200}));
            });

            const result = await fetchAdapter.fetchDateData([{key: 1, value: "Example"}]);

            expect(result).toEqual([{key: 1, value: {gm: 0, qf: 0}}]);
        });

        it("keeps successful entries when a sibling entry's lookup fails", async () => {
            vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                const urlString = String(url);
                if (urlString.includes("Broken")) {
                    return Promise.reject(new Error("network down"));
                }
                if (urlString.includes("suchergebnis")) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        url: "https://www.finanzen.net/aktien/example-aktie",
                        text: async () => ""
                    } as unknown as Response);
                }
                return Promise.resolve(
                    new Response(
                        `<div class="table">x</div>
                         <div class="table"><table><tbody>
                           <tr><td>Quartalszahlen</td><td>x</td><td>x</td><td>15.05.2025</td></tr>
                         </tbody></table></div>`,
                        {status: 200}
                    )
                );
            });

            const result = await fetchAdapter.fetchDateData([
                {key: 1, value: "Broken"},
                {key: 2, value: "Example"}
            ]);

            // Only the failed one is dropped; the good one survives with its data.
            expect(result.map((r) => r.key)).toEqual([2]);
            expect(result[0].value.qf).toBe(Date.UTC(2025, 4, 15));
        });
    });

    describe("fetchMaterialData", () => {
        it("should parse material prices using table cells (not children indices) and ignore extra columns", async () => {
            const materialHtml = `
                <div id="commodity_prices">
                  <table><tbody>
                    <tr><td>Gold</td><td>2.345,67</td><td>ignored</td></tr>
                    <tr><td>Brent</td><td>80,12 USD</td><td>ignored</td></tr>
                  </tbody></table>
                </div>
            `;

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response(materialHtml, {status: 200}));

            const result = await fetchAdapter.fetchMaterialData();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual(
                expect.arrayContaining([
                    {key: "Gold", value: 2345.67},
                    {key: "Brent", value: 80.12}
                ])
            );
        });

        it("should skip a row instead of reporting a phantom 0 price when the value cell has no parseable number", async () => {
            const materialHtml = `
                <div id="commodity_prices">
                  <table><tbody>
                    <tr><td>Gold</td><td>2.345,67</td></tr>
                    <tr><td>Silver</td><td>n/a</td></tr>
                  </tbody></table>
                </div>
            `;

            vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(materialHtml, {status: 200})
            );

            const result = await fetchAdapter.fetchMaterialData();

            expect(result).toEqual([{key: "Gold", value: 2345.67}]);
        });

        it("defaults to finanzen.net when no provider is given, unchanged from before the wstreet option existed", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
                new Response(
                    `<div id="commodity_prices"><table><tbody>
                        <tr><td>Gold</td><td>2.345,67</td></tr>
                    </tbody></table></div>`,
                    {status: 200}
                )
            );

            await fetchAdapter.fetchMaterialData();

            expect(fetchMock).toHaveBeenCalledWith(
                "https://www.finanzen.net/rohstoffe/",
                expect.anything()
            );
        });

        it("delegates to the wstreet per-material fetcher when that provider is selected, without touching finanzen.net", async () => {
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
                const href = typeof url === "string" ? url : url.toString();
                if (href.startsWith("https://www.finanzen.net")) {
                    throw new Error("must not call finanzen.net when provider is wstreet");
                }
                return Promise.resolve(
                    new Response(
                        `<div id="quoteBoxMarker">
                            <div class="quoteValue"><span>1.234,56</span></div>
                            <div class="quote_currency">USD</div>
                        </div>`,
                        {status: 200}
                    )
                );
            });

            const result = await fetchAdapter.fetchMaterialData(undefined, "wstreet");

            expect(result.length).toBeGreaterThan(0);
            expect(fetchMock.mock.calls.every(([url]) => {
                const href = typeof url === "string" ? url : (url as URL).toString();
                return href.startsWith("https://www.wallstreet-online.de/rohstoffe/");
            })).toBe(true);
        });
    });
});
