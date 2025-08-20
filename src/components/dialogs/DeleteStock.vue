<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, type Reactive, reactive, toRaw} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/apis/useApp'

interface IState {
  selected: number
}

const {t} = useI18n()
const {CONS, log, notice} = useApp()
const records = useRecordsStore()

const state: Reactive<IState> = reactive({
  selected: records.stocks.length > 0 ? records.stocks[0].cID : -1
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_STOCK : onClickOk')
  if (state.selected === -1) {
    await notice([t('dialogs.deleteStock.error')])
    return
  }
  try {
    // TODO in all delete dialogs,move to background!
    // TODO sendMessage to delete from DB
    records.deleteStock(state.selected)
    await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.DB__DELETE_STOCK,
      data: toRaw(state.selected)
    }))
    await notice([t('dialogs.deleteStock.success')])
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.deleteStock.error')])
  }
}
const title = t('dialogs.deleteStock.title')
defineExpose({onClickOk, title})

log('--- DeleteAccount.vue setup ---')
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-select
        v-if="records.stocks.length > 0"
        v-model="state.selected"
        density="compact"
        required
        variant="outlined"
        v-bind:item-title="CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER"
        v-bind:item-value="CONS.DB.STORES.ACCOUNTS.FIELDS.ID"
        v-bind:items="records.stocks"
        v-bind:label="t('dialogs.deleteStock.accountNumberLabel')"
    ></v-select>
    <v-text-field
        v-else
        density="compact"
        variant="outlined">{{ 'No company to delete' }}
    </v-text-field>
  </v-form>
</template>
