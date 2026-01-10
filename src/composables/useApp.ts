/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {useAppConfig} from '@/composables/useAppConfig'
import type {I_Number_Parse_Options, T_Log_Level} from '@/types'

const {DATE, LOCAL_STORAGE} = useAppConfig()

export function useApp() {

    function utcDate(iso: string): Date {
        if (!DATE.ISO_DATE_REGEX.test(iso) && iso !== '') {
            throw new Error(`Invalid ISO date format: ${iso}`)
        }
        return new Date(`${iso}T00:00:00.000`)
    }

    function isoDate(ms: number): string {
        if (!Number.isFinite(ms)) {
            throw new Error(`Invalid timestamp: ${ms}`)
        }
        return new Date(ms).toISOString().substring(0, 10)
    }

    function isValidISODate(iso: string): boolean {
        return DATE.ISO_DATE_REGEX.test(iso) && !isNaN(utcDate(iso).getTime())
    }

    /**
     * Converts a string, number, or boolean to a number.
     * Handles various number formats including:
     * - European format: 1.234,56 (dot as thousands separator, comma as decimal)
     * - US format: 1,234.56 (comma as thousands separator, dot as decimal)
     * - Percentages: 25% -> 25
     * - Whitespace and tabs
     *
     * @param value - Input value to convert
     * @param options - Optional locale hint ('de' for European, 'en' for US format)
     * @returns Parsed number or 0 if parsing fails
     */
    function toNumber(
        value: string | boolean | number | undefined | null,
        options: I_Number_Parse_Options = {}
    ): number {
        const {locale, fallback = 0, throwOnError = false} = options

        // Handle primitive types
        if (value === null || value === undefined) return fallback
        if (typeof value === 'boolean') return value ? 1 : 0
        if (typeof value === 'number') {
            return Number.isNaN(value) ? fallback : value
        }

        // Clean and parse string
        const cleaned = value
            .toString()
            .trim()
            .replace(/\s|\t/g, '')
            .replace(/%$/g, '')

        if (cleaned === '') return fallback

        const isParseError = () => {
            if (throwOnError) {
                throw new Error(`Cannot parse "${value}" as number`)
            }
        }

        try {
            // Auto-detect format if locale not specified
            const detectedLocale = locale || detectNumberFormat(cleaned)
            const normalized = normalizeNumber(cleaned, detectedLocale)
            const result = Number.parseFloat(normalized)

            if (Number.isNaN(result)) {
                isParseError()
                return fallback
            }

            return result
        } catch (error) {
            if (throwOnError) throw error
            return fallback
        }
    }

    function detectNumberFormat(str: string): 'de' | 'en' {
        const dotCount = (str.match(/\./g) || []).length
        const commaCount = (str.match(/,/g) || []).length
        const lastDot = str.lastIndexOf('.')
        const lastComma = str.lastIndexOf(',')

        // Only dots: US format
        if (commaCount === 0 && dotCount > 0) return 'en'

        // Only commas: check position (last 3-4 chars = decimal)
        if (dotCount === 0 && commaCount > 0) {
            return (str.length - lastComma <= 4) ? 'de' : 'en'
        }

        // Both present: comma after dot = European
        return lastComma > lastDot ? 'de' : 'en'
    }

    function normalizeNumber(str: string, locale: 'de' | 'en'): string {
        return locale === 'de'
            ? str.replace(/\./g, '').replace(',', '.')
            : str.replace(/,/g, '')
    }

    function log(
        msg: string,
        data?: unknown,
        level: T_Log_Level = 'log'
    ): void {
        const debugLevel = Number.parseInt(
            localStorage.getItem(LOCAL_STORAGE.DEBUG.key) ?? '0'
        )

        if (debugLevel <= 0) return

        // eslint-disable-next-line no-console
        const logFn = console[level] || console.log
        data !== undefined ? logFn(msg, data) : logFn(msg)
    }

    function mean(numbers: number[]): number {
        if (numbers.length === 0) return 0

        let sum = 0
        let count = 0

        for (const n of numbers) {
            if (n !== 0 && Number.isFinite(n)) {
                sum += n
                count++
            }
        }

        return count > 0 ? sum / count : 0
    }

    function haveSameStrings(arr1: string[], arr2: string[]): boolean {
        if (arr1.length !== arr2.length) return false

        const set1 = new Set(arr1)
        const set2 = new Set(arr2)

        if (set1.size !== set2.size) return false

        for (const item of set1) {
            if (!set2.has(item)) return false
        }

        return true
    }

    /**
     * Additional utility: debounced function creator
     */
    function debounce<T extends (..._args: any[]) => any>(
        fn: T,
        delay: number
    ): (..._args: Parameters<T>) => void {
        let timeoutId: ReturnType<typeof setTimeout>

        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => fn(...args), delay)
        }
    }

    /**
     * Additional utility: throttled function creator
     */
    function throttle<T extends (..._args: any[]) => any>(
        fn: T,
        limit: number
    ): (..._args: Parameters<T>) => void {
        let inThrottle: boolean

        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                fn(...args)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }

    /**
     * Memoize expensive computations
     */
    function memoize<T extends (..._args: any[]) => any>(fn: T): T {
        const cache = new Map<string, ReturnType<T>>()

        return ((...args: Parameters<T>) => {
            const key = JSON.stringify(args)

            if (cache.has(key)) {
                return cache.get(key)!
            }

            const result = fn(...args)
            cache.set(key, result)
            return result
        }) as T
    }

    /**
     * Create a cleanup function for component unmounting
     */
    function createCleanup() {
        const cleanupFns: (() => void)[] = []

        return {
            add: (fn: () => void) => cleanupFns.push(fn),
            cleanup: () => cleanupFns.forEach(fn => fn())
        }
    }

    return {
        utcDate,
        isoDate,
        isValidISODate,
        toNumber,
        haveSameStrings,
        log,
        mean,
        debounce,
        throttle,
        createCleanup,
        memoize
    }
}
