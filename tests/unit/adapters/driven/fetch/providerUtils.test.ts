/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    calculateMidQuote,
    createDefaultStockData,
    DEFAULT_CURRENCY,
    DEFAULT_VALUE,
    detectCurrency,
    parseCurrency
} from "@/adapters/driven/fetch/providerUtils";

describe("adapters/driven/fetch/providerUtils", () => {
    describe("calculateMidQuote", () => {
        it("averages a numeric bid/ask pair", () => {
            expect(calculateMidQuote("10", "20")).toBe("15");
        });

        it("handles localized decimal separators", () => {
            expect(calculateMidQuote("10,5", "11,5")).toBe("11");
        });

        it("ignores a non-numeric side (toNumber's 0 fallback is excluded by mean()) and returns the other side", () => {
            // Non-numeric input silently becomes 0 via toNumber()'s default fallback, and mean()
            // deliberately excludes zeros — so the "valid" side wins outright rather than the
            // pair averaging toward 0. This only surfaces the DEFAULT_VALUE fallback when both
            // sides are non-finite (e.g. NaN/Infinity survive toNumber unchanged).
            expect(calculateMidQuote("n/a", "20")).toBe("20");
            expect(calculateMidQuote("10", "n/a")).toBe("10");
        });

        it("falls back to DEFAULT_VALUE when both sides are non-finite", () => {
            expect(calculateMidQuote("Infinity", "-Infinity")).toBe(DEFAULT_VALUE);
        });
    });

    describe("createDefaultStockData", () => {
        it("builds a zeroed-out record tagged with the given id", () => {
            expect(createDefaultStockData(7)).toEqual({
                id: 7,
                isin: "",
                rate: DEFAULT_VALUE,
                min: DEFAULT_VALUE,
                max: DEFAULT_VALUE,
                cur: DEFAULT_CURRENCY
            });
        });
    });

    describe("detectCurrency", () => {
        it("detects USD from the code or symbol", () => {
            expect(detectCurrency("123.45 USD")).toBe("USD");
            expect(detectCurrency("$123.45")).toBe("USD");
        });

        it("detects EUR from the code or symbol", () => {
            expect(detectCurrency("123,45 EUR")).toBe("EUR");
            expect(detectCurrency("123,45 €")).toBe("EUR");
        });

        it("returns an empty string (not a default) when no currency marker is found", () => {
            expect(detectCurrency("123.45")).toBe("");
        });
    });

    describe("parseCurrency", () => {
        it("recognizes USD via ISO code, symbol, or the German word 'Dollar'", () => {
            expect(parseCurrency("USD")).toBe("USD");
            expect(parseCurrency("US$")).toBe("USD");
            expect(parseCurrency("US-Dollar")).toBe("USD");
        });

        it("recognizes EUR via ISO code or symbol", () => {
            expect(parseCurrency("EUR")).toBe("EUR");
            expect(parseCurrency("€")).toBe("EUR");
        });

        it("returns an empty string for unrecognized currency text", () => {
            expect(parseCurrency("GBP")).toBe("");
        });
    });
});