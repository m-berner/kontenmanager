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
import {useTheme} from 'vuetify'
import {RouterView} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useFetch} from '@/composables/useFetch'
import {useIndexedDB} from '@/composables/useIndexedDB'
import AlertOverlay from '@/components/AlertOverlay.vue'

const {log} = useApp()

onBeforeMount(async () => {
  log('APP_INDEX: onBeforeMount')
  const {CONS, haveSameStrings} = useApp()
  const {notice} = useBrowser()
  const {t} = useI18n()

  const T = Object.freeze({
    STRINGS: {},
    MESSAGES: {
      INFO_TITLE: t('messages.infoTitle'),
      RESTRICTED_IMPORT: t('messages.restrictedImport'),
      CORRUPT_STORAGE: t('messages.corruptStorage'),
      ERROR_ON_BEFORE_MOUNT: t('messages.onBeforeMount')
    }
  })

  try {
    const theme = useTheme()
    const records = useRecordsStore()
    const settings = useSettingsStore()
    const runtime = useRuntimeStore()
    const {curUsd, curEur} = storeToRefs(runtime)
    const {exchanges} = storeToRefs(settings)
    const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch()
    const {closeDB, getDatabaseStores} = useIndexedDB()
    const {clearStorage, getStorage, installStorageLocal, addStorageChangedListener, uiLanguage} = useBrowser()
    const storage = await getStorage()
    const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value)
    const CUREUR = `${cur}${CONS.CURRENCIES.EUR}`
    const CURUSD = `${cur}${CONS.CURRENCIES.USD}`
    if (haveSameStrings(Object.keys(storage), Object.values(CONS.DEFAULTS.BROWSER_STORAGE.PROPS))) {
      settings.init(theme, storage)
    } else {
      await notice(['corrupt Storage!'])
    }
    const storesDB = await getDatabaseStores(settings.activeAccountId)
    await records.init(storesDB, T.MESSAGES)
    const exchangesBaseData: IExchangeData[] = await fetchExchangesData([CURUSD, CUREUR])
    for (let i = 0; i < exchangesBaseData.length; i++) {
      if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
        curUsd.value = exchangesBaseData[i].value
      } else {
        curEur.value = exchangesBaseData[i].value
      }
    }
    const exchangesInfoData: IExchangeData[] = await fetchExchangesData(exchanges.value)
    for (let i = 0; i < exchanges.value.length; i++) {
      runtime.infoExchanges.set(exchanges.value[i], exchangesInfoData[i].value)
    }
    const indexesInfoData: IExchangeData[] = await fetchIndexData()
    for (let i = 0; i < indexesInfoData.length; i++) {
      runtime.infoIndexes.set(indexesInfoData[i].key, indexesInfoData[i].value)
    }
    const materialsInfoData: IExchangeData[] = await fetchMaterialData()
    for (let i = 0; i < materialsInfoData.length; i++) {
      runtime.infoMaterials.set(materialsInfoData[i].key, materialsInfoData[i].value)
    }
    const changeHandler = (changes: Record<string, browser.storage.StorageChange>): void => {
      log('APP_INDEX: changeHandler')
      const changesKey = Object.keys(changes)
      const {service, skin, indexes, markets, materials, exchanges} = storeToRefs(settings)
      switch (changesKey[0]) {
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN:
          if (theme?.global?.name) {
            theme.global.name.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue
          }
          skin.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN].newValue
          break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE:
          service.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SERVICE].newValue
          break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES:
          indexes.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.INDEXES].newValue
          break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS:
          markets.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MARKETS].newValue
          break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS:
          materials.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.MATERIALS].newValue
          break
        case CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES:
          exchanges.value = changes[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.EXCHANGES].newValue
          break
        default:
      }
    }
    const removeStorageChangedListener = await addStorageChangedListener(changeHandler)
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
    const onBeforeUnload = (): void => {
      log('APP_INDEX: onBeforeUnload')
      removeStorageChangedListener()
      closeDB()
    }
    window.addEventListener('keydown', onKeyDown, false)
    window.addEventListener('keyup', onKeyUp, false)
    window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)
  } catch (e) {
    if (e instanceof Error) {
      log(T.MESSAGES.ERROR_ON_BEFORE_MOUNT, {error: e.message})
      await notice([T.MESSAGES.ERROR_ON_BEFORE_MOUNT, e.message])
    } else {
      throw new Error(`${T.MESSAGES.ERROR_ON_BEFORE_MOUNT}: unknown`)
    }
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
