<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive, toRaw, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'

const {t} = useI18n()
const {CONS, log, notice} = useAppApi()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state = reactive({
  _selected: -1
})

const ok = async (): Promise<void> => {
  log('DELETE_ACCOUNT: ok')
  try {
    records.deleteAccount(state._selected)
    await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__DELETE_ACCOUNT, data: toRaw(state._selected)}))
    if (records.accounts.length > 0) {
      settings.setActiveAccountId(records.accounts[0].cID)
      await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.STORAGE__SET_ID, data: toRaw(records.accounts[0])}))
    } else {
      settings.setActiveAccountId(-1)
      await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.STORAGE__SET_ID, data: -1}))
    }
    runtime.setLogo()
    records.sumBookings()
    await notice([t('dialogs.deleteAccount.success')])
    formRef.value?.reset()
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteAccount.error')])
  }
}
const title = t('dialogs.deleteAccount.title')

defineExpose({ok, title})

onMounted(() => {
  log('DELETE_ACCOUNT: onMounted')
  formRef.value?.reset()
})

log('--- DeleteAccount.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-select
      v-model="state._selected"
      density="compact"
      required
      v-bind:item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
      v-bind:item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
      v-bind:items="records.accounts"
      v-bind:label="t('dialogs.deleteAccount.accountNumberLabel')"
      variant="outlined"
    ></v-select>
  </v-form>
</template>
