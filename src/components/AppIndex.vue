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
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'

const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const theme = useTheme()
const {CONS, log} = useApp()
const {getStorage, onStorageChanged} = useBrowser()
const {fetchExchangesData} = useFetch()

const changeHandler = (changes: { [key: string]: browser.storage.StorageChange }): void => {
  const changesKey = Object.keys(changes)
  switch (changesKey[0]) {
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN:
      settings.setSkin(theme, changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE:
      settings.service = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES:
      settings.indexes = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS:
      settings.markets = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS:
      settings.materials = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS].newValue)
      break
    case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES:
      settings.exchanges = (changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES].newValue)
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
  await records.initStore()
  const exchangesBaseData: IExchangeData[] = await fetchExchangesData([curUsd, curEur])
  for (let i = 0; i < exchangesBaseData.length; i++) {
    if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
      runtime.curUsd = (exchangesBaseData[i].value)
    } else {
      runtime.curEur = (exchangesBaseData[i].value)
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
