<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRouter} from 'vue-router'
import connectionIcon from '@/assets/connection48.png'
import defaultIcon from '@/assets/icon48.png'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {useApp} from '@/composables/useApp'
import {useFetch} from '@/composables/useFetch'

const {n, t} = useI18n()
const router = useRouter()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {isCompanyPage, isDownloading} = storeToRefs(runtime)
const {notice, setStorage} = useBrowser()
const {fetchIsOk} = useFetch()
const {CONS, log} = useApp()
const {getDatabaseStores} = useIndexedDB()
const {activeAccountId} = storeToRefs(settings)

const T = Object.freeze(
    {
        MESSAGES: {
            INFO_TITLE: t('messages.infoTitle'),
            RESTRICTED_IMPORT: t('messages.restrictedImport'),
            ERROR_ONUPDATE_TITLE_BAR: t('messages.onUpdateTitleBar')
        },
        STRINGS: {
            TITLE: t('titleBar.title'),
            LOGO_ALT: t('titleBar.iconsAlt.logo'),
            DEPOT_SUM_LABEL: t('titleBar.depotSumLabel'),
            BOOKING_SUM_LABEL: t('titleBar.bookingsSumLabel'),
            SELECT_ACCOUNT_LABEL: t('titleBar.selectAccountLabel')
        }
    }
)

const connectionState = ref<'checking' | 'online' | 'offline'>('checking')

const logoUrl = computed((): string => {
    if (connectionState.value === 'checking') {
        return connectionIcon
    }

    if (connectionState.value === 'offline') {
        return connectionIcon
    }

    const account = records.accounts.items.find(a => a.cID === activeAccountId.value)
    return account?.cLogoUrl || defaultIcon
})
const balance = computed((): string => {
    return n(records.bookings.sumBookings(), 'currency')
})
const depot = computed((): string => {
    return n(records.stocks.sumDepot(), 'currency')
})

const onUpdateTitleBar = async (): Promise<void> => {
    log('TITLE_BAR onUpdateTitleBar')
    try {
        const storesDB = await getDatabaseStores(activeAccountId.value)
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeAccountId.value)
        await records.init(storesDB, T.MESSAGES)
        isCompanyPage.value = false
        router.push('/')
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        log(T.MESSAGES.ERROR_ONUPDATE_TITLE_BAR, {error: errorMessage})
        await notice([T.MESSAGES.ERROR_ONUPDATE_TITLE_BAR, errorMessage])
    }
}

onMounted(async () => {
    try {
        const online = await fetchIsOk()
        connectionState.value = online ? 'online' : 'offline'
    } catch {
        connectionState.value = 'offline'
    }
})

log('--- TitleBar.vue setup ---')
</script>

<template>
    <v-app-bar app color="secondary" flat>
        <template #prepend>
            <img :alt="T.STRINGS.LOGO_ALT" :src="CONS.COMPONENTS.TITLE_BAR.LOGO"/>
        </template>
        <v-app-bar-title>{{ T.STRINGS.TITLE }}</v-app-bar-title>
        <v-text-field
            v-if="isCompanyPage && !isDownloading"
            :disabled="true"
            :label="T.STRINGS.DEPOT_SUM_LABEL"
            :model-value="depot"
            hide-details
            max-width="150"/>
        <v-text-field
            v-if="!isCompanyPage"
            :disabled="true"
            :label="T.STRINGS.BOOKING_SUM_LABEL"
            :model-value="balance"
            hide-details
            max-width="150"/>
        <v-spacer/>
        <v-select
            v-if="activeAccountId > 0"
            v-model="activeAccountId"
            :item-title="CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.IBAN"
            :item-value="CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.ID"
            :items="records.accounts.items"
            :label="T.STRINGS.SELECT_ACCOUNT_LABEL"
            density="compact"
            hide-details
            max-width="350"
            placeholder="WWW"
            variant="outlined"
            @update:model-value="onUpdateTitleBar">
            <template #prepend>
                <img :alt="T.STRINGS.LOGO_ALT" :src="logoUrl"/>
            </template>
        </v-select>
    </v-app-bar>
</template>
