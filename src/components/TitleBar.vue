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
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {storeToRefs} from 'pinia'
import {computed} from 'vue'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const {CONS, log} = useApp()
const {activeAccountId} = storeToRefs(settings)

const onUpdateTitleBar = async (): Promise<void> => {
  await browser.runtime.sendMessage(JSON.stringify({
    type: CONS.MESSAGES.STORAGE__SET_ID,
    data: settings.activeAccountId
  }))
  const getStoresResponseString = await browser.runtime.sendMessage(JSON.stringify({
    type: CONS.MESSAGES.DB__GET_STORES,
    data: settings.activeAccountId
  }))
  records.initStore(JSON.parse(getStoresResponseString).data)
  records.sumBookings()
}
const logoUrl = computed((): string => {
  const ind = records.getAccountIndexById(settings.activeAccountId)
  if (ind > -1) {
    return records.accounts[ind].cLogoUrl
  } else {
    return ''
  }
})
const balance = computed(() => n(records.bookingSum, 'currency'))

log('--- TitleBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" :flat="true">
    <template v-slot:prepend>
      <img alt="t('titleBar.iconsAlt.logo')" :src=CONS.COMPONENTS.TITLE_BAR.LOGO>
    </template>
    <v-app-bar-title>{{ t('titleBar.title') }}</v-app-bar-title>
    <v-text-field
        max-width="150"
        hide-details
        :disabled="true"
        :label="t('titleBar.bookingsSumLabel')"
        :modelValue="balance"
    ></v-text-field>
    <v-spacer></v-spacer>
    <v-select
        v-model="activeAccountId"
        max-width="350"
        hide-details
        density="compact"
        variant="outlined"
        :item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
        :item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
        :items="records.accounts"
        :label="t('titleBar.selectAccountLabel')"
        @update:modelValue="onUpdateTitleBar">
      <template v-slot:prepend>
        <img alt="t('titleBar.iconsAlt.brandfetch')" :src="logoUrl">
      </template>
    </v-select>
  </v-app-bar>
</template>
