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
import {useSettings} from '@/composables/useSettings'
import {useFetch} from '@/composables/useFetch'
import {useRuntime} from '@/composables/useRuntime'

const {log, toNumber} = useApp()

export const useStocksStore = defineStore('stocks', () => {
    const items: Ref<IStock[]> = ref([])
    // const itemsActive: Ref<IStock[]> = ref([])

    const getIndexById = computed(() => (id: number): number => {
        return items.value.findIndex(stock => stock.cID === id)
    })
    const getItemById = computed(() => (id: number): IStock => items.value[getIndexById.value(id)])

    const passive = computed(() => {
        return items.value.filter(rec => rec.cFadeOut === 1)
    })

    const active = computed(() => {
        return items.value.filter((rec, ind) => {
            return rec.cFadeOut === 0 && ind > 0
        })
    })

    function add(stock: IStock, prepend: boolean = false): void {
        log('STOCKS_STORE: add')
        if (prepend) {
            items.value.unshift(stock)
        } else {
            items.value.push(stock)
        }
    }

    // function addActive(stock: IStock): void {
    //     log('STOCKS_STORE: addActive')
    //     itemsActive.value.push(stock)
    // }

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

    async function loadOnlineData(page: number) {
        log('INDEXED_DB/STOCKS: loadOnlineData')
        const {fetchMinRateMaxData} = useFetch()
        const {loadedStocksPages} = useRuntime()
        const {stocksPerPage} = useSettings()
        const isin = []
        const isinDates = []
        const itemsLength = active.value.length
        const rest = itemsLength % stocksPerPage.value
        const lastPage = Math.ceil(itemsLength / stocksPerPage.value)
        let pageStocks: IStock[] = []
        if (itemsLength > 0) {
            if (page < lastPage || rest === 0) {
                pageStocks = active.value.slice(
                    (page - 1) * stocksPerPage.value,
                    (page - 1) * stocksPerPage.value + stocksPerPage.value
                )
            } else {
                pageStocks = active.value.slice(
                    (page - 1) * stocksPerPage.value,
                    (page - 1) * stocksPerPage.value + rest
                )
            }
            for (let i = 0; i < pageStocks.length; i++) {
                if (pageStocks[i].mValue === 0) {
                    isin.push({
                        id: pageStocks[i].cID,
                        isin: pageStocks[i].cISIN,
                        min: '0',
                        rate: '0',
                        max: '0',
                        cur: ''
                    })
                }
                if ((pageStocks[i].cMeetingDay === '1970-01-01' || pageStocks[i].cQuarterDay === '1970-01-01') && pageStocks[i].mAskDates) {
                    isinDates.push({
                        id: pageStocks[i].cID,
                        isin: pageStocks[i].cISIN,
                        gm: pageStocks[i].cMeetingDay,
                        qf: pageStocks[i].cQuarterDay
                    })
                    pageStocks[i].mAskDates = false
                }
            }
        }
        const minRateMaxResponse = await fetchMinRateMaxData(isin)
        for (let i = 0; i < pageStocks.length; i++) {
            pageStocks[i].mMin = toNumber(minRateMaxResponse[i].min)
            pageStocks[i].mValue = toNumber(minRateMaxResponse[i].rate)
            pageStocks[i].mMax = toNumber(minRateMaxResponse[i].max)
        }
        loadedStocksPages.add(page)

        items.value.sort((a: IStock, b: IStock) => {
            return a.cFirstPage - b.cFirstPage
        })
    }

    return {
        items,
        // itemsActive,
        getItemById,
        getIndexById,
        active,
        passive,
        add,
        // addActive,
        updateStock,
        remove,
        clean,
        loadOnlineData
    }
})

log('--- STORES stocks.ts ---')
