/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
    fetchTextWithCacheFollowRedirect,
    fetchWithCache,
    fetchWithRetry,
    parseHTML
} from "@/adapters/driven/fetch/httpClient";
import {clearCache} from "@/adapters/driven/fetch/httpCache";

describe("httpClient", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        clearCache();
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe("fetchWithRetry", () => {
        it("returns the response on the first successful attempt", async () => {
            fetchMock.mockResolvedValue({ok: true, status: 200} as Response);

            const response = await fetchWithRetry("https://example.com");

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("does not retry a non-retryable 4xx response and rejects", async () => {
            fetchMock.mockResolvedValue({ok: false, status: 404} as Response);

            await expect(fetchWithRetry("https://example.com", {}, 3)).rejects.toThrow();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("retries a 5xx response and succeeds on a later attempt", async () => {
            vi.useFakeTimers();
            fetchMock
                .mockResolvedValueOnce({ok: false, status: 503} as Response)
                .mockResolvedValueOnce({ok: true, status: 200} as Response);

            const promise = fetchWithRetry("https://example.com", {}, 3);
            await vi.advanceTimersByTimeAsync(1000);
            const response = await promise;

            expect(response.ok).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it("exhausts retries and rejects when a 5xx response never recovers", async () => {
            vi.useFakeTimers();
            fetchMock.mockResolvedValue({ok: false, status: 500} as Response);

            const promise = fetchWithRetry("https://example.com", {}, 2);
            const expectation = expect(promise).rejects.toThrow();
            await vi.advanceTimersByTimeAsync(1000);

            await expectation;
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it("stops immediately without retrying when the caller's signal is already aborted", async () => {
            const controller = new AbortController();
            controller.abort();
            fetchMock.mockRejectedValue(new Error("aborted"));

            await expect(
                fetchWithRetry("https://example.com", {signal: controller.signal}, 3)
            ).rejects.toThrow();
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("gives up via its internal 30-second timeout when the network call never settles", async () => {
            vi.useFakeTimers();
            fetchMock.mockImplementation(
                (_url: string, opts: RequestInit) =>
                    new Promise((_resolve, reject) => {
                        const signal = opts.signal as AbortSignal;
                        if (signal.aborted) {
                            reject(signal.reason);
                            return;
                        }
                        signal.addEventListener("abort", () => reject(signal.reason), {once: true});
                    })
            );

            const promise = fetchWithRetry("https://example.com", {}, 1);
            const expectation = expect(promise).rejects.toThrow();
            await vi.advanceTimersByTimeAsync(30_000);

            await expectation;
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("fetchWithCache", () => {
        it("fetches and caches on a miss", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue("<html>fresh</html>")
            } as unknown as Response);

            const result = await fetchWithCache("https://example.com/page");

            expect(result).toBe("<html>fresh</html>");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("returns cached content on a hit without calling fetch again", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue("<html>fresh</html>")
            } as unknown as Response);

            await fetchWithCache("https://example.com/page");
            const result = await fetchWithCache("https://example.com/page");

            expect(result).toBe("<html>fresh</html>");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("fetchTextWithCacheFollowRedirect", () => {
        it("caches the response under both the original and the redirected URL", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                url: "https://example.com/final",
                text: vi.fn().mockResolvedValue("<html>redirected</html>")
            } as unknown as Response);

            const first = await fetchTextWithCacheFollowRedirect("https://example.com/original");
            expect(first).toBe("<html>redirected</html>");
            expect(fetchMock).toHaveBeenCalledTimes(1);

            const second = await fetchTextWithCacheFollowRedirect("https://example.com/original");
            const third = await fetchWithCache("https://example.com/final");

            expect(second).toBe("<html>redirected</html>");
            expect(third).toBe("<html>redirected</html>");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("parseHTML", () => {
        it("throws on empty input", async () => {
            await expect(parseHTML("")).rejects.toThrow();
        });

        it("parses HTML text into a Document", async () => {
            const doc = await parseHTML("<html><body><p>hi</p></body></html>");
            expect(doc.querySelector("p")?.textContent).toBe("hi");
        });
    });
});