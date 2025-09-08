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
import {useNotification} from '@/composables/useNotification'
import {useSettingsStore} from '@/stores/settings'

const {log} = useNotification()

export const useBookings = defineStore('bookings', () => {
    // STATE (using ref)
    const items: Ref<IBooking[]> = ref([])

    // GETTERS (using computed)
    const getBookingsByAccountId = computed(() => (accountId: number): IBooking[] => {
        return items.value.filter(booking => booking.cAccountNumberID === accountId)
    })

    const getBookingById = computed(() => (id: number): IBooking | undefined => {
        return items.value.find(account => account.cID === id)
    })

    const getBookingIndexById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IBooking) => entry.cID === ident)
    })

    const getBookingTextById = computed(() => (ident: number): string => {
        const booking = items.value.find((entry: IBooking) => entry.cID === ident)
        if (booking) {
            return `${booking.cDate} : ${booking.cDebit} : ${booking.cCredit}`
        } else {
            throw new Error('getBookingTextById: No booking found for given ID')
        }
    })

    const sumBookings = computed(() => (): number => {
        const settings = useSettingsStore()

        if (settings.activeAccountId === -1) {
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

    // ACTIONS/SETTERS (regular functions)
    function addBooking(booking: IBooking, prepend: boolean = false): void {
        log('BOOKINGS_STORE: addBooking')
        if (prepend) {
            items.value.unshift(booking)
        } else {
            items.value.push(booking)
        }
    }

    // function setBookings(booking: IBooking[]): void {
    //     log('BOOKINGS: setBookings')
    //     items.value = [...booking]
    // }

    function updateBooking(booking: IBooking): void {
        log('BOOKINGS_STORE: updateBooking')
        const index = getBookingIndexById.value(booking?.cID ?? -1)
        if (index !== -1) {
            items.value[index] = {...booking}
        }
    }

    function deleteBooking(ident: number): void {
        log('BOOKINGS_STORE: deleteBooking', {info: ident})
        const index = getBookingIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        items.value.length = 0
    }

    return {
        items,
        getBookingById,
        getBookingIndexById,
        getBookingsByAccountId,
        getBookingTextById,
        sumBookings,
        addBooking,
        //setBookings,
        updateBooking,
        deleteBooking,
        clean
    }
})

log('--- STORE bookings.ts ---')
