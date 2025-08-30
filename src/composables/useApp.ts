/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

export const useApp = () => {
    const utcDate = (iso: string): Date => {
        return new Date(`${iso}T00:00:00.000`)
    }
    const toISODate = (ms: number): string => {
        return new Date(ms).toISOString().substring(0, 10)
    }
    const toNumber = (str: string | boolean | number | undefined | null): number => {
        let result = 0
        if (str !== null && str !== undefined) {
            const a = str.toString().replace(/,$/g, '')
            const b = a.split(',')
            if (b.length === 2) {
                const tmp2 = a
                    .trim()
                    .replace(/\s|\.|\t|%/g, '')
                    .replace(',', '.')
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2)
            } else if (b.length > 2) {
                let tmp: string = ''
                for (let i = b.length - 1; i > 0; i--) {
                    tmp += b[i]
                }
                const tmp2 = `${tmp}.${b[0]}`
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2)
            } else {
                result = Number.isNaN(parseFloat(b[0])) ? 0 : Number.parseFloat(b[0])
            }
        }
        return result
    }
    const mean = (nar: number[]): number => {
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
    return {
        utcDate,
        toISODate,
        toNumber,
        mean
    }
}
