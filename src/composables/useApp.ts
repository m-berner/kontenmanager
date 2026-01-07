/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {useAppConfig} from '@/composables/useAppConfig'

const {LOCAL_STORAGE} = useAppConfig()

export function useApp() {
    function utcDate(iso: string): Date {
        return new Date(`${iso}T00:00:00.000`)
    }

    function isoDate(ms: number): string {
        return new Date(ms).toISOString().substring(0, 10)
    }

    // function toNumber(str: string | boolean | number | undefined | null): number {
    //     let result = 0
    //     if (str !== null && str !== undefined) {
    //         const a = str.toString().replace(/,$/g, '')
    //         const b = a.split(',')
    //         if (b.length === 2) {
    //             const tmp2 = a
    //                 .trim()
    //                 .replace(/\s|\.|\t|%/g, '')
    //                 .replace(',', '.')
    //             result = Number.isNaN(Number.parseFloat(tmp2))
    //                 ? 0
    //                 : Number.parseFloat(tmp2)
    //         } else if (b.length > 2) {
    //             let tmp: string = ''
    //             for (let i = b.length - 1; i > 0; i--) {
    //                 tmp += b[i]
    //             }
    //             const tmp2 = `${tmp}.${b[0]}`
    //             result = Number.isNaN(Number.parseFloat(tmp2))
    //                 ? 0
    //                 : Number.parseFloat(tmp2)
    //         } else {
    //             result = Number.isNaN(parseFloat(b[0])) ? 0 : Number.parseFloat(b[0])
    //         }
    //     }
    //     return result
    // }

    /**
     * Converts a string, number, or boolean to a number.
     * Handles various number formats including:
     * - European format: 1.234,56 (dot as thousands separator, comma as decimal)
     * - US format: 1,234.56 (comma as thousands separator, dot as decimal)
     * - Percentages: 25% -> 25
     * - Whitespace and tabs
     *
     * @param str - Input value to convert
     * @param locale - Optional locale hint ('de' for European, 'en' for US format)
     * @returns Parsed number or 0 if parsing fails
     */
    function toNumber(
        str: string | boolean | number | undefined | null,
        locale?: 'de' | 'en'
    ): number {
        // Handle null/undefined
        if (str === null || str === undefined) {
            return 0
        }

        // Handle boolean
        if (typeof str === 'boolean') {
            return str ? 1 : 0
        }

        // Handle number (already parsed)
        if (typeof str === 'number') {
            return Number.isNaN(str) ? 0 : str
        }

        // Clean the string
        let cleaned = str
            .toString()
            .trim()
            .replace(/\s|\t/g, '') // Remove whitespace and tabs
            .replace(/%$/g, '')     // Remove trailing percentage sign

        if (cleaned === '') {
            return 0
        }

        // Auto-detect format if locale not specified
        if (!locale) {
            // Count dots and commas
            const dotCount = (cleaned.match(/\./g) || []).length
            const commaCount = (cleaned.match(/,/g) || []).length
            const lastDot = cleaned.lastIndexOf('.')
            const lastComma = cleaned.lastIndexOf(',')

            // Determine format based on position and count
            if (commaCount === 0 && dotCount > 0) {
                // Only dots: US format (or single decimal)
                locale = 'en'
            } else if (dotCount === 0 && commaCount > 0) {
                // Only commas: could be European decimal or US thousands
                // If last comma is within last 3 chars, it's likely European decimal
                locale = (cleaned.length - lastComma <= 4) ? 'de' : 'en'
            } else if (lastComma > lastDot) {
                // Comma comes after dot: European format (1.234,56)
                locale = 'de'
            } else {
                // Dot comes after comma: US format (1,234.56)
                locale = 'en'
            }
        }

        // Parse based on detected/specified locale
        if (locale === 'de') {
            // European format: remove dots (thousands), replace comma with dot (decimal)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.')
        } else {
            // US format: remove commas (thousands), keep dots (decimal)
            cleaned = cleaned.replace(/,/g, '')
        }

        const result = Number.parseFloat(cleaned)
        return Number.isNaN(result) ? 0 : result
    }

    function log(msg: string, mode?: { info?: unknown, warn?: unknown, error?: unknown }) {
        const localDebug = localStorage.getItem(LOCAL_STORAGE.PROPS.DEBUG)
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                // eslint-disable-next-line no-console
                console.info(msg, mode?.info)
            } else if (mode?.warn !== undefined) {
                // eslint-disable-next-line no-console
                console.warn(msg, mode?.warn)
            } else if (mode?.error !== undefined) {
                // eslint-disable-next-line no-console
                console.error(msg, mode?.error)
            } else {
                // eslint-disable-next-line no-console
                console.log(msg)
            }
        }
    }

    function mean(nar: number[]): number {
        let sum = 0
        let len: number = nar.length
        for (const n of nar) {
            if (n !== 0 && !Number.isNaN(n)) {
                sum += n
            } else {
                len--
            }
        }
        return len > 0 ? sum / len : 0
    }

    function haveSameStrings(arr1: string[], arr2: string[]): boolean {
        if (arr1.length !== arr2.length) {
            return false
        }
        const set1 = new Set(arr1)
        const set2 = new Set(arr2)
        if (set1.size !== set2.size) {
            return false
        }
        for (const item of set1) {
            if (!set2.has(item)) {
                return false
            }
        }
        return true
    }

    return {
        utcDate,
        isoDate,
        toNumber,
        haveSameStrings,
        log,
        mean
    }
}
