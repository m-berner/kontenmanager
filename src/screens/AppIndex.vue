<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Exchange_Data} from '@/types'
import {onBeforeMount} from 'vue'
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

const {CONS, log} = useApp()
const {t} = useI18n()
const {notice} = useBrowser()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {curUsd, curEur} = storeToRefs(runtime)
const {exchanges} = storeToRefs(settings)
const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch()
const {getDatabaseStores} = useIndexedDB()
const {getStorage, installStorageLocal, uiLanguage} = useBrowser()

onBeforeMount(async () => {
    log('APP_INDEX: onBeforeMount')
    const T = Object.freeze(
        {
            STRINGS: {},
            MESSAGES: {
                INFO_TITLE: t('messages.infoTitle'),
                RESTRICTED_IMPORT: t('messages.restrictedImport'),
                CORRUPT_STORAGE: t('messages.corruptStorage'),
                ERROR_ON_BEFORE_MOUNT: t('messages.onBeforeMount')
            }
        }
    )
    try {
        const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value)
        const CUR_EUR = `${cur}${CONS.CURRENCIES.EUR}`
        const CUR_USD = `${cur}${CONS.CURRENCIES.USD}`

        await installStorageLocal()
        const storage = await getStorage()
        settings.init(storage)
        const storesDB = await getDatabaseStores(settings.activeAccountId)
        await records.init(storesDB, T.MESSAGES)
        const exchangesBaseData: I_Exchange_Data[] = await fetchExchangesData([CUR_USD, CUR_EUR])
        for (let i = 0; i < exchangesBaseData.length; i++) {
            if (exchangesBaseData[i].key.includes(CONS.CURRENCIES.USD)) {
                curUsd.value = exchangesBaseData[i].value
            } else {
                curEur.value = exchangesBaseData[i].value
            }
        }
        const exchangesInfoData: I_Exchange_Data[] = await fetchExchangesData(exchanges.value)
        for (let i = 0; i < exchanges.value.length; i++) {
            runtime.infoExchanges.set(exchanges.value[i], exchangesInfoData[i].value)
        }
        const indexesInfoData: I_Exchange_Data[] = await fetchIndexData()
        for (let i = 0; i < indexesInfoData.length; i++) {
            runtime.infoIndexes.set(indexesInfoData[i].key, indexesInfoData[i].value)
        }
        const materialsInfoData: I_Exchange_Data[] = await fetchMaterialData()
        for (let i = 0; i < materialsInfoData.length; i++) {
            runtime.infoMaterials.set(materialsInfoData[i].key, materialsInfoData[i].value)
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        log(T.MESSAGES.ERROR_ON_BEFORE_MOUNT, {error: errorMessage})
        await notice([T.MESSAGES.ERROR_ON_BEFORE_MOUNT, errorMessage])
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
