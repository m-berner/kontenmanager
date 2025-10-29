/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {ref} from 'vue'
import type {ThemeInstance} from 'vuetify'
import {useApp} from '@/composables/useApp'

const {CONS} = useApp()
const skin = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SKIN)
const bookingsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE)
const stocksPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE)
const dividendsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.DIVIDENDS_PER_PAGE)
const sumsPerPage = ref<number>(CONS.DEFAULTS.BROWSER_STORAGE.SUMS_PER_PAGE)
const activeAccountId = ref<number>(-1)
const partner = ref<boolean>(false)
const service = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE)
const materials = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS)
const markets = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS)
const indexes = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES)
const exchanges = ref<string[]>(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES)

export function useSettings() {

    function setSkin(theme: ThemeInstance, value: string) {
        if (theme?.global?.name) {
            theme.global.name.value = value
        }
        skin.value = value
    }

    function init(theme: ThemeInstance, storage: { [p: string]: string | number | boolean | string[] }): void {
        theme.global.name.value = storage.sSkin as string
        skin.value = storage.sSkin as string
        bookingsPerPage.value = storage.sBookingsPerPage as number
        stocksPerPage.value = storage.sStocksPerPage as number
        dividendsPerPage.value = storage.sDividendsPerPage as number
        sumsPerPage.value = storage.sSumsPerPage as number
        activeAccountId.value = storage.sActiveAccountId as number
        partner.value = storage.sPartner as boolean
        service.value = storage.sService as string
        materials.value = [...storage.sMaterials as string[]]
        markets.value = [...storage.sMarkets as string[]]
        indexes.value = [...storage.sIndexes as string[]]
        exchanges.value = [...storage.sExchanges as string[]]
    }

    return {
        skin,
        bookingsPerPage,
        stocksPerPage,
        dividendsPerPage,
        sumsPerPage,
        activeAccountId,
        partner,
        service,
        materials,
        markets,
        indexes,
        exchanges,
        setSkin,
        init
    }
}
