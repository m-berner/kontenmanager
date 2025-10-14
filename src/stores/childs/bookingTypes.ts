/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IBookingType} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'

const {log} = useApp()

export const useBookingTypesStore = defineStore('bookingTypes', () => {
    const items: Ref<IBookingType[]> = ref([])

    const getNameById = computed(() => (ident: number): string => {
        const bookingType = items.value.find((entry: IBookingType) => entry.cID === ident)
        return bookingType ? bookingType.cName : ''
    })
    const getById = computed(() => (ident: number): IBookingType | null => {
        const bookingType = items.value.find((entry: IBookingType) => entry.cID === ident)
        return bookingType ? bookingType : null
    })
    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(bookingType => bookingType.cID === id)
    })
    const isDuplicate = computed(() => (name: string): boolean => {
        const duplicates = items.value.filter((entry: IBookingType) => entry.cName === name)
        return duplicates.length > 0
    })
    const getNames = computed(() => items.value.map(item => item.cName))
    const getNamesWithIndex = computed(() => items.value.map((item, index) => ({
        name: item.cName,
        index
    })))

    function add(bookingType: IBookingType, prepend: boolean = false): void {
        log('BOOKING_TYPES_STORE: add')
        if (prepend) {
            items.value.unshift(bookingType)
        } else {
            items.value.push(bookingType)
        }
    }

    function update(bookingType: IBookingType): void {
        log('BOOKING_TYPES_STORE: update')
        const index = getIndexById.value(bookingType.cID)
        if (index !== -1) {
            items.value[index] = {...bookingType}
        }
    }

    function remove(ident: number): void {
        log('BOOKING_TYPE_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
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
        getById,
        getNameById,
        getIndexById,
        getNames,
        getNamesWithIndex,
        isDuplicate,
        add,
        remove,
        update,
        clean
    }
})

log('--- STORES bookingTypes.ts ---')
