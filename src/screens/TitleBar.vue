<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {storeToRefs} from 'pinia'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {isCompanyPage, isDownloading} = storeToRefs(runtime)
const {setStorage} = useBrowser()
const {CONS, log} = useApp()
const {getDatabaseStores} = useIndexedDB()
const  {activeAccountId} = storeToRefs(settings)

const MESSAGES = Object.freeze({
  INFO_TITLE: t('homePage.messages.infoTitle'),
  RESTRICTED_IMPORT: t('homePage.messages.restrictedImport')
})

const logoUrl = computed((): string => {
  const ind = records.accounts.getIndexById(activeAccountId.value)
  const {items: accountItems} = storeToRefs(records.accounts)
  if (ind > -1) {
    return accountItems.value[ind].cLogoUrl
  } else {
    return ''
  }
})
const balance = computed((): string => {
  return n(records.bookings.sumBookings(), 'currency')
})
const depot = computed((): string => {
  return n(records.stocks.sumDepot(), 'currency')
})

const onUpdateTitleBar = async (): Promise<void> => {
  log('TITLE_BAR onUpdateTitleBar')
  const storesDB = await getDatabaseStores(activeAccountId.value)
  await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeAccountId.value)
  await records.init(storesDB, MESSAGES)
}

log('--- TitleBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <template #prepend>
      <img :alt="t('titleBar.iconsAlt.logo')" :src="CONS.COMPONENTS.TITLE_BAR.LOGO"/>
    </template>
    <v-app-bar-title>{{ t('titleBar.title') }}</v-app-bar-title>
    <v-text-field
        v-if="isCompanyPage && !isDownloading"
        :disabled="true"
        :label="t('titleBar.depotSumLabel')"
        :model-value="depot"
        hide-details
        max-width="150"/>
    <v-text-field
        v-if="!isCompanyPage"
        :disabled="true"
        :label="t('titleBar.bookingsSumLabel')"
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
        :label="t('titleBar.selectAccountLabel')"
        density="compact"
        hide-details
        max-width="350"
        placeholder="WWW"
        variant="outlined"
        @update:model-value="onUpdateTitleBar">
      <template #prepend>
        <img :alt="t('titleBar.iconsAlt.logo')" :src="logoUrl"/>
      </template>
    </v-select>
  </v-app-bar>
</template>
