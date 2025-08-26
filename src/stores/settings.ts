/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {type ThemeInstance} from 'vuetify'
import {useApp} from '@/composables/useApp'

interface ISettingsStore {
    skin: string
    bookingsPerPage: number
    stocksPerPage: number
    activeAccountId: number
    partner: boolean
    service: string
    materials: string[]
    markets: string[]
    indexes: string[]
    exchanges: string[]
}

const {CONS, log} = useApp()

export const useSettingsStore = defineStore('settings', {
    state: (): ISettingsStore => {
        return {
            skin: CONS.DEFAULTS.STORAGE.SKIN,
            bookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE,
            stocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE,
            activeAccountId: 0,
            partner: false,
            service: CONS.DEFAULTS.STORAGE.SERVICE,
            materials: CONS.DEFAULTS.STORAGE.MATERIALS,
            markets: CONS.DEFAULTS.STORAGE.MARKETS,
            indexes: CONS.DEFAULTS.STORAGE.INDEXES,
            exchanges: CONS.DEFAULTS.STORAGE.EXCHANGES
        }
    },
    getters: {
        hasActiveAccount: (state): boolean => state.activeAccountId !== -1,
    },
    actions: {
        setActiveAccountId(value: number) {
            this.activeAccountId = value
        },
        setBookingsPerPage(value: number) {
            this.bookingsPerPage = value
        },
        setStocksPerPage(value: number) {
            this.stocksPerPage = value
        },
        setPartner(value: boolean) {
            this.partner = value
        },
        setService(value: string) {
            this.service = value
        },
        setMaterials(value: string[]) {
            this.materials = [...value]
        },
        setMarkets(value: string[]) {
            this.markets = [...value]
        },
        setIndexes(value: string[]) {
            this.indexes = [...value]
        },
        setExchanges(value: string[]) {
            this.exchanges = [...value]
        },
        setSkin(theme: ThemeInstance, value: string) {
            if (theme?.global?.name) {
                theme.global.name.value = value
            }
            this.skin = value
        },
        initStore(theme: ThemeInstance, storage: { [p: string]: never }): void {
            log('SETTINGS: initStore')
            if (theme?.global?.name) {
                theme.global.name.value = storage.sSkin
            }
            this.skin = storage.sSkin
            this.bookingsPerPage = storage.sBookingsPerPage
            this.stocksPerPage = storage.sStocksPerPage
            this.activeAccountId = storage.sActiveAccountId
            this.partner = storage.sPartner
            this.service = storage.sService
            this.materials = [...storage.sMaterials]
            this.markets = [...storage.sMarkets]
            this.indexes = [...storage.sIndexes]
            this.exchanges = [...storage.sExchanges]
        },
        updatePagination(bookings: number, stocks: number): void {
            this.bookingsPerPage = bookings
            this.stocksPerPage = stocks
        },
        updateMarketData(data: Partial<{
            materials: string[]
            markets: string[]
            indexes: string[]
            exchanges: string[]
        }>): void {
            if (data.materials) this.materials = [...data.materials]
            if (data.markets) this.markets = [...data.markets]
            if (data.indexes) this.indexes = [...data.indexes]
            if (data.exchanges) this.exchanges = [...data.exchanges]
        },
        validateSettings(): boolean {
            return (
                this.bookingsPerPage > 0 &&
                this.stocksPerPage > 0 &&
                this.skin.length > 0 &&
                this.service.length > 0 &&
                Array.isArray(this.materials) &&
                Array.isArray(this.markets) &&
                Array.isArray(this.indexes) &&
                Array.isArray(this.exchanges)
            )
        }
    }
})

log('--- STORE settings.js ---')
