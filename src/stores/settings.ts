/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {T_Storage} from '@/types'
import {ref} from 'vue'
import {useApp} from '@/composables/useApp'
import {defineStore} from 'pinia'
import {useBrowser} from '@/composables/useBrowser'
import {useAppConfig} from '@/composables/useAppConfig'

const {log} = useApp()
const {BROWSER_STORAGE} = useAppConfig()
const {setStorage} = useBrowser()

export const useSettingsStore = defineStore('settings', function () {
    const skin = ref<string>(BROWSER_STORAGE.SKIN)
    const bookingsPerPage = ref<number>(BROWSER_STORAGE.BOOKINGS_PER_PAGE)
    const stocksPerPage = ref<number>(BROWSER_STORAGE.STOCKS_PER_PAGE)
    const dividendsPerPage = ref<number>(BROWSER_STORAGE.DIVIDENDS_PER_PAGE)
    const sumsPerPage = ref<number>(BROWSER_STORAGE.SUMS_PER_PAGE)
    const activeAccountId = ref<number>(-1)
    const service = ref<string>(BROWSER_STORAGE.SERVICE)
    const materials = ref<string[]>(BROWSER_STORAGE.MATERIALS)
    const markets = ref<string[]>(BROWSER_STORAGE.MARKETS)
    const indexes = ref<string[]>(BROWSER_STORAGE.INDEXES)
    const exchanges = ref<string[]>(BROWSER_STORAGE.EXCHANGES)

    function init(storage: T_Storage): void {
        log('SETTINGS: init')
        skin.value = storage[BROWSER_STORAGE.PROPS.SKIN] as string
        bookingsPerPage.value = storage[BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE] as number
        stocksPerPage.value = storage[BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE] as number
        dividendsPerPage.value = storage[BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE] as number
        sumsPerPage.value = storage[BROWSER_STORAGE.PROPS.SUMS_PER_PAGE] as number
        activeAccountId.value = storage[BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID] as number
        service.value = storage[BROWSER_STORAGE.PROPS.SERVICE] as string
        materials.value = [...storage[BROWSER_STORAGE.PROPS.MATERIALS] as string[]]
        markets.value = [...storage[BROWSER_STORAGE.PROPS.MARKETS] as string[]]
        indexes.value = [...storage[BROWSER_STORAGE.PROPS.INDEXES] as string[]]
        exchanges.value = [...storage[BROWSER_STORAGE.PROPS.EXCHANGES] as string[]]
    }

    async function setSumsPerPage(v: number) {
        sumsPerPage.value = v
        await setStorage(BROWSER_STORAGE.PROPS.SUMS_PER_PAGE, v)
    }

    async function setBookingsPerPage(v: number) {
        bookingsPerPage.value = v
        await setStorage(BROWSER_STORAGE.PROPS.BOOKINGS_PER_PAGE, v)
    }

    async function setStocksPerPage(v: number) {
        stocksPerPage.value = v
        await setStorage(BROWSER_STORAGE.PROPS.STOCKS_PER_PAGE, v)
    }

    async function setDividendsPerPage(v: number) {
        dividendsPerPage.value = v
        await setStorage(BROWSER_STORAGE.PROPS.DIVIDENDS_PER_PAGE, v)
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
