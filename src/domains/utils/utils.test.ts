/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it, vi} from "vitest";
import {createCleanup, debounce, detectNumberFormat, haveSameStrings, isoDate, isValidISODate, mean, memorize, normalizeBookingTypeName, normalizeNumber, throttle, toNumber, utcDate} from "@/domains/utils/utils";
import {AppError, ERROR_CODES, isAppError} from "@/domains/errors";

describe("DomainUtils: dates", () => {
    it("utcDate should return midnight UTC for valid ISO date", () => {
        const d = utcDate("2026-02-02");
        expect(d.toISOString()).toBe("2026-02-02T00:00:00.000Z");
    });

    it("utcDate should throw AppError for invalid ISO date", () => {
        expect(() => utcDate("2026-13-40")).toThrow();
        try {
            utcDate("2026-13-40");
        } catch (e) {
            expect(isAppError(e)).toBe(true);
            expect((e as AppError).code).toBe(ERROR_CODES.UTILS.A);
        }
    });

    it("isoDate should return YYYY-MM-DD for a valid timestamp", () => {
        const ms = Date.UTC(2026, 1, 2); // 2026-02-02T00:00:00.000Z
        expect(isoDate(ms)).toBe("2026-02-02");
    });

    it("isoDate should throw on invalid timestamp", () => {
        expect(() => isoDate(Number.NaN)).toThrow();
        try {
            isoDate(Number.NaN);
        } catch (e) {
            expect(isAppError(e)).toBe(true);
            expect((e as AppError).code).toBe(ERROR_CODES.UTILS.B);
        }
    });

    it("isValidISODate should validate correctly", () => {
        expect(isValidISODate("2026-02-02")).toBe(true);
        expect(isValidISODate("2026-13-40")).toBe(false);
        expect(isValidISODate("")).toBe(false);
    });
});

describe("DomainUtils: numbers and parsing", () => {
    it("toNumber should parse DE format", () => {
        expect(toNumber("1.234,56", {locale: "de"})).toBeCloseTo(
            1234.56,
            6
        );
    });

    it("toNumber should parse EN format", () => {
        expect(toNumber("1,234.56", {locale: "en"})).toBeCloseTo(
            1234.56,
            6
        );
    });

    it("toNumber should parse percentage and whitespace", () => {
        expect(toNumber("  25%\t ")).toBe(25);
    });

    it("toNumber should auto-detect number format", () => {
        // Only dots -> en
        expect(toNumber("1234.5")).toBeCloseTo(1234.5, 6);
        // Comma near the end -> de
        expect(toNumber("1,23")).toBeCloseTo(1.23, 6);
    });

    it("toNumber should return fallback and optionally throw on error", () => {
        expect(toNumber("xx", {fallback: 7})).toBe(7);
        expect(() => toNumber("xx", {throwOnError: true})).toThrow();
        try {
            toNumber("xx", {throwOnError: true});
        } catch (e) {
            expect(isAppError(e)).toBe(true);
            expect((e as AppError).code).toBe(ERROR_CODES.UTILS.C);
        }
    });

    it("detectNumberFormat should determine locale heuristically", () => {
        expect(detectNumberFormat("1.234")).toBe("en");
        expect(detectNumberFormat("1,234")).toBe("de");
        expect(detectNumberFormat("1,234.56")).toBe("en");
        expect(detectNumberFormat("1.234,56")).toBe("de");
    });

    it("normalizeNumber should transform to parseFloat-friendly string", () => {
        expect(normalizeNumber("1.234,56", "de")).toBe("1234.56");
        expect(normalizeNumber("1,234.56", "en")).toBe("1234.56");
    });
});

describe("DomainUtils: strings and collections", () => {
    it("normalizeBookingTypeName should trim/collapse", () => {
        expect(normalizeBookingTypeName("  Foo   BAR  ")).toBe(
            "Foo BAR"
        );
    });

    it("mean should ignore zeros and non-finite values", () => {
        expect(
            mean([0, 1, 2, Number.NaN, Number.POSITIVE_INFINITY, 3])
        ).toBeCloseTo(2, 6);
    });

    it("haveSameStrings should compare sets regardless of order", () => {
        expect(haveSameStrings(["a", "b"], ["b", "a"])).toBeTruthy();
        expect(haveSameStrings(["a", "b"], ["a", "c"])).toBeFalsy();
        expect(haveSameStrings(["a"], ["a", "a"])).toBeFalsy();
    });
});

describe("DomainUtils: helpers (debounce/throttle/memorize/cleanup)", () => {
    it("debounce should delay calls and execute last invocation", () => {
        vi.useFakeTimers();
        const spy = vi.fn();
        const debounced = debounce(spy, 200);

        debounced();
        debounced();
        debounced();

        // Before delay, not called
        expect(spy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(199);
        expect(spy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(spy).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it("throttle should limit calls within a window", () => {
        vi.useFakeTimers();
        const spy = vi.fn();
        const throttled = throttle(spy, 100);

        throttled();
        throttled();
        throttled();
        expect(spy).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(100);
        throttled();
        expect(spy).toHaveBeenCalledTimes(2);
        vi.useRealTimers();
    });

    it("memorize should cache results by arguments", () => {
        const base = vi.fn((a: number, b: number) => a + b);
        const memo = memorize(base);

        expect(memo(1, 2)).toBe(3);
        expect(memo(1, 2)).toBe(3);
        expect(base).toHaveBeenCalledTimes(1);
    });

    it("createCleanup should collect and run teardowns", () => {
        const c = createCleanup();
        const a = vi.fn();
        const b = vi.fn();
        c.add(a);
        c.add(b);
        c.cleanup();
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });
});
