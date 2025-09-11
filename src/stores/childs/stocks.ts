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

    const getStockById = computed(() => (ident: number): number => {
        return items.value.findIndex((entry: IStock) => entry.cID === ident)
    })

    const getStockIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(stock => stock.cID === id)
    })

    function addStock(stock: IStock, prepend: boolean = false): void {
        log('STOCKS_STORE: addStock')
        if (prepend) {
            items.value.unshift(stock)
        } else {
            items.value.push(stock)
        }
    }

    function updateStock(stock: IStock): void {
        log('STOCKS_STORE: updateStock')
        const index = getStockById.value(stock?.cID ?? -1)
        if (index !== -1) {
            items.value[index] = {...stock}
        }
    }

    function deleteStock(ident: number): void {
        log('STOCKS_STORE: deleteStock', {info: ident})
        const index = getStockById.value(ident)
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
        getStockById,
        getStockIndexById,
        addStock,
        updateStock,
        deleteStock,
        clean
    }
})

log('--- STORES stocks.ts ---')
