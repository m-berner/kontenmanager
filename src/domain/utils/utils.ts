/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {DATE, ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {LogLevelType, NumberParseOptions} from "@/domain/types";

/**
 * Detects whether a number-like string is in German (de) or English (en) format.
 *
 * Heuristics:
 * - Only dots present -> assume US/EN.
 * - Only commas present -> if comma occurs in the last 3–4 chars, assume decimal (DE), otherwise EN.
 * - Both present -> if the last comma is after the last dot, prefer DE; else EN.
 *
 * @param str - Input string containing a number representation.
 * @returns The detected locale code: `"de"` or `"en"`.
 */
export function detectNumberFormat(str: string): "de" | "en" {
    const dotCount = (str.match(/\./g) || []).length;
    const commaCount = (str.match(/,/g) || []).length;
    const lastDot = str.lastIndexOf(".");
    const lastComma = str.lastIndexOf(",");

    // Only dots: US format
    if (commaCount === 0 && dotCount > 0) return "en";

    // Only commas: check position (last 3-4 chars = decimal)
    if (dotCount === 0 && commaCount > 0) {
        return str.length - lastComma <= 4 ? "de" : "en";
    }

    // Both present: comma after dot = European
    return lastComma > lastDot ? "de" : "en";
}

/**
 * Checks if two arrays contain exactly the same strings (order-insensitive, no duplicates considered).
 *
 * @param arr1 - First array of strings.
 * @param arr2 - Second array of strings.
 * @returns True if both arrays contain the same unique set of strings.
 */
export function haveSameStrings(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    if (set1.size !== set2.size) return false;

    for (const item of set1) {
        if (!set2.has(item)) return false;
    }

    return true;
}

/**
 * Converts a timestamp in milliseconds to an ISO date string (YYYY-MM-DD).
 *
 * @param ms - The timestamp in milliseconds.
 * @returns The formatted ISO date string.
 * @throws {@link AppError} If the timestamp is invalid.
 */
export function isoDate(ms: number): string {
    if (!Number.isFinite(ms)) {
        throw appError(
            ERROR_DEFINITIONS.UTILS.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    return new Date(ms).toISOString().substring(0, 10);
}

/**
 * Checks if a string is a valid ISO date (YYYY-MM-DD).
 *
 * @param iso - The string to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidISODate(iso: string): boolean {
    return parseISODateParts(iso) !== null;
}

/**
 * Logs a message to the console, optionally including additional data and specifying a log level.
 *
 * @param msg - The message to be logged.
 * @param data - Optional additional data to log alongside the message.
 * @param level - Optional log level to determine the console method (e.g., "log", "warn", "error").
 */
export function log(msg: string, data?: unknown, level?: LogLevelType): void {
    // Default: silent outside development to keep production bundles clean.
    // Override via `.env.*`: `VITE_DEBUG_LOGS=true` to re-enable structured logs.
    const debugLogs =
        import.meta.env.MODE === "development" ||
        import.meta.env.VITE_DEBUG_LOGS === "true";
    if (!debugLogs) return;

    /* eslint-disable no-console */
    const methods: Record<LogLevelType, (..._args: unknown[]) => void> = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };
    /* eslint-enable no-console */
    const logFn = level ? methods[level] : methods.log;
    data !== undefined ? logFn(msg, data) : logFn(msg);
}

/**
 * Computes the arithmetic mean of the provided numbers, ignoring zeros and non-finite values.
 *
 * @param numbers - List of numeric values.
 * @returns The mean of valid, non-zero numbers; returns 0 if none.
 */
export function mean(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (const n of numbers) {
        if (n !== 0 && Number.isFinite(n)) {
            sum += n;
            count++;
        }
    }

    return count > 0 ? sum / count : 0;
}

/**
 * Normalizes a localized numeric string into a canonical form parseable by `parseFloat`.
 *
 * - For `de`, removes a thousand separators `.` and replaces decimal comma with dot.
 * - For `en`, removes a thousand separators `,` and keeps dot as decimal.
 *
 * @param str - Localized numeric string.
 * @param locale - Locale: `"de"` or `"en"`.
 * @returns A normalized number string suitable for `Number.parseFloat`.
 */
export function normalizeNumber(str: string, locale: "de" | "en"): string {
    return locale === "de"
        ? str.replace(/\./g, "").replace(",", ".")
        : str.replace(/,/g, "");
}

/**
 * Rounds a given number to two decimal places.
 *
 * @param value - The number to be rounded.
 * @returns The number rounded to two decimal places.
 */
export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Converts a string, number, or boolean to a number.
 * Handles various number formats including
 * - European format: 1.234,56 (dot as thousands separator, comma as decimal)
 * - US format: 1,234.56 (comma as thousands separator, dot as decimal)
 * - Percentages: 25% -> 25
 * - Whitespace and tabs
 *
 * @param value - Input value to convert.
 * @param options - Optional configuration for locale, fallback, and error behavior.
 * @returns Parsed number or fallback value.
 */
export function toNumber(
    value: string | boolean | number | undefined | null,
    options: NumberParseOptions = {}
): number {
    const {locale, fallback = 0, throwOnError = false} = options;

    // Handle primitive types
    if (value === null || value === undefined) return fallback;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "number") {
        return Number.isNaN(value) ? fallback : value;
    }

    // Clean and parse string
    const cleaned = value
        .toString()
        .trim()
        .replace(/\s|\t/g, "")
        .replace(/%$/g, "");

    if (cleaned === "") return fallback;

    const isParseError = () => {
        if (throwOnError) {
            throw appError(
                ERROR_DEFINITIONS.UTILS.C.CODE,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
    };

    try {
        // Auto-detect format if locale not specified
        const detectedLocale = locale || detectNumberFormat(cleaned);
        const normalized = normalizeNumber(cleaned, detectedLocale);
        const result = Number.parseFloat(normalized);

        if (Number.isNaN(result)) {
            isParseError();
            return fallback;
        }

        return result;
    } catch (error) {
        if (throwOnError) throw error;
        return fallback;
    }
}

/**
 * Creates a Date object from an ISO date string (YYYY-MM-DD) set to midnight UTC.
 *
 * @param iso - The ISO date string.
 * @returns A Date object representing the start of the day.
 * @throws {@link AppError} If the date format is invalid.
 */
export function utcDate(iso: string): Date {
    if (iso === "") return new Date(NaN);

    const parts = parseISODateParts(iso);
    if (parts === null) {
        throw appError(
            ERROR_DEFINITIONS.UTILS.A.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
    return new Date(
        Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0)
    );
}

/**
 * Converts an ISO 8601 formatted date string to the number of milliseconds since the Unix epoch (January 1, 1970).
 *
 * @param isoDate - An ISO 8601 formatted date string.
 * @returns The number of milliseconds since the Unix epoch corresponding to the given date.
 */
export function utcMs(isoDate: string): number {
    return new Date(isoDate).getTime();
}

/**
 * Computed function that returns CSS classes for profit/loss display.
 * Applies red color for negative values and black for positive/zero values.
 *
 * @param value - Value to determine CSS class for.
 */
export function winLossClass(value: number): string {
    return value < 0
        ? "color-red font-weight-bold"
        : "color-black font-weight-bold";
}

/**
 * Parses an ISO-formatted date string and extracts its year, month, and day components.
 *
 * @param iso - A string in the ISO date format (YYYY-MM-DD).
 * @returns An object containing `year`, `month`, and `day` as numeric values if the input is valid; otherwise, `null`.
 */
function parseISODateParts(
    iso: string
): { year: number; month: number; day: number } | null {
    if (!DATE.ISO_DATE_REGEX.test(iso)) {
        return null;
    }

    const [year, month, day] = iso.split("-").map((v) => Number(v));
    if (!(month >= 1 && month <= 12)) {
        return null;
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (!(day >= 1 && day <= daysInMonth)) {
        return null;
    }

    return {year, month, day};
}