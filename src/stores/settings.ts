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

    function setSkin(theme: ThemeInstance, value: string) {
        if (theme?.global?.name) {
            theme.global.name.value = value
        }
        skin.value = value
    }

    function initStore(theme: ThemeInstance, storage: { [p: string]: string | number | boolean | string[] }): void {
        log('SETTINGS: initStore', {info: storage})
        setSkin(theme, storage.sSkin as string)
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
        initStore
    }
})

log('--- STORE settings.js ---')
