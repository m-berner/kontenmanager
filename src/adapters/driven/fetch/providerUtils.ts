/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {log, toNumber} from "@/domain/utils/utils";

export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_CURRENCY_SYMBOL = "€";
export const DEFAULT_VALUE = "0";

/**
 * Parses a bid/ask side into a finite number, or null if it couldn't be
 * parsed (as opposed to a genuine, parseable zero price).
 *
 * @param locale - Forces the decimal/group-separator convention. Omitted, the
 *   side falls through to `toNumber`'s own auto-detection
 *   (`detectNumberFormat`), which is ambiguous for a lone comma sitting more
 *   than 4 characters from the end of the string (e.g. "1,3105" reads as
 *   English thousands-grouping, not a 4-decimal German fraction). A caller
 *   whose source always renders one convention — Tradegate is always
 *   comma-decimal — should pass it explicitly rather than rely on the guess.
 */
function parseQuoteSide(raw: string, locale?: "de" | "en"): number | null {
    if (raw.trim() === "") return null;
    try {
        const parsed = toNumber(raw, {throwOnError: true, locale});
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/**
 * Computes the mid-quote from bid and ask strings.
 *
 * A side that is zero is treated the same as one that fails to parse: it means
 * "there is no quote on that side", not "the price is zero". Averaging a zero
 * side in would halve the real price — e.g. an illiquid stock rendered as
 * bid "0,00" / ask "100,00" produced a mid-quote of 50, which then flowed
 * straight into mValue, mChange and the depot total. When only one side has
 * a price, that side *is* the best available price.
 *
 * (Round 23 made a missing/blank side distinguishable from a parsed zero, which
 * was necessary but not sufficient: a provider rendering a literal "0" still
 * produced the halving.)
 *
 * Returns DEFAULT_VALUE when neither side yields a usable price, which callers
 * such as tgateFetcher already treat as "failed to parse rate" and reject.
 *
 * @param bid - Bid price string.
 * @param ask - Ask price string.
 * @param locale - Forwarded to `parseQuoteSide` for both sides; see its doc
 *   comment. Omitted (the default, and every existing caller before this
 *   parameter existed) preserves auto-detection.
 * @returns Mid-quote as a string, or DEFAULT_VALUE on error.
 */
export function calculateMidQuote(bid: string, ask: string, locale?: "de" | "en"): string {
    const bidNumber = parseQuoteSide(bid, locale);
    const askNumber = parseQuoteSide(ask, locale);

    const usableBid = bidNumber !== null && bidNumber !== 0 ? bidNumber : null;
    const usableAsk = askNumber !== null && askNumber !== 0 ? askNumber : null;

    if (usableBid !== null && usableAsk !== null) {
        return ((usableBid + usableAsk) / 2).toString();
    }
    if (usableBid !== null) return usableBid.toString();
    if (usableAsk !== null) return usableAsk.toString();

    log("SERVICES fetch", {
        parser: "calculateMidQuote",
        reason: "no usable bid/ask (both unparseable or zero)",
        bid,
        ask
    }, "warn");
    return DEFAULT_VALUE;
}

/**
 * Detects currency from raw cell/element text.
 * Returns "" when unknown — intentionally avoids falling back to DEFAULT_CURRENCY
 * so callers can distinguish "found EUR" from "not yet known".
 *
 * @param value - Raw text to inspect.
 * @returns ISO currency code or "".
 */
export function detectCurrency(value: string): string {
    if (value.includes("USD") || value.includes("$")) return "USD";
    if (value.includes("EUR") || value.includes("€")) return "EUR";
    return "";
}

/**
 * Non-USD currencies whose name/symbol also contains the word "Dollar" or a
 * bare "$". Checked after the explicit US markers but before the bare-"$"
 * fallback, most specific first.
 *
 * `parseCurrency` used to classify every one of these as USD, via two
 * far-too-broad alternatives: `/\bDOLLAR\b/` (matches "Kanadischer Dollar",
 * "Australischer Dollar", …) and a bare `code.includes("$")` (matches "CA$",
 * "A$", "HK$", "S$"). Its one caller — acheck.ts's `extractAcheckStockData` —
 * feeds it RAW whole-cell text from the "Währung" row, which is exactly where
 * such a name appears. The misread then reached useOnlineStockData, which
 * divides a "USD" price by the USD/EUR rate: a CAD-quoted stock was silently
 * converted with the wrong rate, corrupting mValue, mChange and the depot
 * total with a plausible-looking number and no error.
 *
 * Returning the true ISO code instead means useOnlineStockData's divisor chain
 * falls through to 1 (no FX applied) rather than applying the WRONG FX. That is
 * still not a converted price — supporting these currencies properly needs a
 * rate fetched for each, which is a separate change — but it is honest, and a
 * truthy `cur` correctly suppresses the ISIN-prefix USD inference for a
 * non-US-domiciled stock.
 *
 * Order within the list matters too: "CA$" contains "A$", so CAD must be tested
 * before AUD.
 */
const DOLLAR_CURRENCIES: ReadonlyArray<{ code: string; pattern: RegExp }> = [
    {code: "CAD", pattern: /\bCAD\b|CA\$|KANADISCHER?[- ]DOLLAR|CANADIAN[- ]DOLLAR/i},
    {code: "AUD", pattern: /\bAUD\b|A\$|AUSTRALISCHER?[- ]DOLLAR|AUSTRALIAN[- ]DOLLAR/i},
    {code: "NZD", pattern: /\bNZD\b|NZ\$|NEUSEELAND[- ]?DOLLAR|NEW[- ]ZEALAND[- ]DOLLAR/i},
    {code: "HKD", pattern: /\bHKD\b|HK\$|HONGKONG[- ]?DOLLAR|HONG[- ]KONG[- ]DOLLAR/i},
    {code: "SGD", pattern: /\bSGD\b|S\$|SINGAPUR[- ]?DOLLAR|SINGAPORE[- ]DOLLAR/i}
] as const;

/**
 * Parses currency code or symbol from text into a standardized currency code.
 * Returns DEFAULT_CURRENCY when unrecognized.
 *
 * The DEFAULT_CURRENCY fallback for "no marker found at all" is deliberate and
 * must not be changed to "": returning "" would let useOnlineStockData infer USD
 * from a "US" ISIN prefix and wrongly divide an EUR-quoted price by the USD rate
 * — see ard.ts's `currencyOf` for the same reasoning.
 *
 * @param code - Text containing currency information.
 * @returns Standardized currency code, or DEFAULT_CURRENCY when no marker is found.
 */
export function parseCurrency(code: string): string {
    const normalized = code.toUpperCase();

    // Step 1 — UNAMBIGUOUS US markers, before the list below.
    //
    // This must come first: "US$" contains "S$", so testing SGD first would
    // classify every US quote as Singapore dollars. (It did — caught by the
    // existing `parseCurrency("US$")` test. Exactly the substring-collision
    // class of mistake this whole fix is about, so the ordering is load-bearing,
    // not stylistic.)
    if (
        /\bUSD\b/.test(normalized) ||
        normalized.includes("US$") ||
        /US[- ]?DOLLAR/i.test(code)
    ) {
        return "USD";
    }

    // Step 2 — non-US dollar currencies, most specific first. Without this they
    // fell through to the bare-"$"/"Dollar" test below and were all reported as
    // USD.
    for (const {code: isoCode, pattern} of DOLLAR_CURRENCIES) {
        if (pattern.test(code)) return isoCode;
    }

    // Step 3 — a bare "$" still means USD. Every prefixed dollar symbol (US$,
    // CA$, A$, HK$, S$) has been consumed above, and acheck's own symbol
    // extractor emits a lone "$" for US listings, so dropping this would have
    // silently reclassified every USD quote as EUR.
    //
    // A bare, spelled-out "Dollar" is deliberately NOT accepted: that is exactly
    // the ambiguous form ("Kanadischer Dollar") this function used to get wrong,
    // and every US spelling is already covered in step 1. An unlisted dollar
    // currency therefore falls through to DEFAULT_CURRENCY rather than being
    // asserted as USD.
    if (code.includes("$")) {
        return "USD";
    }
    if (/\bEUR\b/.test(normalized) || code.includes("€")) {
        return "EUR";
    }

    return DEFAULT_CURRENCY;
}