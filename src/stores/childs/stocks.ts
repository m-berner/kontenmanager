/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IStock} from '@/types'
import type {Ref} from 'vue'
import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'

const {log} = useApp()

export const useStocks = defineStore('stocks', () => {
    const items: Ref<IStock[]> = ref([])

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(stock => stock.cID === id)
    })
    const getItemById = computed(() => (id: number): IStock => items.value[getIndexById.value(id)])

    function add(stock: IStock, prepend: boolean = false): void {
        log('STOCKS_STORE: add')
        if (prepend) {
            items.value.unshift(stock)
        } else {
            items.value.push(stock)
        }
    }

    function updateStock(stock: IStock): void {
        log('STOCKS_STORE: updateStock')
        const index = getIndexById.value(stock?.cID ?? -1)
        if (index !== -1) {
            items.value[index] = {...stock}
        }
    }

    function remove(ident: number): void {
        log('STOCKS_STORE: remove', {info: ident})
        const index = getIndexById.value(ident)
        if (index !== -1) {
            items.value.splice(index, 1)
        }
    }

    function clean(): void {
        log('STOCKS_STORE: clean')
        items.value.length = 0
    }

    return {
        items,
        getItemById,
        getIndexById,
        add,
        updateStock,
        remove,
        clean
    }
})

log('--- STORES stocks.ts ---')
