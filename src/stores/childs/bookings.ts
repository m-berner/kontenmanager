/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IBooking} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'

const {log} = useApp()

export const useBookingsStore = defineStore('bookings', () => {

    const items: Ref<IBooking[]> = ref([])

    const getById = computed(() => (id: number): IBooking | undefined => {
        return items.value.find(account => account.cID === id)
    })
    const getIndexById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IBooking) => entry.cID === ident)
    })
    const getTextById = computed(() => (ident: number): string => {
        const booking = items.value.find((entry: IBooking) => entry.cID === ident)
        if (booking) {
            return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`
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
                .map((entry: IBooking) => {
                    const fees = entry.cTax + entry.cSourceTax + entry.cTransactionTax + entry.cSoli + entry.cFee
                    const balance = entry.cCredit - entry.cDebit
                    return fees + balance
                })
                .reduce((acc: number, cur: number) => acc + cur, 0)
        } else {
            return 0
        }
    })
    const hasBookingType = computed(() => (ident: number): boolean => {
        const findings = items.value.filter((entry: IBooking) => entry.cBookingTypeID === ident)
        return findings.length > 0
    })
    const sumFees = computed(() => {
        return items.value.map((entry: IBooking) => {
            return entry.cFee
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const sumTaxes = computed(() => {
        return items.value.map((entry: IBooking) => {
            return entry.cTax || entry.cSoli || entry.cSourceTax || entry.cTransactionTax
        }).reduce((acc: number, cur: number) => acc + cur, 0)
    })
    const portfolioByStockId = computed(() => (ident: number) => {
        const bought = items.value.filter((entry: IBooking) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 1
        }).map((entry: IBooking) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        const sold = items.value.filter((entry: IBooking) => {
            return entry.cStockID === ident && entry.cBookingTypeID === 2
        }).map((entry: IBooking) => {
            return entry.cCount
        }).reduce((acc: number, cur: number) => acc + cur, 0)
        return bought - sold
    })

    function add(booking: IBooking, prepend: boolean = false): void {
        log('BOOKINGS_STORE: add')
        if (prepend) {
            items.value.unshift(booking)
        } else {
            items.value.push(booking)
        }
    }

    function update(booking: IBooking): void {
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
        add,
        update,
        remove,
        clean
    }
})

log('--- STORES bookings.ts ---')
