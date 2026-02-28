/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {fetchService} from "./fetch";
import {AppError} from "@/domains/errors";
import {BROWSER_STORAGE} from "@/domains/configs/storage";

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
            ).rejects.toBeInstanceOf(AppError);
            expect(fetchMock).toHaveBeenCalledTimes(1);
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
            await expect(fetchService.parseHTML("")).rejects.toBeInstanceOf(AppError);
        });

        it("should throw AppError for invalid ISIN in fetchCompanyData", async () => {
            await expect(fetchService.fetchCompanyData("SHORT")).rejects.toBeInstanceOf(
                AppError
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
            ).rejects.toBeInstanceOf(AppError);
        });
    });
});
