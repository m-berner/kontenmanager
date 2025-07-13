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
const {activeAccountId} = storeToRefs(settings)
// TODO use settings getter?

const mUpdateTitleBar = (): void => {
  browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.STORAGE__SET_ID}))
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
      v-if="activeAccountId > 0"
      v-model="activeAccountId"
      max-width="300"
      v-bind:item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
      v-bind:item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
      v-bind:items="records.accounts"
      v-bind:label="t('titleBar.selectAccountLabel')"
      v-on:update:modelValue="mUpdateTitleBar"
    ></v-select>
  </v-app-bar>
</template>
