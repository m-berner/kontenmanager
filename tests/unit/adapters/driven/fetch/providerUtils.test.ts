/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    calculateMidQuote,
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

        // Zero side means "no quote on that side", not "the price is zero".
        // Averaging it in halved the real price: an illiquid stock rendered as
        // bid "0,00" / ask "100,00" produced 50, which fed mValue, mEuroChange
        // and the depot total.
        it("ignores a zero side and returns the other side's price unhalved", () => {
            expect(calculateMidQuote("0", "100")).toBe("100");
            expect(calculateMidQuote("100", "0")).toBe("100");
            expect(calculateMidQuote("0,00", "100,00")).toBe("100");
        });

        it("returns DEFAULT_VALUE when both sides are zero (no quote at all)", () => {
            // tgateFetcher treats DEFAULT_VALUE as "failed to parse rate" and
            // rejects, which is correct: there is no price to report.
            expect(calculateMidQuote("0", "0")).toBe(DEFAULT_VALUE);
        });

        it("still averages two real prices", () => {
            expect(calculateMidQuote("99", "101")).toBe("100");
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

        it("falls back to DEFAULT_CURRENCY for unrecognized currency text", () => {
            expect(parseCurrency("GBP")).toBe(DEFAULT_CURRENCY);
        });

        it("does not classify non-US dollar currencies as USD", () => {
            // Regression test: `/\bDOLLAR\b/` and a bare `code.includes("$")`
            // used to swallow every one of these. acheck.ts's
            // extractAcheckCurrencySymbol returns RAW "Währung"-cell text, so a
            // "Kanadischer Dollar" listing was reported as USD and
            // useOnlineStockData then divided its price by the USD/EUR rate —
            // a wrong mValue, mEuroChange and depot total, silently.
            expect(parseCurrency("Kanadischer Dollar")).toBe("CAD");
            expect(parseCurrency("CA$")).toBe("CAD");
            expect(parseCurrency("Australischer Dollar")).toBe("AUD");
            expect(parseCurrency("A$")).toBe("AUD");
            expect(parseCurrency("Hongkong-Dollar")).toBe("HKD");
            expect(parseCurrency("HK$")).toBe("HKD");
            expect(parseCurrency("Singapur-Dollar")).toBe("SGD");
            expect(parseCurrency("NZD")).toBe("NZD");
        });

        it("still recognizes a bare $ as USD", () => {
            // acheck's symbol extractor emits a lone "$" for US listings, so the
            // fix must not reclassify those as EUR. Every prefixed dollar symbol
            // is consumed by the specific patterns above before this runs.
            expect(parseCurrency("$")).toBe("USD");
            expect(parseCurrency("3,00 $")).toBe("USD");
        });

        it("does not assert USD for an unlisted spelled-out dollar currency", () => {
            // A bare, spelled-out "Dollar" is the ambiguous form. Falling back to
            // DEFAULT_CURRENCY is wrong-but-neutral; asserting USD would re-apply
            // a real FX rate to a currency it does not belong to.
            expect(parseCurrency("Taiwan-Dollar")).toBe(DEFAULT_CURRENCY);
        });
    });
});