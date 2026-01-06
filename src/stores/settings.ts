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
    const skin = ref<string>(BROWSER_STORAGE.LOCAL.SKIN.value)
    const bookingsPerPage = ref<number>(BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.value)
    const stocksPerPage = ref<number>(BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.value)
    const dividendsPerPage = ref<number>(BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.value)
    const sumsPerPage = ref<number>(BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.value)
    const activeAccountId = ref<number>(-1)
    const service = ref<string>(BROWSER_STORAGE.LOCAL.SERVICE.value)
    const materials = ref<string[]>(BROWSER_STORAGE.LOCAL.MATERIALS.value)
    const markets = ref<string[]>(BROWSER_STORAGE.LOCAL.MARKETS.value)
    const indexes = ref<string[]>(BROWSER_STORAGE.LOCAL.INDEXES.value)
    const exchanges = ref<string[]>(BROWSER_STORAGE.LOCAL.EXCHANGES.value)

    function init(storage: T_Storage): void {
        log('SETTINGS: init')
        skin.value = storage[BROWSER_STORAGE.LOCAL.SKIN.key] as string
        bookingsPerPage.value = storage[BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.key] as number
        stocksPerPage.value = storage[BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.key] as number
        dividendsPerPage.value = storage[BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.key] as number
        sumsPerPage.value = storage[BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.key] as number
        activeAccountId.value = storage[BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key] as number
        service.value = storage[BROWSER_STORAGE.LOCAL.SERVICE.key] as string
        materials.value = [...storage[BROWSER_STORAGE.LOCAL.MATERIALS.key] as string[]]
        markets.value = [...storage[BROWSER_STORAGE.LOCAL.MARKETS.key] as string[]]
        indexes.value = [...storage[BROWSER_STORAGE.LOCAL.INDEXES.key] as string[]]
        exchanges.value = [...storage[BROWSER_STORAGE.LOCAL.EXCHANGES.key] as string[]]
    }

    async function setSumsPerPage(v: number) {
        sumsPerPage.value = v
        await setStorage(BROWSER_STORAGE.LOCAL.SUMS_PER_PAGE.key, v)
    }

    async function setBookingsPerPage(v: number) {
        bookingsPerPage.value = v
        await setStorage(BROWSER_STORAGE.LOCAL.BOOKINGS_PER_PAGE.key, v)
    }

    async function setStocksPerPage(v: number) {
        stocksPerPage.value = v
        await setStorage(BROWSER_STORAGE.LOCAL.STOCKS_PER_PAGE.key, v)
    }

    async function setDividendsPerPage(v: number) {
        dividendsPerPage.value = v
        await setStorage(BROWSER_STORAGE.LOCAL.DIVIDENDS_PER_PAGE.key, v)
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
