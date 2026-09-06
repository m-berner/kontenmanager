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
 * - Exactly one dot, no comma -> assume US/EN decimal.
 * - Multiple dots, no comma -> assume DE thousands-grouping (e.g. "1.234.567").
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

    // Exactly one dot, no comma: US decimal format.
    if (commaCount === 0 && dotCount === 1) {
        return "en";
    }

    // Multiple dots, no comma: German thousands-grouping (e.g. "1.234.567"),
    // since a valid number never contains more than one decimal point.
    if (commaCount === 0 && dotCount > 1) {
        return "de";
    }

    // Multiple commas, no dot: US thousands-grouping (e.g. "1,234,567"),
    // since a valid number never contains more than one decimal separator.
    if (dotCount === 0 && commaCount > 1) {
        return "en";
    }

    // Exactly one comma: check position (last 3-4 chars = decimal)
    if (dotCount === 0 && commaCount === 1) {
        return str.length - lastComma <= 4 ? "de" : "en";
    }

    // Both present: comma after dot = European
    return lastComma > lastDot ? "de" : "en";
}

/**
 * Converts a timestamp in milliseconds to an ISO date string (YYYY-MM-DD).
 *
 * @param ms - The timestamp in milliseconds.
 * @returns The formatted ISO date string.
 * @throws {@link AppError} If the timestamp is invalid.
 */
export function isoDate(ms: number): string {
    const MAX_MS = 8.64e15;
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) {
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
 * The scaled value is nudged by a *relative* epsilon before rounding to undo
 * binary-representation error: `1.005 * 100` is `100.49999999999999`, not
 * `100.5`, so a plain `Math.round` returned `1` instead of `1.01`. Every
 * aggregate in `domain/logic.ts` funnels through here, so that was a systematic
 * downward bias on exact half-cents.
 *
 * The nudge is deliberately always positive rather than sign-symmetric: that
 * preserves JavaScript's round-half-toward-+Infinity semantics for negative
 * values, so this fixes the representation error without silently changing how
 * negative totals round.
 *
 * @param value - The number to be rounded.
 * @returns The number rounded to two decimal places.
 */
export function round2(value: number): number {
    if (!Number.isFinite(value)) return value;
    const scaled = value * 100;
    return Math.round(scaled + Number.EPSILON * Math.abs(scaled)) / 100;
}

/**
 * Converts a string, number, or boolean to a number.
 * Handles various of number formats including
 * - European format: 1.234,56 (dot as a thousand separator, comma as decimal)
 * - US format: 1,234.56 (comma as a thousand separator, dot as decimal)
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
        .replace(/[\s\t]/g, "")
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
    return utcFromParts(parts.year, parts.month, parts.day);
}

/**
 * Builds a UTC midnight Date from explicit y/m/d without `Date.UTC`'s
 * two-digit-year remapping.
 *
 * `Date.UTC(year, …)` coerces any year in 0–99 to `1900 + year` (ECMA-262).
 * `DATE.ISO_DATE_REGEX` accepts a four-digit year, so `"0050-01-01"` used to
 * come back as 1950 and `"0004-02-29"` was validated against 1904's calendar
 * rather than year 4's. Unreachable through the `type="date"` pickers, but
 * reachable through a hand-edited backup — `validateBooking`'s `normalizeDate`
 * would then accept and store the misread value.
 *
 * `setUTCFullYear` performs no such remapping.
 *
 * @param year - Full year (not abbreviated).
 * @param month - 1-based month.
 * @param day - Day of month.
 * @returns A Date at UTC midnight on the given day.
 */
function utcFromParts(year: number, month: number, day: number): Date {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return date;
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
 * Sort key for an ISO date string, mapping anything unparseable to
 * `-Infinity` so it orders as "oldest" instead of poisoning comparisons.
 */
function isoSortKey(isoDate: string): number {
    const ms = utcMs(isoDate);
    return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/**
 * Compares two ISO date strings, newest first, tolerating unparseable values.
 *
 * Must be used instead of the obvious `utcMs(b) - utcMs(a)`. `utcMs("")` is
 * `NaN` (validateBooking's normalizeDate deliberately yields "" for a missing or
 * malformed date, which a backup import can carry in), and a comparator that
 * returns `NaN` does not merely misplace that one element. It makes the sort
 * result **arbitrary for the entire array**, because the engine's merge
 * decisions become undefined. Verified: three BUY lots with one blank date
 * produced a FIFO cost basis of 100 or 999 from the same input depending only on
 * the starting permutation, with the two VALID lots also coming out in the wrong
 * relative order.
 *
 * Subtraction is avoided entirely rather than just clamping the key, because
 * `-Infinity - -Infinity` is itself `NaN` — two dateless rows would have
 * reintroduced the same bug. Explicit comparison keeps every result finite.
 *
 * @param a - First ISO date string.
 * @param b - Second ISO date string.
 * @returns Negative if `a` is newer, positive if `b` is newer, 0 if equal.
 */
export function compareIsoDateDesc(a: string, b: string): number {
    const keyA = isoSortKey(a);
    const keyB = isoSortKey(b);
    if (keyA === keyB) return 0;
    return keyB > keyA ? 1 : -1;
}

/**
 * Computed function that returns CSS classes for profit/loss display.
 * Applies red color for negative values; positive/zero values are left to
 * inherit the active theme's foreground color.
 *
 * The non-negative branch deliberately sets NO color. It used to return
 * `color-black`, a literal `color: black` — but the `dark` theme is fully
 * user-selectable (ThemeSelector renders a radio for every configured theme) and
 * paints surfaces `#23222B`, so every gain became black-on-near-black at roughly
 * 1.2:1 contrast: invisible. Losses stayed red and legible, so a dark-theme user
 * could read only their losses. Inheriting lets Vuetify's on-surface color do the
 * right thing in every theme.
 *
 * This is a domain helper with no say in where its classes land, so staying
 * theme-neutral was the right call independently of any stylesheet — and it has
 * since been vindicated. The neighbouring mValue cell *did* rely on style.css
 * hardcoding a light row background in every theme, which let it use
 * `color-black`; when that hardcoding was replaced by a translucent overlay so
 * the tables follow the theme, that cell's colour had to be removed too. This
 * helper needed no change.
 *
 * @param value - Value to determine CSS class for.
 */
export function winLossClass(value: number): string {
    return value < 0
        ? "color-red font-weight-bold"
        : "font-weight-bold";
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

    // Day 0 of the following month = last day of `month`. Built via
    // utcFromParts so the leap-year check uses the real year, not Date.UTC's
    // 1900+yy remapping of two-digit years — see that helper's doc comment.
    const daysInMonth = utcFromParts(year, month + 1, 0).getUTCDate();
    if (!(day >= 1 && day <= daysInMonth)) {
        return null;
    }

    return {year, month, day};
}