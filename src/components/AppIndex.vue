<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IExchangeData} from '@/types'
import {onBeforeMount} from 'vue'
import {useTheme} from 'vuetify'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'
import {useRecordsStore} from '@/stores/records'
import {useIndexedDB} from '@/composables/useIndexedDB'

const settings = useSettings()
const records = useRecordsStore()
const runtime = useRuntime()
const theme = useTheme()
const {CONS, haveSameStrings, log} = useApp()
const {getStorage, notice, onStorageChanged, uiLanguage} = useBrowser()
const {fetchExchangesData} = useFetch()
const {getDatabaseStores} = useIndexedDB()

const changeHandler = (changes: { [key: string]: browser.storage.StorageChange }): void => {
  const changesKey = Object.keys(changes)
  switch (changesKey[0]) {
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN:
      settings.setSkin(theme, changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE:
      settings.service.value = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES:
      settings.indexes.value = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS:
      settings.markets.value = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS:
      settings.materials.value = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES:
      settings.exchanges.value = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES].newValue)
      break
    default:
  }
}
onStorageChanged(changeHandler)

onBeforeMount(async () => {
  try {
    const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value)
    const curEur = `${cur}${CONS.CURRENCIES.EUR}`
    const curUsd = `${cur}${CONS.CURRENCIES.USD}`

    const settings = useSettings()
    const storage = await getStorage()
    if (haveSameStrings(Object.keys(storage), Object.values(CONS.DEFAULTS.BROWSER_STORAGE.PROPS))) {
      settings.init(storage)
    } else {
      await notice(['Your local storage is corrupt.', 'Reset to default by STRG+ALT+r'])
    }
    const storesDB = await getDatabaseStores()
    await records.init(storesDB)
    const exchangesBaseData: IExchangeData[] = await fetchExchangesData([curUsd, curEur])
    for (let i = 0; i < exchangesBaseData.length; i++) {
      if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
        runtime.curUsd.value = (exchangesBaseData[i].value)
      } else {
        runtime.curEur.value = (exchangesBaseData[i].value)
      }
    }
  } catch (e) {
    log('APP_INDEX: onBeforeMount', {error: e})
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
