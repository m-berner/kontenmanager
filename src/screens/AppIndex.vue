<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IExchangeData} from '@/types'
import {onBeforeMount} from 'vue'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'
import {useRecordsStore} from '@/stores/records'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useTheme} from 'vuetify'
import {RouterView} from 'vue-router'
import AlertOverlay from '@/components/AlertOverlay.vue'
import {useI18n} from 'vue-i18n'

const {CONS, log} = useApp()
const {t} = useI18n()
const records = useRecordsStore()

const MESSAGES = Object.freeze({
  INFO_TITLE: t('appPage.messages.infoTitle'),
  RESTRICTED_IMPORT: t('appPage.messages.restrictedImport'),
  CORRUPT_STORAGE: t('appPage.messages.corruptStorage')
})

// TODO erfolgsmeldung update buchung, ID mit text ersetzen
onBeforeMount(async () => {
  try {
    const theme = useTheme()
    const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch()
    const {getDB, getDatabaseStores} = useIndexedDB()
    const {clearStorage, installStorageLocal, addStorageChangedListener, uiLanguage} = useBrowser()
    const db = await getDB()
    const runtime = useRuntime()
    const settings = useSettings()
    const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value)
    const curEur = `${cur}${CONS.CURRENCIES.EUR}`
    const curUsd = `${cur}${CONS.CURRENCIES.USD}`
    const storesDB = await getDatabaseStores()
    await records.init(storesDB, MESSAGES)
    const exchangesBaseData: IExchangeData[] = await fetchExchangesData([curUsd, curEur])
    for (let i = 0; i < exchangesBaseData.length; i++) {
      if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
        runtime.curUsd.value = exchangesBaseData[i].value
      } else {
        runtime.curEur.value = exchangesBaseData[i].value
      }
    }
    const exchangesInfoData: IExchangeData[] = await fetchExchangesData(settings.exchanges.value)
    for (let i = 0; i < settings.exchanges.value.length; i++) {
      runtime.infoExchanges.value.set(settings.exchanges.value[i], exchangesInfoData[i].value)
    }
    const indexesInfoData: IExchangeData[] = await fetchIndexData()
    for (let i = 0; i < indexesInfoData.length; i++) {
      runtime.infoIndexes.value.set(indexesInfoData[i].key, indexesInfoData[i].value)
    }
    const materialsInfoData: IExchangeData[] = await fetchMaterialData()
    for (let i = 0; i < materialsInfoData.length; i++) {
      runtime.infoMaterials.value.set(materialsInfoData[i].key, materialsInfoData[i].value)
    }
    const keyStrokeController: string[] = []
    const onKeyDown = async (ev: KeyboardEvent): Promise<void> => {
      if (!keyStrokeController.includes(ev.key)) {
        keyStrokeController.push(ev.key)
      }
      if (keyStrokeController.includes('Control') && keyStrokeController.includes('Alt') && ev.key === 'r') {
        await clearStorage()
        await installStorageLocal()
      }
      if (keyStrokeController.includes('Control') && keyStrokeController.includes('Alt') && ev.key === 'd') {
        const debugValue = localStorage.getItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG)
        if (debugValue !== '1') {
          localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '1')
        } else {
          localStorage.setItem(CONS.DEFAULTS.LOCAL_STORAGE.PROPS.DEBUG, '0')
        }
      }
    }
    const onKeyUp = (ev: KeyboardEvent): void => {
      const index = keyStrokeController.indexOf(ev.key)
      if (index > -1) {
        keyStrokeController.splice(index, 1)
      }
    }
    const changeHandler = (changes: { [key: string]: browser.storage.StorageChange }): void => {
      log('APP_INDEX: changeHandler')
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
    const removeStorageChangedListener = await addStorageChangedListener(changeHandler)
    const onBeforeUnload = (): void => {
      log('APP_INDEX: onBeforeUnload')
      removeStorageChangedListener()
      db.close()
    }
    window.addEventListener('keydown', onKeyDown, false)
    window.addEventListener('keyup', onKeyUp, false)
    window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)
  } catch (e) {
    log('APP_INDEX: onBeforeMount', {error: e})
  }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app :flat="true">
    <RouterView name="title"/>
    <RouterView name="header"/>
    <RouterView name="info"/>
    <v-main>
      <RouterView/>
    </v-main>
    <RouterView name="footer"/>
    <AlertOverlay/>
  </v-app>
</template>
