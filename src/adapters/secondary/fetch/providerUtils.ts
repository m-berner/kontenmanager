/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StockMarketData} from "@/domain/types";
import {log, mean, toNumber} from "@/domain/utils/utils";

export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_CURRENCY_SYMBOL = "€";
export const DEFAULT_VALUE = "0";

/**
 * Computes the mid-quote from bid and ask strings.
 * Returns DEFAULT_VALUE when either input is non-finite.
 *
 * @param bid - Bid price string.
 * @param ask - Ask price string.
 * @returns Mid-quote as a string, or DEFAULT_VALUE on error.
 */
export function calculateMidQuote(bid: string, ask: string): string {
    try {
        const bidNumber = toNumber(bid);
        const askNumber = toNumber(ask);

        if (!Number.isFinite(bidNumber) || !Number.isFinite(askNumber)) {
            log("SERVICES fetch", {
                parser: "calculateMidQuote",
                reason: "non-finite bid/ask",
                bid,
                ask,
                bidNumber,
                askNumber
            }, "warn");
            return DEFAULT_VALUE;
        }

        return mean([bidNumber, askNumber]).toString();
    } catch (error) {
        log("SERVICES fetch", {parser: "calculateMidQuote", reason: "exception", error, bid, ask}, "warn");
        return DEFAULT_VALUE;
    }
}

/**
 * Creates a StockMarketData object with default/zero values.
 *
 * @param id - Store item ID.
 * @returns Default StockMarketData.
 */
export function createDefaultStockData(id: number): StockMarketData {
    return {
        id,
        isin: "",
        rate: DEFAULT_VALUE,
        min: DEFAULT_VALUE,
        max: DEFAULT_VALUE,
        cur: DEFAULT_CURRENCY
    };
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
 * Parses currency code or symbol from text into a standardized currency code.
 * Returns DEFAULT_CURRENCY when unrecognized.
 *
 * @param code - Text containing currency information.
 * @returns Standardized currency code (USD, EUR, or default).
 */
export function parseCurrency(code: string): string {
    const normalized = code.toUpperCase();

    // Prefer explicit ISO codes, then symbols, then German-language names.
    if (/\bUSD\b/.test(normalized) || normalized.includes("US$") || code.includes("$") || /US[- ]?DOLLAR/i.test(code) || /\bDOLLAR\b/.test(normalized)) {
        return "USD";
    }
    if (/\bEUR\b/.test(normalized) || code.includes("€")) {
        return "EUR";
    }

    return "";
}