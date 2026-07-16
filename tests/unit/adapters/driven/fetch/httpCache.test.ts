/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {clearCache, getCache, getCacheStats, setCache} from "@/adapters/driven/fetch/httpCache";

// The module keeps a single process-wide cache Map, so each test must start
// from a clean slate and restore real timers afterward.
describe("adapters/driven/fetch/httpCache", () => {
    beforeEach(() => {
        clearCache();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns null for a key that was never set", () => {
        expect(getCache("missing")).toBeNull();
    });

    it("returns a previously cached value", () => {
        setCache("key", "value");
        expect(getCache("key")).toBe("value");
    });

    it("expires an entry once its age exceeds the given TTL", () => {
        vi.useFakeTimers();
        setCache("key", "value");

        vi.advanceTimersByTime(1001); // strictly greater than the 1000ms TTL
        expect(getCache("key", 1000)).toBeNull();
    });

    it("keeps an entry that is younger than the given TTL", () => {
        vi.useFakeTimers();
        setCache("key", "value");

        vi.advanceTimersByTime(999);
        expect(getCache("key", 1000)).toBe("value");
    });

    it("deletes an expired entry on read so it does not linger in stats", () => {
        vi.useFakeTimers();
        setCache("key", "value");
        vi.advanceTimersByTime(1001);

        getCache("key", 1000);

        expect(getCacheStats().keys).not.toContain("key");
    });

    it("clearCache() removes every entry", () => {
        setCache("a", "1");
        setCache("b", "2");

        clearCache();

        expect(getCacheStats()).toEqual({size: 0, keys: []});
    });

    it("getCacheStats() reports the current size and keys", () => {
        setCache("a", "1");
        setCache("b", "2");

        const stats = getCacheStats();
        expect(stats.size).toBe(2);
        expect(stats.keys.sort()).toEqual(["a", "b"]);
    });

    it("prunes expired entries once the cache grows past 100 items", () => {
        vi.useFakeTimers();

        // One stale entry, added before the default TTL window.
        setCache("stale", "old");
        vi.advanceTimersByTime(6 * 60 * 1000); // > DEFAULT_HTTP_TTL_MS (5 min)

        // Fill past the 100-item cleanup threshold with fresh entries.
        for (let i = 0; i < 100; i++) {
            setCache(`fresh-${i}`, String(i));
        }

        expect(getCacheStats().keys).not.toContain("stale");
        expect(getCache("fresh-99")).toBe("99");
    });
});