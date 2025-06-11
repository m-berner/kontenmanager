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
import {useAppApi} from '@/pages/background'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'

const {n, t} = useI18n()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()
const {CONS, log} = useAppApi()

const {_active_account_id} = storeToRefs(settings)

const cUpdateTitlebar = (): void => {
  const appMessagePort = browser.runtime.connect({ name: CONS.MESSAGES.PORT__APP })
  const onResponse = (m: object): void => {
    log('TITLE_BAR: onResponse', {info: Object.values(m)[1]})
    switch (Object.values(m)[0]) {
      case CONS.MESSAGES.STORAGE__SET_ID__RESPONSE:
        appMessagePort.postMessage({type: CONS.MESSAGES.DB__TO_STORE })
        break
      case CONS.MESSAGES.DB__TO_STORE__RESPONSE:
        if (Object.values(m)[1].accounts.length > 0) {
          records.initStore(Object.values(m)[1])
          if (settings.activeAccountId === undefined) {
            settings.setActiveAccountId(records.accounts[0].cID)
          }
          runtime.setLogo()
          records.sumBookings()
        }
        break
      default:
    }
  }
  appMessagePort.onMessage.addListener(onResponse)
  appMessagePort.postMessage({type: CONS.MESSAGES.STORAGE__SET_ID, data: _active_account_id.value})
}

log('--- TitleBar.vue setup ---')
</script>

<template>
  <v-app-bar app color="secondary" v-bind:flat="true">
    <template v-slot:prepend>
      <img alt="brandfetch.com logo" v-bind:src="runtime.logo">
    </template>
    <v-app-bar-title>{{ t('titleBar.title') }}</v-app-bar-title>
    <v-text-field
      max-width="150"
      v-bind:disabled="true"
      v-bind:label="t('titleBar.bookingsSumLabel')"
      v-bind:modelValue="n(records.bookingSum, 'currency')"
    ></v-text-field>
    <v-spacer></v-spacer>
    <v-select
      v-if="_active_account_id > 0"
      v-model="_active_account_id"
      max-width="300"
      v-bind:item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
      v-bind:item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
      v-bind:items="records.accounts"
      v-bind:label="t('titleBar.selectAccountLabel')"
      v-on:update:modelValue="cUpdateTitlebar"
    ></v-select>
  </v-app-bar>
</template>
