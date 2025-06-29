/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore, type StoreDefinition} from 'pinia'
import {type ThemeInstance} from 'vuetify'
import {useAppApi} from '@/pages/background'

interface ISettingsStore {
  skin: string
  bookingsPerPage: string | number
  stocksPerPage: number
  activeAccountId: number
  partner: boolean
  service: string
  materials: string[]
  markets: string[]
  indexes: string[]
  exchanges: string[]
}

interface ISettingsGetter {
  //
}

interface ISettingsActions {
  setActiveAccountId: (accountId: number) => void
  setBookingsPerPage: (bookingsPerPage: number) => void
  setPartner: (partner: boolean) => void
  setSkin: (theme: ThemeInstance, skin: string) => void
  setStocksPerPage: (stocksPerPage: number) => void
  setService: (service: string) => void
  setMaterials: (materials: string[]) => void
  setMarkets: (markets: string[]) => void
  setExchanges: (exchanges: string[]) => void
  setIndexes: (indexes: string[]) => void
  initStore: (theme: ThemeInstance, storage: IStorageLocal) => void
}

const {CONS, log} = useAppApi()

export const useSettingsStore: StoreDefinition<'settings', ISettingsStore, ISettingsGetter, ISettingsActions> = defineStore('settings', {
  state: (): ISettingsStore => {
    return {
      skin: CONS.DEFAULTS.STORAGE.SKIN,
      bookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE,
      stocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE,
      activeAccountId: -1,
      partner: false,
      service: CONS.DEFAULTS.STORAGE.SERVICE,
      materials: CONS.DEFAULTS.STORAGE.MATERIALS,
      markets: CONS.DEFAULTS.STORAGE.MARKETS,
      indexes: CONS.DEFAULTS.STORAGE.INDEXES,
      exchanges: CONS.DEFAULTS.STORAGE.EXCHANGES
    }
  },
  getters: {
    // activeAccountId(state: ISettingsStore) {
    //  return state._active_account_id
    // },
    // bookingsPerPage(state: ISettingsStore) {
    //   return state._bookings_per_page
    // },
    // stocksPerPage(state: ISettingsStore) {
    //   return state._stocks_per_page
    // },
    // skin(state: ISettingsStore) {
    //   return state._skin
    // },
    // partner(state: ISettingsStore) {
    //   return state._partner
    // },
    // service(state: ISettingsStore) {
    //   return state._service
    // },
    // materials(state: ISettingsStore) {
    //   return state._materials
    // },
    // markets(state: ISettingsStore) {
    //   return state._markets
    // },
    // indexes(state: ISettingsStore) {
    //   return state._indexes
    // },
    // exchanges(state: ISettingsStore) {
    //   return state._exchanges
    // }
  },
  actions: {
    setActiveAccountId(value) {
      this.activeAccountId = value
    },
    setBookingsPerPage(value) {
      this.bookingsPerPage = value
    },
    setStocksPerPage(value) {
      this.stocksPerPage = value
    },
    setSkin(theme, value) {
      theme.global.name.value = value
      this.skin = value
    },
    setPartner(value) {
      this.partner = value
    },
    setService(value) {
      this.service = value
    },
    setMaterials(value) {
      this.materials = value
    },
    setMarkets(value) {
      this.markets = value
    },
    setIndexes(value) {
      this.indexes = value
    },
    setExchanges(value) {
      this.exchanges = value
    },
    initStore(theme, storage) {
      log('SETTINGS: initStore')
      theme.global.name.value = storage.sSkin
      this.skin = storage.sSkin
      this.bookingsPerPage = storage.sBookingsPerPage
      this.stocksPerPage = storage.sStocksPerPage
      this.activeAccountId = storage.sActiveAccountId
      this.partner = storage.sPartner
      this.service = storage.sService
      this.materials = storage.sMaterials
      this.markets = storage.sMarkets
      this.indexes = storage.sIndexes
      this.exchanges = storage.sExchanges
    }
  }
})

log('--- STORE settings.js ---')
