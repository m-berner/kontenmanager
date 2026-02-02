/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { LogLevelType, NumberParseOptions } from "@/types";
import { DATE } from "@/domains/config/date";
import { LOCAL_STORAGE } from "@/config/storage";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";

/**
 * General utility service providing date, number, and string manipulation helpers.
 */
export class UtilsService {
  constructor() {}

  /**
   * Creates a Date object from an ISO date string (YYYY-MM-DD) set to midnight UTC.
   *
   * @param iso - The ISO date string.
   * @returns A Date object representing the start of the day.
   * @throws {AppError} If the date format is invalid.
   */
  static utcDate(iso: string): Date {
    if (!DATE.ISO_DATE_REGEX.test(iso) && iso !== "") {
      throw new AppError(
        ERROR_CODES.UTILS.A,
        ERROR_CATEGORY.VALIDATION,
        { input: iso },
        false
      );
    }
    return new Date(`${iso}T00:00:00.000`);
  }

  /**
   * Converts a timestamp in milliseconds to an ISO date string (YYYY-MM-DD).
   *
   * @param ms - The timestamp in milliseconds.
   * @returns The formatted ISO date string.
   * @throws {AppError} If the timestamp is invalid.
   */
  static isoDate(ms: number): string {
    if (!Number.isFinite(ms)) {
      throw new AppError(
        ERROR_CODES.UTILS.B,
        ERROR_CATEGORY.VALIDATION,
        { input: ms },
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
  static isValidISODate(iso: string): boolean {
    return (
      DATE.ISO_DATE_REGEX.test(iso) &&
      !isNaN(UtilsService.utcDate(iso).getTime())
    );
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
  static toNumber(
    value: string | boolean | number | undefined | null,
    options: NumberParseOptions = {}
  ): number {
    const { locale, fallback = 0, throwOnError = false } = options;

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
        throw new AppError(
          ERROR_CODES.UTILS.C,
          ERROR_CATEGORY.VALIDATION,
          { input: value },
          false
        );
      }
    };

    try {
      // Auto-detect format if locale not specified
      const detectedLocale = locale || UtilsService.detectNumberFormat(cleaned);
      const normalized = UtilsService.normalizeNumber(cleaned, detectedLocale);
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
  static detectNumberFormat(str: string): "de" | "en" {
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
   * Normalizes a localized numeric string into a canonical form parseable by `parseFloat`.
   *
   * - For `de`, removes thousand separators (.) and replaces decimal comma with dot.
   * - For `en`, removes thousand separators (,) and keeps dot as decimal.
   *
   * @param str - Localized numeric string.
   * @param locale - Detected locale: `"de"` or `"en"`.
   * @returns A normalized number string suitable for `Number.parseFloat`.
   */
  static normalizeNumber(str: string, locale: "de" | "en"): string {
    return locale === "de"
      ? str.replace(/\./g, "").replace(",", ".")
      : str.replace(/,/g, "");
  }

  /**
   * Normalizes a booking type name by trimming, collapsing whitespace, and case-folding.
   *
   * @param name - The name to normalize.
   * @returns The normalized name.
   */
  static normalizeBookingTypeName(name: string): string {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
  }

  static log(msg: string, data?: unknown, level: LogLevelType = "log"): void {
    const debugLevel = Number.parseInt(
      localStorage.getItem(LOCAL_STORAGE.DEBUG.key) ?? "0"
    );

    if (debugLevel <= 0) return;

    // eslint-disable-next-line no-console
    const logFn = console[level] || console.log;
    data !== undefined ? logFn(msg, data) : logFn(msg);
  }

  /**
   * Computes the arithmetic mean of the provided numbers, ignoring zeros and non-finite values.
   *
   * @param numbers - List of numeric values.
   * @returns The mean of valid, non-zero numbers; returns 0 if none.
   */
  static mean(numbers: number[]): number {
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
   * Checks if two arrays contain exactly the same strings (order-insensitive, no duplicates considered).
   *
   * @param arr1 - First array of strings.
   * @param arr2 - Second array of strings.
   * @returns True if both arrays contain the same unique set of strings.
   */
  static haveSameStrings(arr1: string[], arr2: string[]): boolean {
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
   * Additional utility: debounced function creator
   */
  /**
   * Creates a debounced version of a function that delays its execution until after
   * `delay` milliseconds have elapsed since the last time it was invoked.
   *
   * @typeParam T - Function type.
   * @param fn - Function to debounce.
   * @param delay - Delay in milliseconds.
   * @returns Debounced function retaining the original parameters.
   */
  static debounce<T extends (..._args: any[]) => any>(
    fn: T,
    delay: number
  ): (..._args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Additional utility: throttled function creator
   */
  /**
   * Creates a throttled version of a function that only invokes `fn` at most once
   * every `limit` milliseconds.
   *
   * @typeParam T - Function type.
   * @param fn - Function to throttle.
   * @param limit - Minimum interval between invocations in milliseconds.
   * @returns Throttled function retaining the original parameters.
   */
  static throttle<T extends (..._args: any[]) => any>(
    fn: T,
    limit: number
  ): (..._args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoize expensive computations
   */
  /**
   * Memoizes a pure function by caching results keyed by the JSON-serialized arguments.
   *
   * Note: Suitable only for functions with JSON-serializable arguments and deterministic outputs.
   *
   * @typeParam T - Function type.
   * @param fn - Function to memoize.
   * @returns A memoized version of the function.
   */
  static memoize<T extends (..._args: any[]) => any>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Create a cleanup function for component unmounting
   */
  /**
   * Creates a simple cleanup aggregator for registering and executing teardown callbacks.
   *
   * @returns An object with `add` to register callbacks and `cleanup` to run them.
   */
  static createCleanup() {
    const cleanupFns: (() => void)[] = [];

    return {
      add: (fn: () => void) => cleanupFns.push(fn),
      cleanup: () => cleanupFns.forEach((fn) => fn())
    };
  }
}

UtilsService.log("--- domain/utils.ts ---");
