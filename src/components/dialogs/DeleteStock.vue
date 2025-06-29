<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, type Reactive, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'

interface IState {
  _selected: number
}

const {t} = useI18n()
const {CONS, log, notice} = useAppApi()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: Reactive<IState> = reactive({
  _selected: -1
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_STOCK : onClickOk')
  try {
    // TODO in all delete dialogs,move to background!
    // TODO sendMessage to delete from DB
    records.deleteStock(state._selected)
    formRef.value?.reset()
    if (records.accounts.length > 0) {
      settings.setActiveAccountId(records.accounts[0].cID)
      await browser.storage.local.set({sActiveAccountId: records.accounts[0].cID})
    } else {
      settings.setActiveAccountId(-1)
      await browser.storage.local.set({sActiveAccountId: -1})
    }
    runtime.setLogo()
    await notice([t('dialogs.deleteStock.success')])
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteStock.error')])
  }
}
const title = t('dialogs.deleteStock.title')

defineExpose({onClickOk, title})

onMounted(() => {
  log('DELETE_STOCK: onMounted')
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
