/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {ref} from 'vue'
import type {ThemeInstance} from 'vuetify'
import {useApp} from '@/composables/useApp'

const {CONS} = useApp()
const skin: Ref<string> = ref(CONS.DEFAULTS.BROWSER_STORAGE.SKIN)
const bookingsPerPage: Ref<number> = ref(CONS.DEFAULTS.BROWSER_STORAGE.BOOKINGS_PER_PAGE)
const stocksPerPage: Ref<number> = ref(CONS.DEFAULTS.BROWSER_STORAGE.STOCKS_PER_PAGE)
const activeAccountId: Ref<number> = ref(0)
const partner: Ref<boolean> = ref(false)
const service: Ref<string> = ref(CONS.DEFAULTS.BROWSER_STORAGE.SERVICE)
const materials: Ref<string[]> = ref(CONS.DEFAULTS.BROWSER_STORAGE.MATERIALS)
const markets: Ref<string[]> = ref(CONS.DEFAULTS.BROWSER_STORAGE.MARKETS)
const indexes: Ref<string[]> = ref(CONS.DEFAULTS.BROWSER_STORAGE.INDEXES)
const exchanges: Ref<string[]> = ref(CONS.DEFAULTS.BROWSER_STORAGE.EXCHANGES)

export const useSettings = () => {

    function setSkin(theme: ThemeInstance, value: string) {
        if (theme?.global?.name) {
            theme.global.name.value = value
        }
        skin.value = value
    }

    function init(storage: { [p: string]: string | number | boolean | string[] }): void {
        //setSkin(theme, storage.sSkin as string)
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
        setSkin,
        init
    }
}
