<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import connectionIcon from '@/assets/connection48.png'
import defaultIcon from '@/assets/icon48.png'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useBrowser} from '@/composables/useBrowser'
import {useStorage} from '@/composables/useStorage'
import {UtilsService} from '@/domains/utils'
import {fetchService} from '@/services/fetch'
import {INDEXED_DB} from '@/config/database'
import {databaseService} from '@/services/database'
import {BROWSER_STORAGE} from '@/config/storage'
import {COMPONENTS} from '@/config/components'
import {CODES} from '@/config/codes'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {isDownloading} = storeToRefs(runtime)
const {notice} = useBrowser()
const {setStorage} = useStorage()
const {activeAccountId} = storeToRefs(settings)

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
/** Mapped depot value formatted as the currency string. */
const depot = computed((): string => {
    return n(records.stocks.sumDepot(), 'currency')
})

/**
 * Event handler for account selection changes.
 * Loads records for the newly selected account and navigates to the home.
 */
const onUpdateTitleBar = async (): Promise<void> => {
    UtilsService.log('TITLE_BAR onUpdateTitleBar')

    try {
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeAccountId.value)
        const storesDB = await databaseService.getAccountRecords(activeAccountId.value)
        await records.init(storesDB, {title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        UtilsService.log(t('views.titleBar.messages.onUpdateTitleBar'), errorMessage, 'error')
        await notice([t('views.titleBar.messages.onUpdateTitleBar'), errorMessage])
    }
}

/**
 * Component initialization.
 * Performs a connectivity check to external services.
 */
onMounted(async () => {
    try {
        const online = await fetchService.fetchIsOk()
        connectionState.value = online ? 'online' : 'offline'
    } catch {
        connectionState.value = 'offline'
    }
})

UtilsService.log('--- views/TitleBar.vue setup ---')
</script>

<template>
    <v-app-bar app color="secondary" flat>
        <template #prepend>
            <img :alt="t('views.titleBar.iconsAlt.logo')" :src="COMPONENTS.TITLE_BAR.LOGO"/>
        </template>
        <v-app-bar-title>{{ t('views.titleBar.title') }}</v-app-bar-title>
        <v-text-field
            v-if="(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY) && !isDownloading"
            :disabled="true"
            :label="t('views.titleBar.depotSumLabel')"
            :model-value="depot"
            hide-details
            max-width="150"/>
        <v-text-field
            v-if="!(runtime.getCurrentView === CODES.VIEW_CODES.COMPANY)"
            :disabled="true"
            :label="t('views.titleBar.bookingsSumLabel')"
            :model-value="balance"
            hide-details
            max-width="150"/>
        <v-spacer/>
        <v-select
            v-if="activeAccountId > 0"
            v-model="activeAccountId"
            :disabled="runtime.getCurrentView === CODES.VIEW_CODES.COMPANY"
            :item-title="INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN"
            :item-value="INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID"
            :items="records.accounts.items"
            :label="t('views.titleBar.selectAccountLabel')"
            density="compact"
            hide-details
            max-width="350"
            placeholder="WWW"
            variant="outlined"
            @update:model-value="onUpdateTitleBar">
            <template #prepend>
                <img :alt="t('views.titleBar.iconsAlt.logo')" :src="logoUrl"/>
            </template>
        </v-select>
    </v-app-bar>
</template>
