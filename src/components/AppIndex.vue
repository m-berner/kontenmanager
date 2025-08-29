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
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useRuntimeStore} from '@/stores/runtime'
import {onBeforeMount} from 'vue'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {exportStores} = useIndexedDB()
const theme = useTheme()
const {CONS, log, getUI} = useApp()
const {getStorage, onStorageChanged} = useBrowser()
const {fetchExchangesData} = useFetch()

const onStorageChange = (changes: browser.storage.StorageChange): void => {
  const changesKey = Object.keys(changes)
  switch (changesKey[0]) {
    case CONS.STORAGE.PROPS.SKIN:
      settings.setSkin(theme, changes.newValue)
      break
    case CONS.STORAGE.PROPS.SERVICE:
      settings.setService(changes.newValue)
      break
    case CONS.STORAGE.PROPS.INDEXES:
      settings.setIndexes(changes.newValue)
      break
    case CONS.STORAGE.PROPS.MARKETS:
      settings.setMarkets(changes.newValue)
      break
    case CONS.STORAGE.PROPS.MATERIALS:
      settings.setMaterials(changes.newValue)
      break
    case CONS.STORAGE.PROPS.EXCHANGES:
      settings.setExchanges(changes.newValue)
      break
    default:
  }
}
onStorageChanged(onStorageChange)

onBeforeMount(async () => {
  const storage = await getStorage()
  settings.initStore(theme, storage)
  const stores = await exportStores(settings.activeAccountId)
  if (stores.accounts.length > 0) {
    records.initStore(stores)
    records.sumBookings()
  }
  const exchangesBaseData: FetchedResources.IExchangesData[] = await fetchExchangesData([getUI().curUsd, getUI().curEur])

  for (let i = 0; i < exchangesBaseData.length; i++) {
    if (exchangesBaseData[i].key.includes('USD')) {
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
