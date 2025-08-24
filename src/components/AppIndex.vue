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
import {useRuntimeStore} from '@/stores/runtime'
import {onBeforeMount} from 'vue'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const theme = useTheme()
const {CONS, log, getUI} = useApp()

const onStorageChange = (changes: { [p: string]: browser.storage.StorageChange }): void => {
  const changesKey = Object.keys(changes)
  switch (changesKey[0]) {
    case CONS.STORAGE.PROPS.SKIN:
      settings.setSkin(theme, changes[changesKey[0]].newValue)
      break
    case CONS.STORAGE.PROPS.SERVICE:
      settings.setService(changes[changesKey[0]].newValue)
      break
    case CONS.STORAGE.PROPS.INDEXES:
      settings.setIndexes(changes[changesKey[0]].newValue)
      break
    case CONS.STORAGE.PROPS.MARKETS:
      settings.setMarkets(changes[changesKey[0]].newValue)
      break
    case CONS.STORAGE.PROPS.MATERIALS:
      settings.setMaterials(changes[changesKey[0]].newValue)
      break
    case CONS.STORAGE.PROPS.EXCHANGES:
      settings.setExchanges(changes[changesKey[0]].newValue)
      break
    default:
  }
}
browser.storage.local.onChanged.addListener(onStorageChange)

onBeforeMount(async () => {
  // const storageResponseString = await browser.runtime.sendMessage(JSON.stringify({
  //   type: CONS.MESSAGES.STORAGE__GET_ALL
  // }))
  const storage = await browser.storage.local.get()
  //settings.initStore(theme, JSON.parse(storageResponseString).data)
  settings.initStore(theme, storage)
  const dbGetStoresResponseString = await browser.runtime.sendMessage(JSON.stringify({
    type: CONS.MESSAGES.DB__GET_STORES,
    data: settings.activeAccountId
  }))
  const dbGetStoresData = JSON.parse(dbGetStoresResponseString).data
  if (dbGetStoresData.accounts.length > 0) {
    records.initStore(dbGetStoresData)
    records.sumBookings()
  }
  const exchangesBaseResponseString = await browser.runtime.sendMessage(JSON.stringify({
    type: CONS.MESSAGES.FETCH__EXCHANGES_BASE_DATA,
    data: [getUI().curUsd, getUI().curEur],
  }))
  const exchangesBaseResponseData = JSON.parse(exchangesBaseResponseString).data
  for (let i = 0; i < exchangesBaseResponseData.length; i++) {
    if (exchangesBaseResponseData[i].key.includes('USD')) {
      runtime.setExchangesUsd(exchangesBaseResponseData[i].value)
    } else {
      runtime.setExchangesEur(exchangesBaseResponseData[i].value)
    }
  }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app :flat="true">
    <router-view name="title"></router-view>
    <router-view name="header"></router-view>
    <router-view name="info"></router-view>
    <v-main>
      <router-view></router-view>
    </v-main>
    <router-view name="footer"></router-view>
  </v-app>
</template>
