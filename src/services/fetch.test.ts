/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {fetchService} from "@/services/fetch";
import {sanitizeArdDetailUrlFromOnclick} from "@/services/fetch";
import {isAppError} from "@/domains/errors";
import {BROWSER_STORAGE} from "@/constants";

describe("FetchService", () => {
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
        fetchService.clearCache();
    });

    describe("fetchWithRetry", () => {
        it("should return response immediately when request succeeds", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("ok", {status: 200}));

            const response = await fetchService.fetchWithRetry("https://example.test");

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("should retry for retryable status codes", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(new Response("fail", {status: 500}))
                .mockResolvedValueOnce(new Response("ok", {status: 200}));

            const response = await fetchService.fetchWithRetry("https://example.test");

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it("should throw AppError for non-retryable failures", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("missing", {status: 404}));

            await expect(
                fetchService.fetchWithRetry("https://example.test")
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

            const promise = fetchService.fetchWithRetry(
                "https://example.test",
                {signal: caller.signal},
                3
            );
            // Attach the rejection handler immediately to avoid unhandledRejection
            // warnings while we advance fake timers.
            const assertion = expect(promise).rejects.toSatisfy(isAppError);

            // 30s internal timeout + 1s + 2s backoff between retries (3 attempts).
            await vi.advanceTimersByTimeAsync(33_000);

            await assertion;
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });
    });

    describe("fetchWithCache", () => {
        it("should return cached response for repeated key within ttl", async () => {
            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValue(new Response("cached", {status: 200}));

            const first = await fetchService.fetchWithCache(
                "cache-key",
                "https://example.test/data"
            );
            const second = await fetchService.fetchWithCache(
                "cache-key",
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

            const first = await fetchService.fetchWithCache(
                "ttl-key",
                "https://example.test/data",
                1_000
            );

            vi.setSystemTime(new Date("2026-01-01T00:00:00.500Z"));
            const second = await fetchService.fetchWithCache(
                "ttl-key",
                "https://example.test/data",
                1_000
            );

            vi.setSystemTime(new Date("2026-01-01T00:00:02.000Z"));
            const third = await fetchService.fetchWithCache(
                "ttl-key",
                "https://example.test/data",
                1_000
            );

            expect(first).toBe("first");
            expect(second).toBe("first");
            expect(third).toBe("second");
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe("validation and guards", () => {
        it("should throw AppError when parsing empty html", async () => {
            await expect(fetchService.parseHTML("")).rejects.toSatisfy(isAppError);
        });

        it("should throw AppError for invalid ISIN in fetchCompanyData", async () => {
            await expect(fetchService.fetchCompanyData("SHORT")).rejects.toSatisfy(
                isAppError
            );
        });

        it("should return empty list for empty online storage", async () => {
            const getStorage = vi.fn();

            const result = await fetchService.fetchMinRateMaxData([], getStorage);

            expect(result).toEqual([]);
            expect(getStorage).not.toHaveBeenCalled();
        });

        it("should throw AppError when configured service is unknown", async () => {
            const getStorage = vi.fn(async () => ({
                [BROWSER_STORAGE.SERVICE.key]: "unknown"
            }));

            await expect(
                fetchService.fetchMinRateMaxData(
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

        it("should reject javascript URLs", () => {
            const onclick =
                "document.location='javascript:alert(1)';";
            expect(sanitizeArdDetailUrlFromOnclick(onclick)).toBeNull();
        });
    });

    describe("fetchCompanyData", () => {
        it("should extract company and symbol using resilient selectors", async () => {
            const html = `
                <div id="col1_content">
                  <h1>Example AG, Inhaber-Stammaktien</h1>
                </div>
                <table><tbody>
                  <tr><td>WKN</td><td>123456</td></tr>
                  <tr><td>Symbol</td><td>EXM</td></tr>
                </tbody></table>
            `;

            let call = 0;
            const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
                call += 1;
                // First call returns a redirect-like response (we only need `url`).
                if (call === 1) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        url: "https://example.test/detail"
                    } as unknown as Response);
                }

                // Second call returns the HTML body.
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    url: "https://example.test/detail",
                    text: async () => html
                } as unknown as Response);
            });

            const data = await fetchService.fetchCompanyData("DE0000000001");
            expect(data).toEqual({company: "Example AG", symbol: "EXM"});
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe("fetchMinRateMaxData (ard)", () => {
        it("should parse ARD detail data by labels even when row order/size changes", async () => {
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
                    <tr><td>Tageshoch</td><td>3,00€</td></tr>
                    <tr><td>Kurs</td><td>2,00€</td></tr>
                    <tr><td>Tagestief</td><td>1,00€</td></tr>
                  </tbody></table>
                </div>
            `;

            const fetchMock = vi
                .spyOn(globalThis, "fetch")
                .mockResolvedValueOnce(new Response(searchHtml, {status: 200}))
                .mockResolvedValueOnce(new Response(detailHtml, {status: 200}));

            const result = await fetchService.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    if (keys.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "ard"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 1,
                rate: "2.00",
                min: "1.00",
                max: "3.00",
                cur: "EUR"
            });
        });
    });

    describe("fetchMinRateMaxData (fnet)", () => {
        it("should extract min/max even when the target row has fewer columns", async () => {
            const fnetHtml = `
                <div id="snapshot-value-fst-current-0">123,45 EUR</div>
                <main>
                  <div class="accordion__content">
                    <table><tbody>
                      <tr><td>Zeitraum</td><td>Foo</td><td>1,23</td><td>4,56</td></tr>
                      <tr><td>1 Jahr</td><td>Foo</td><td>1,00</td><td>9,00</td></tr>
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

            const result = await fetchService.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    if (keys.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "fnet"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result[0]).toMatchObject({
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

            const result = await fetchService.fetchMinRateMaxData(
                [{id: 1, isin: "DE0000000001", min: "0", rate: "0", max: "0", cur: "EUR"}],
                async (keys) => {
                    if (keys.includes(BROWSER_STORAGE.SERVICE.key)) {
                        return {[BROWSER_STORAGE.SERVICE.key]: "wstreet"};
                    }
                    return {};
                }
            );

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 1,
                rate: "12.34",
                min: "10.00",
                max: "20.00",
                cur: "EUR"
            });
        });
    });
});
