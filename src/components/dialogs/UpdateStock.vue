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
import {useApp} from '@/pages/background'

interface IState {
  isin: string
  company: string
  wkn: string
  symbol: string
  meetingDay: string
  quarterDay: string
  fadeOut: number
  firstPage: number
  url: string
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules} = useApp()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()

const state: Reactive<IState> = reactive({
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  meetingDay: '',
  quarterDay: '',
  fadeOut: 0,
  firstPage: 0,
  url: ''
})

const mResetState = () => {
  state.isin = ''
  state.company = ''
  state.wkn = ''
  state.symbol = ''
  state.meetingDay = ''
  state.quarterDay = ''
  state.fadeOut = 0
  state.firstPage = 0
  state.url = ''
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
    try {
      const stock = {
        cID: settings.activeAccountId,
        cISIN: state.isin,
        cCompany: state.company,
        cWKN: state.wkn,
        cSymbol: state.symbol,
        cMeetingDay: state.meetingDay,
        cQuarterDay: state.quarterDay,
        cFadeOut: state.fadeOut,
        cFirstPage: state.firstPage,
        cURL: state.url,
        cAccountNumberID: settings.activeAccountId,
        mPortfolio: 0,
        mChange: 0,
        mBuyValue: 0,
        mEuroChange: 0,
        mMin: 0,
        mValue: 0,
        mMax: 0
      }
      records.updateStock(stock)
      await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__UPDATE_STOCK, stock
      }))
      await notice([t('dialogs.UpdateStock.success')])
      mResetState()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.updateStock.error')])
    }
  }
}
const title = t('dialogs.updateStock.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('UPDATE_STOCK: onMounted')
  const currentStock = records.stocks[records.getStockById(settings.activeAccountId)]
  state.isin = currentStock.cISIN
  state.company = currentStock.cCompany
  state.wkn = currentStock.cWKN
  state.symbol = currentStock.cSymbol
  state.meetingDay = currentStock.cMeetingDay
  state.quarterDay = currentStock.cQuarterDay
  state.fadeOut = currentStock.cFadeOut
  state.firstPage = currentStock.cFirstPage
  state.url = currentStock.cURL
})
log('--- UpdateStock.vue setup ---')
</script>
<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-text-field
      v-model="state.isin"
      autofocus
      required
      variant="outlined"
      v-bind:counter="12"
      v-bind:label="t('dialogs.updateStock.isin')"
      v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
    ></v-text-field>
    <v-text-field
      v-model="state.company"
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateStock.company')"
    ></v-text-field>
    <v-text-field
      v-model="state.wkn"
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateStock.wkn')"
    ></v-text-field>
    <v-text-field
      v-model="state.symbol"
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateStock.symbol')"
    ></v-text-field>
    <v-text-field
      v-model="state.meetingDay"
      variant="outlined"
      v-bind:label="t('dialogs.updateStock.meetingDay')"
    ></v-text-field>
    <v-text-field
      v-model="state.quarterDay"
      variant="outlined"
      v-bind:label="t('dialogs.updateStock.quarterDay')"
    ></v-text-field>
  </v-form>
</template>
