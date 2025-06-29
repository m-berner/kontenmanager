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
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'
import {onBeforeMount} from 'vue'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const theme = useTheme()
const {CONS, log} = useAppApi()
const onStorageChange = (changes: Record<string, browser.storage.StorageChange>): void => {
  const changesKey = Object.keys(changes)
  switch(changesKey[0]) {
    case 'sSkin':
      settings.setSkin(theme, changes[changesKey[0]].newValue)
      break
    case 'sService':
      settings.setService(changes[changesKey[0]].newValue)
      break
    case 'sIndexes':
      settings.setService(changes[changesKey[0]].newValue)
      break
    case 'sMarkets':
      settings.setService(changes[changesKey[0]].newValue)
      break
    case 'sMaterials':
      settings.setService(changes[changesKey[0]].newValue)
      break
    case 'sExchanges':
      settings.setService(changes[changesKey[0]].newValue)
      break
    default:
  }
}

browser.storage.local.onChanged.addListener(onStorageChange)

onBeforeMount(async (): Promise<void> => {
  const initSettingsResponse = await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.APP__INIT_SETTINGS}))
  settings.initStore(theme, JSON.parse(initSettingsResponse).data)
  const toStoreResponse = await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__TO_STORE}))
  const toStoreData: IStores = JSON.parse(toStoreResponse).data
  if (toStoreData.accounts.length > 0) {
    records.initStore(toStoreData)
    if (settings.activeAccountId === undefined) {
      settings.setActiveAccountId(records.accounts[0].cID)
    }
    runtime.setLogo()
    records.sumBookings()
  }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app v-bind:flat="true">
    <router-view name="title"></router-view>
    <router-view name="header"></router-view>
    <v-main>
      <router-view></router-view>
    </v-main>
    <router-view name="footer"></router-view>
  </v-app>
</template>
