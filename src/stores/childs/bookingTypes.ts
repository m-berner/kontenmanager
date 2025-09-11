/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IBookingType} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'

const {log} = useApp()

export const useBookingTypes = defineStore('bookingTypes', () => {
    // STATE (using ref)
    const items: Ref<IBookingType[]> = ref([])

    // GETTERS (using computed)
    const getBookingTypeNameById = computed(() => (ident: number): string => {
        const bookingType = items.value.find((entry: IBookingType) => entry.cID === ident)
        return bookingType ? bookingType.cName : ''
    })

    const getBookingTypeById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IBookingType) => entry.cID === ident)
    })

    const getBookingTypeIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(bookingType => bookingType.cID === id)
    })

    const isDuplicate = computed(() => (nam: string): number => {
        return items.value.findIndex((entry: IBookingType) => entry.cName === nam)
    })

    // ACTIONS/SETTERS (regular functions)
    function addBookingType(bookingType: IBookingType, prepend: boolean = false): void {
        log('BOOKING_TYPES_STORE: addBookingType')
        if (prepend) {
            items.value.unshift(bookingType)
        } else {
            items.value.push(bookingType)
        }
    }

    function updateBookingType(bookingType: IBookingType): void {
        log('BOOKING_TYPES_STORE: updateBookingType')
        const index = getBookingTypeIndexById.value(bookingType.cID)
        if (index !== -1) {
            items.value[index] = {...bookingType}
        }
    }

    function deleteBookingType(ident: number): void {
        log('BOOKING_TYPE_STORE: deleteBookingType', {info: ident})
        const index = getBookingTypeById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        log('BOOKING_TYPES_STORE: clean')
        items.value.length = 0
    }

    return {
        items,
        getBookingTypeById,
        getBookingTypeNameById,
        isDuplicate,
        addBookingType,
        deleteBookingType,
        updateBookingType,
        clean
    }
})

log('--- STORES bookingTypes.ts ---')
