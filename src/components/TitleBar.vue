<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const {CONS, log} = useApp()
const {setStorage} = useBrowser()

const onUpdateTitleBar = async (): Promise<void> => {
  log('TITLEBAR: onUpdateTitleBar')
  await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, settings.activeAccountId)
  await records.init()
}
const logoUrl = computed((): string => {
  const ind = records.accounts.getIndexById(settings.activeAccountId)
  if (ind > -1) {
    return records.accounts.items[ind].cLogoUrl
  } else {
    return ''
  }
})
const balance = computed((): string => {
  return n(records.bookings.sumBookings(), 'currency')
})

log('--- TitleBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <template #prepend>
      <img :alt="t('titleBar.iconsAlt.logo')" :src="CONS.COMPONENTS.TITLE_BAR.LOGO"/>
    </template>
    <v-app-bar-title>{{ t('titleBar.title') }}</v-app-bar-title>
    <v-text-field
        :disabled="true"
        :label="t('titleBar.bookingsSumLabel')"
        :model-value="balance"
        hide-details
        max-width="150"/>
    <v-spacer/>
    <v-select
        v-if="settings.activeAccountId > 0"
        v-model="settings.activeAccountId"
        :item-title="CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.IBAN"
        :item-value="CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.ID"
        :items="records.accounts.items"
        :label="t('titleBar.selectAccountLabel')"
        density="compact"
        hide-details
        max-width="350"
        variant="outlined"
        @update:model-value="onUpdateTitleBar">
      <template #prepend>
        <img :alt="t('titleBar.iconsAlt.brandfetch')" :src="logoUrl"/>
      </template>
    </v-select>
  </v-app-bar>
</template>
