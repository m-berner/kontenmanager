/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {ThemeInstance} from 'vuetify'
import type {Ref} from 'vue'
import {ref} from 'vue'
import {defineStore} from 'pinia'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'

const {CONS} = useConstant()
const {log} = useNotification()

export const useSettingsStore = defineStore('settings', () => {
    const skin: Ref<string> = ref(CONS.DEFAULTS.STORAGE.SKIN)
    const bookingsPerPage: Ref<number> = ref(CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE)
    const stocksPerPage: Ref<number> = ref(CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE)
    const activeAccountId: Ref<number> = ref(0)
    const partner: Ref<boolean> = ref(false)
    const service: Ref<string> = ref(CONS.DEFAULTS.STORAGE.SERVICE)
    const materials: Ref<string[]> = ref(CONS.DEFAULTS.STORAGE.MATERIALS)
    const markets: Ref<string[]> = ref(CONS.DEFAULTS.STORAGE.MARKETS)
    const indexes: Ref<string[]> = ref(CONS.DEFAULTS.STORAGE.INDEXES)
    const exchanges: Ref<string[]> = ref(CONS.DEFAULTS.STORAGE.EXCHANGES)

    function setActiveAccountId(value: number) {
        activeAccountId.value = value
    }

    function setBookingsPerPage(value: number) {
        bookingsPerPage.value = value
    }

    function setStocksPerPage(value: number) {
        stocksPerPage.value = value
    }

    function setPartner(value: boolean) {
        partner.value = value
    }

    function setService(value: string) {
        service.value = value
    }

    function setMaterials(value: string[]) {
        materials.value = value
    }

    function setMarkets(value: string[]) {
        markets.value = value
    }

    function setIndexes(value: string[]) {
        indexes.value = value
    }

    function setExchanges(value: string[]) {
        exchanges.value = value
    }

    function setSkin(theme: ThemeInstance, value: string) {
        if (theme?.global?.name) {
            theme.global.name.value = value
        }
        skin.value = value
    }

    function initStore(theme: ThemeInstance, storage: { [p: string]: string | number | boolean | string[] }): void {
        log('SETTINGS: initStore', {info: storage})
        if (theme?.global?.name) {
            theme.global.name.value = storage.sSkin as string
        }
        skin.value = storage.sSkin as string
        bookingsPerPage.value = storage.sBookingsPerPage as number
        stocksPerPage.value = storage.sStocksPerPage as number
        activeAccountId.value = storage.sActiveAccountId as number
        partner.value = storage.sPartner as boolean
        service.value = storage.sService as string
        materials.value = [...storage.sMaterials as string[]]
        markets.value = [...storage.sMarkets as string[]]
        indexes.value = [...storage.sIndexes as string[]]
        exchanges.value = [...storage.sExchanges as string[]]
    }

    function updatePagination(bookings: number, stocks: number): void {
        bookingsPerPage.value = bookings
        stocksPerPage.value = stocks
    }

    function updateMarketData(data: Partial<{
        materials: string[]
        markets: string[]
        indexes: string[]
        exchanges: string[]
    }>): void {
        if (data.materials) materials.value = [...data.materials]
        if (data.markets) markets.value = [...data.markets]
        if (data.indexes) indexes.value = [...data.indexes]
        if (data.exchanges) exchanges.value = [...data.exchanges]
    }

    function validateSettings(): boolean {
        return (
            bookingsPerPage.value > 0 &&
            stocksPerPage.value > 0 &&
            skin.value.length > 0 &&
            service.value.length > 0 &&
            Array.isArray(materials.value) &&
            Array.isArray(markets.value) &&
            Array.isArray(indexes.value) &&
            Array.isArray(exchanges.value)
        )
    }

    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        activeAccountId,
        partner,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        setActiveAccountId,
        setBookingsPerPage,
        setStocksPerPage,
        setPartner,
        setService,
        setMaterials,
        setMarkets,
        setIndexes,
        setExchanges,
        setSkin,
        initStore,
        updatePagination,
        updateMarketData,
        validateSettings
    }
})

log('--- STORE settings.js ---')
