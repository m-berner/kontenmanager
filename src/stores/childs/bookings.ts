/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IBooking_Store} from '@/types.d'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'

const {log} = useApp()

export const useBookingsStore = defineStore('bookings', () => {

    const items = ref<IBooking_Store[]>([])

    const getById = computed(() => (id: number): IBooking_Store | undefined => {
        return items.value.find(account => account.cID === id)
    })
    const getIndexById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IBooking_Store) => entry.cID === ident)
    })
    const getTextById = computed(() => (ident: number): string => {
        const booking = items.value.find((entry: IBooking_Store) => entry.cID === ident)
        if (booking) {
            return `${booking.cBookDate} : ${booking.cDebit} : ${booking.cCredit}`
        } else {
            throw new Error('getTextById: No booking found for given ID')
        }
    })
    const sumBookings = computed(() => (): number => {
        const {activeAccountId} = useSettings()

        if (activeAccountId.value === -1) {
            return 0
        }

        if (items.value.length > 0) {
            return items.value
                .map((entry: IBooking_Store) => {
                    const fees = entry.cTaxDebit - entry.cTaxCredit + entry.cSourceTaxDebit - entry.cSourceTaxCredit + entry.cTransactionTaxDebit - entry.cTransactionTaxCredit + entry.cSoliDebit - entry.cSoliCredit + entry.cFeeDebit - entry.cFeeCredit
                    const balance = entry.cCredit - entry.cDebit
                    return balance - fees
                })
                .reduce((acc: number, cur: number) => acc + cur, 0)
        } else {
            return 0
        }
    })
    const hasBookingType = computed(() => (ident: number): boolean => {
        const findings = items.value.filter((entry: IBooking_Store) => entry.cBookingTypeID === ident)
        return findings.length > 0
    })
    const sumFees = computed(() => {
        return items.value.map((entry: IBooking_Store) => {
            return entry.cFeeDebit - entry.cFeeCredit
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const sumTaxes = computed(() => {
        return items.value.map((entry: IBooking_Store) => {
            return entry.cTaxDebit - entry.cTaxCredit + entry.cSoliDebit - entry.cSoliCredit + entry.cSourceTaxDebit - entry.cSourceTaxCredit + entry.cTransactionTaxDebit - entry.cTransactionTaxCredit
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const portfolioByStockId = computed(() => (ident: number) => {
        const bought = items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1
        }).map((entry: IBooking_Store) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        const sold = items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 2
        }).map((entry: IBooking_Store) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        return bought - sold
    })

    const investByStockId = computed(() => (ident: number) => {
        let portfolio = 0
        return items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1
        }).map((entry: IBooking_Store) => {
            portfolio += entry.cCount
            if (portfolio <= portfolioByStockId.value(ident)) {
                return entry.cDebit
            } else {
                return 0
            }
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })

    const dividendsByStockId = computed(() => (ident: number) => {
        return items.value.filter((entry: IBooking_Store) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 3
        }).map((entry: IBooking_Store) => {
            return {id: ident, year: entry.cExDate, sum: entry.cCredit}
        })
    })

    function add(booking: IBooking_Store, prepend: boolean = false): void {
        log('BOOKINGS_STORE: add')
        if (prepend) {
            items.value.unshift(booking)
        } else {
            items.value.push(booking)
        }
    }

    function update(booking: IBooking_Store): void {
        log('BOOKINGS_STORE: update')
        const index = getIndexById.value(booking?.cID ?? -1)
        if (index !== -1) {
            items.value[index] = {...booking}
        }
    }

    function remove(ident: number): void {
        log('BOOKINGS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        items.value.length = 0
    }

    return {
        items,
        getById,
        getIndexById,
        getTextById,
        sumBookings,
        sumFees,
        sumTaxes,
        hasBookingType,
        portfolioByStockId,
        investByStockId,
        dividendsByStockId,
        add,
        update,
        remove,
        clean
    }
})

log('--- STORES bookings.ts ---')
