/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    compareIsoDateDesc,
    detectNumberFormat,
    isoDate,
    isValidISODate,
    mean,
    normalizeNumber,
    toNumber,
    utcDate,
    winLossClass
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

    it("does not remap four-digit years below 0100 the way `Date.UTC´ does", () => {
        // Regression test: both utcDate and parseISODateParts passed the parsed
        // year straight to Date.UTC, which coerces any year in 0-99 to
        // 1900 + year (ECMA-262). DATE.ISO_DATE_REGEX accepts a four-digit
        // year, so "0050-01-01" came back as 1950, and "0004-02-29" was
        // validated against 1904's calendar rather than year 4's. Unreachable
        // through the type="date" pickers, but reachable through a hand-edited
        // backup, which validateBooking's normalizeDate would then accept and
        // store misread.
        expect(utcDate("0050-01-01").getUTCFullYear()).toBe(50);
        expect(utcDate("0004-02-29").getUTCFullYear()).toBe(4);

        // Year 4 is a leap year, and so is 1904 — but the check must now be
        // made against the real year, not the remapped one.
        expect(isValidISODate("0004-02-29")).toBe(true);
        // Year 1900 is NOT a leap year; year 0 IS (divisible by 400). The old
        // code mapped 0000 -> 1900 and therefore rejected this valid date.
        expect(isValidISODate("0000-02-29")).toBe(true);

        // Ordinary dates are untouched.
        expect(utcDate("2026-08-06").toISOString().substring(0, 10)).toBe("2026-08-06");
        expect(utcDate("1970-01-01").getTime()).toBe(0);
        expect(isValidISODate("2026-02-29")).toBe(false);
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

    it("detectNumberFormat should treat multi-comma grouping as US thousands, not German decimal", () => {
        expect(detectNumberFormat("1,234,567")).toBe("en");
        expect(detectNumberFormat("12,345,678")).toBe("en");
    });

    it("toNumber should auto-detect multi-comma US thousands-grouped values without corrupting them", () => {
        expect(toNumber("1,234,567")).toBe(1234567);
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

});

describe("DomainUtils: compareIsoDateDesc", () => {
    it("orders valid dates newest first", () => {
        expect(compareIsoDateDesc("2024-01-02", "2024-01-01")).toBeLessThan(0);
        expect(compareIsoDateDesc("2024-01-01", "2024-01-02")).toBeGreaterThan(0);
        expect(compareIsoDateDesc("2024-01-01", "2024-01-01")).toBe(0);
    });

    it("never returns NaN, for any combination of unparseable inputs", () => {
        // The whole point: `utcMs(b) - utcMs(a)` returned NaN for these, and a
        // NaN comparator leaves the sort result arbitrary for the ENTIRE array.
        // `-Infinity - -Infinity` is also NaN, so two blank dates have to be
        // handled without subtraction too.
        for (const [a, b] of [
            ["", "2024-01-01"],
            ["2024-01-01", ""],
            ["", ""],
            ["not-a-date", "2024-01-01"],
            ["not-a-date", "also-not-a-date"]
        ]) {
            expect(Number.isNaN(compareIsoDateDesc(a, b))).toBe(false);
        }
    });

    it("sorts dateless entries last and leaves the valid ones correctly ordered", () => {
        const input = ["", "2020-01-01", "2024-01-01", ""];
        expect([...input].sort(compareIsoDateDesc)).toEqual([
            "2024-01-01",
            "2020-01-01",
            "",
            ""
        ]);
    });

    it("produces the same order regardless of the input permutation", () => {
        // A NaN comparator made the result depend on the starting order.
        const a = ["2020-01-01", "", "2024-01-01"];
        const b = ["", "2024-01-01", "2020-01-01"];
        expect([...a].sort(compareIsoDateDesc)).toEqual([...b].sort(compareIsoDateDesc));
    });
});

describe("DomainUtils: winLossClass", () => {
    it("marks a negative value red", () => {
        expect(winLossClass(-0.01)).toBe("color-red font-weight-bold");
    });

    it("assigns NO color to non-negative values so they inherit the active theme", () => {
        // `color-black` is a literal `color: black`. The user-selectable `dark`
        // theme paints surfaces #23222B, so every gain used to be
        // black-on-near-black (~1.2:1) — invisible — while losses stayed red and
        // legible. Inheriting the theme's on-surface color fixes all six themes.
        //
        // A caller may still be free to use `color-black` — CompanyContent's
        // mValue cell is, because style.css hardcodes that row's background —
        // but this helper cannot know that, so it must stay theme-neutral.
        expect(winLossClass(0)).toBe("font-weight-bold");
        expect(winLossClass(12.5)).toBe("font-weight-bold");
        expect(winLossClass(0)).not.toContain("color-");
    });
});
