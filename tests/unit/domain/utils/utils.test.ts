/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    detectNumberFormat,
    haveSameStrings,
    isoDate,
    isValidISODate,
    mean,
    normalizeNumber,
    toNumber,
    utcDate
} from "@/domain/utils/utils";
import {normalizeBookingTypeName} from "@/domain/validation/validators";
import {ERROR_DEFINITIONS, isAppError} from "@/domain/errors";
import type {AppError} from "@/domain/types";

describe("DomainUtils: dates", () => {
    it("utcDate should return midnight UTC for a valid ISO date", () => {
        const d = utcDate("2026-02-02");
        expect(d.toISOString()).toBe("2026-02-02T00:00:00.000Z");
    });

    it("utcDate should throw AppError for an invalid ISO date", () => {
        expect(() => utcDate("2026-13-40")).toThrow();
        try {
            utcDate("2026-13-40");
        } catch (e) {
            expect(isAppError(e)).toBe(true);
            expect((e as AppError).code).toBe(ERROR_DEFINITIONS.UTILS.A.CODE);
        }
    });

    it("isoDate should return YYYY-MM-DD for a valid timestamp", () => {
        const ms = Date.UTC(2026, 1, 2); // 2026-02-02T00:00:00.000Z
        expect(isoDate(ms)).toBe("2026-02-02");
    });

    it("isoDate should throw on an invalid timestamp", () => {
        expect(() => isoDate(Number.NaN)).toThrow();
        try {
            isoDate(Number.NaN);
        } catch (e) {
            expect(isAppError(e)).toBe(true);
            expect((e as AppError).code).toBe(ERROR_DEFINITIONS.UTILS.B.CODE);
        }
    });

    it("isValidISODate should validate correctly", () => {
        expect(isValidISODate("2026-02-02")).toBe(true);
        expect(isValidISODate("2026-13-40")).toBe(false);
        expect(isValidISODate("")).toBe(false);
    });
});

describe("DomainUtils: numbers and parsing", () => {
    it("toNumber should parse the DE format", () => {
        expect(toNumber("1.234,56", {locale: "de"})).toBeCloseTo(
            1234.56,
            6
        );
    });

    it("toNumber should parse the EN format", () => {
        expect(toNumber("1,234.56", {locale: "en"})).toBeCloseTo(
            1234.56,
            6
        );
    });

    it("toNumber should parse percentage and whitespace", () => {
        expect(toNumber("  25%\t ")).toBe(25);
    });

    it("toNumber should auto-detect the number format", () => {
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
            expect((e as AppError).code).toBe(ERROR_DEFINITIONS.UTILS.C.CODE);
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
