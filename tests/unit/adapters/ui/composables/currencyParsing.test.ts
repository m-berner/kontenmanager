/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {getSeparators, parseCurrency} from "@/adapters/ui/composables/currencyParsing";

describe("adapters/ui/composables/currencyParsing", () => {
    describe("getSeparators", () => {
        it("detects the German group/decimal separators", () => {
            expect(getSeparators("de-DE")).toEqual({group: ".", decimal: ","});
        });

        it("detects the US group/decimal separators", () => {
            expect(getSeparators("en-US")).toEqual({group: ",", decimal: "."});
        });
    });

    describe("parseCurrency", () => {
        it("parses a plain 2-decimal dot value regardless of locale", () => {
            expect(parseCurrency("12.34", "de-DE")).toBe(12.34);
            expect(parseCurrency("12.34", "en-US")).toBe(12.34);
        });

        it("parses a locale-formatted value with a group separator", () => {
            expect(parseCurrency("1.234,56", "de-DE")).toBe(1234.56);
            expect(parseCurrency("$1,234.56", "en-US")).toBe(1234.56);
        });

        it("returns 0 for blank input", () => {
            expect(parseCurrency("", "de-DE")).toBe(0);
        });

        it("returns 0 for unparseable input", () => {
            expect(parseCurrency("abc", "de-DE")).toBe(0);
        });

        // Regression: a value with 3+ fraction digits fell through to the
        // locale-aware branch, which strips "." as a group separator in
        // de-DE rather than reading it as a decimal point. A de-DE amount
        // typed with 3 decimals, or an unrounded value round-tripped through
        // an untouched focus/blur, was inflated by roughly 10^n.
        it("rounds a de-DE comma-decimal value with 3+ fraction digits instead of truncating it", () => {
            expect(parseCurrency("12,345", "de-DE")).toBe(12.35);
        });

        it("rounds the unambiguous dot-decimal fast path to 2 decimals too", () => {
            // This is the exact shape onFocus now always seeds (see
            // CurrencyInput.vue), and also what onBlur re-parses when the
            // field was left untouched — so an already-2-decimal value must
            // round-trip unchanged, not drift.
            expect(parseCurrency("12.30", "de-DE")).toBe(12.3);
            expect(parseCurrency("12.3", "de-DE")).toBe(12.3);
        });

        // A dot followed by 3+ digits stays genuinely ambiguous in de-DE by
        // design: "." is de-DE's group separator, so "12.345" alone (no
        // comma) reads as the whole number 12345, the same as it would if a
        // user pasted a real thousands-grouped figure. parseCurrency cannot
        // tell that apart from a stray 3-decimal fraction — which is exactly
        // why the fix lives in CurrencyInput.vue's onFocus (always seeding a
        // 2-decimal string), not here: this branch must stay unchanged so a
        // genuinely pasted "12.345" (twelve thousand three hundred forty
        // five) keeps parsing correctly.
        it("still reads a bare 3+-digit dot value as German thousands-grouping, unchanged", () => {
            expect(parseCurrency("12.345", "de-DE")).toBe(12345);
        });

        // Regression: the magnitude and the sign used to be matched by one
        // `-?\d+(\.\d*)?` pattern. In a locale that puts the currency symbol
        // BEFORE the digits, the minus and the first digit are not adjacent
        // ("-$1,234.56"), so `-?` never matched and the result came back
        // positive. de-DE's suffix symbol ("-1.234,56 €") hid this entirely.
        //
        // It is not a cosmetic parse bug: CurrencyInput's wrappedRules parses
        // the value Vuetify validates — the FORMATTED string at submit time —
        // so oneOfTwo's `v < 0` rejection never fired on an en-US install and
        // a negative booking amount was accepted and stored.
        it("keeps the sign of a negative value whose currency symbol precedes the digits", () => {
            expect(parseCurrency("-$1,234.56", "en-US")).toBe(-1234.56);
            expect(parseCurrency("-€1,234.56", "en-US")).toBe(-1234.56);
        });

        it("keeps the sign of a negative value whose currency symbol follows the digits", () => {
            expect(parseCurrency("-1.234,56 €", "de-DE")).toBe(-1234.56);
            expect(parseCurrency("-1.234,56 $", "de-DE")).toBe(-1234.56);
        });

        // The exact strings Intl produces, rather than hand-written ones, so
        // this stays honest if a runtime's formatting differs from the
        // assumption above.
        it("round-trips a negative amount through the real Intl output in both locales", () => {
            for (const [locale, currency] of [
                ["en-US", "USD"],
                ["en-US", "EUR"],
                ["de-DE", "EUR"],
                ["de-DE", "USD"]
            ] as const) {
                const formatted = new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency
                }).format(-1234.56);
                expect(parseCurrency(formatted, locale)).toBe(-1234.56);
            }
        });

        it("treats a U+2212 minus sign as negative, not as no sign at all", () => {
            expect(parseCurrency("−1.234,56 €", "de-DE")).toBe(-1234.56);
            expect(parseCurrency("−$1,234.56", "en-US")).toBe(-1234.56);
        });

        it("still parses a positive symbol-prefixed value as positive", () => {
            // Guards the fix from over-reaching: nothing before the digits
            // means positive, even with a symbol in the way.
            expect(parseCurrency("€1,234.56", "en-US")).toBe(1234.56);
            expect(parseCurrency("$1,234.56", "en-US")).toBe(1234.56);
        });

        it("does not multiply a rounded de-DE value by 10^n on a second, untouched focus/blur", () => {
            // The exact regression scenario: parse once (form entry), then
            // re-parse the value the way onFocus now re-seeds it (2-decimal,
            // dot-decimal) for an untouched focus/blur on an existing row —
            // and confirm it's stable rather than drifting through the
            // group-separator branch.
            const first = parseCurrency("12,345", "de-DE");
            expect(first).toBe(12.35);
            const reseeded = first.toFixed(2);
            expect(reseeded).toBe("12.35");
            const roundTripped = parseCurrency(reseeded, "de-DE");
            expect(roundTripped).toBe(12.35);
        });
    });
});
