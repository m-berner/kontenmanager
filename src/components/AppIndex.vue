<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useTheme} from 'vuetify'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useRuntimeStore} from '@/stores/runtime'
import {onBeforeMount} from 'vue'
import type {FetchedResources} from '@/types'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {exportStores} = useIndexedDB()
const theme = useTheme()
const {CONS} = useConstant()
const {log} = useNotification()
const {getStorage, onStorageChanged} = useBrowser()
const {fetchExchangesData} = useFetch()

const changeHandler = (changes: { [key: string]: browser.storage.StorageChange }): void => {
  const changesKey = Object.keys(changes)
  switch (changesKey[0]) {
    case CONS.STORAGE.PROPS.SKIN:
      settings.setSkin(theme, changes[CONS.STORAGE.PROPS.SKIN].newValue)
      break
    case CONS.STORAGE.PROPS.SERVICE:
      settings.setService(changes[CONS.STORAGE.PROPS.SERVICE].newValue)
      break
    case CONS.STORAGE.PROPS.INDEXES:
      settings.setIndexes(changes[CONS.STORAGE.PROPS.INDEXES].newValue)
      break
    case CONS.STORAGE.PROPS.MARKETS:
      settings.setMarkets(changes[CONS.STORAGE.PROPS.MARKETS].newValue)
      break
    case CONS.STORAGE.PROPS.MATERIALS:
      settings.setMaterials(changes[CONS.STORAGE.PROPS.MATERIALS].newValue)
      break
    case CONS.STORAGE.PROPS.EXCHANGES:
      settings.setExchanges(changes[CONS.STORAGE.PROPS.EXCHANGES].newValue)
      break
    default:
  }
}
onStorageChanged(changeHandler)

onBeforeMount(async () => {
  const cur = CONS.CURRENCIES.CODE.get(browser.i18n.getUILanguage())
  const curEur = `${cur}${CONS.CURRENCIES.EUR}`
  const curUsd = `${cur}${CONS.CURRENCIES.USD}`
  const storage = await getStorage()
  settings.initStore(theme, storage)
  const stores = await exportStores(settings.activeAccountId)
  if (stores.accounts.length > 0) {
    records.initStore(stores)
    records.sumBookings()
  }
  const exchangesBaseData: FetchedResources.IExchangesData[] = await fetchExchangesData([curUsd, curEur])
  for (let i = 0; i < exchangesBaseData.length; i++) {
    if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
      runtime.setExchangesUsd(exchangesBaseData[i].value)
    } else {
      runtime.setExchangesEur(exchangesBaseData[i].value)
    }
  }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app :flat="true">
    <router-view name="title"/>
    <router-view name="header"/>
    <router-view name="info"/>
    <v-main>
      <router-view/>
    </v-main>
    <router-view name="footer"/>
  </v-app>
</template>
