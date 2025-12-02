/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {TStorage} from '@/types'
import {ref} from 'vue'
import type {ThemeInstance} from 'vuetify'
import {useApp} from '@/composables/useApp'
import {defineStore} from 'pinia'
import {useBrowser} from '@/composables/useBrowser'

const {CONS, log} = useApp()
const {setStorage} = useBrowser()

export const useSettingsStore = defineStore('settings', function () {
    const skin = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SKIN)
    const bookingsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE)
    const stocksPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE)
    const dividendsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE)
    const sumsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.SUMS_PER_PAGE)
    const activeAccountId = ref<number>(-1)
    const service = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE)
    const materials = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS)
    const markets = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS)
    const indexes = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES)
    const exchanges = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES)

    function init(theme: ThemeInstance, storage: TStorage): void {
        theme.global.name.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN] as string
        skin.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN] as string
        bookingsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE] as number
        stocksPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE] as number
        dividendsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE]as number
        sumsPerPage.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUMS_PER_PAGE] as number
        activeAccountId.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID] as number
        service.value = storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE] as string
        materials.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS] as string[]]
        markets.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS] as string[]]
        indexes.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES] as string[]]
        exchanges.value = [...storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES] as string[]]
    }

    async function setSumsPerPage(v: number) {
        sumsPerPage.value = v
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SUMS_PER_PAGE, v)
    }

    async function setBookingsPerPage(v: number) {
        bookingsPerPage.value = v
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE, v)
    }

    async function setStocksPerPage(v: number) {
        stocksPerPage.value = v
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE, v)
    }

    async function setDividendsPerPage(v: number) {
        dividendsPerPage.value = v
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE, v)
    }

    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        dividendsPerPage,
        sumsPerPage,
        activeAccountId,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        init,
        setSumsPerPage,
        setBookingsPerPage,
        setDividendsPerPage,
        setStocksPerPage
    }
})

log('--- STORES settings.ts ---')
