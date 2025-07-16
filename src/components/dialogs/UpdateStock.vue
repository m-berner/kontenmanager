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
  _isin: string
  _company: string
  _wkn: string
  _symbol: string
  _meetingDay: string
  _quarterDay: string
  _fadeOut: number
  _firstPage: number
  _url: string
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules} = useApp()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const state: Reactive<IState> = reactive({
  _isin: '',
  _company: '',
  _wkn: '',
  _symbol: '',
  _meetingDay: '',
  _quarterDay: '',
  _fadeOut: 0,
  _firstPage: 0,
  _url: ''
})
const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  const formIs = await formRef.value!.validate()
  if (formIs.valid) {
    try {
      const stock = {
        cID: settings.activeAccountId,
        cISIN: state._isin,
        cCompany: state._company,
        cWKN: state._wkn,
        cSymbol: state._symbol,
        cMeetingDay: state._meetingDay,
        cQuarterDay: state._quarterDay,
        cFadeOut: state._fadeOut,
        cFirstPage: state._firstPage,
        cURL: state._url,
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
      formRef.value!.reset()
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
  formRef.value!.reset()
  const currentStock = records.stocks[records.getStockById(settings.activeAccountId)]
  state._isin = currentStock.cISIN
  state._company = currentStock.cCompany
  state._wkn = currentStock.cWKN
  state._symbol = currentStock.cSymbol
  state._meetingDay = currentStock.cMeetingDay
  state._quarterDay = currentStock.cQuarterDay
  state._fadeOut = currentStock.cFadeOut
  state._firstPage = currentStock.cFirstPage
  state._url = currentStock.cURL
})
log('--- UpdateStock.vue setup ---')
</script>
<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-text-field
      v-model="state._isin"
      autofocus
      required
      v-bind:counter="12"
      v-bind:label="t('dialogs.updateStock.isin')"
      v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._company"
      required
      v-bind:label="t('dialogs.updateStock.company')"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._wkn"
      required
      v-bind:label="t('dialogs.updateStock.wkn')"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._symbol"
      required
      v-bind:label="t('dialogs.updateStock.symbol')"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._meetingDay"
      v-bind:label="t('dialogs.updateStock.meetingDay')"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._quarterDay"
      v-bind:label="t('dialogs.updateStock.quarterDay')"
      variant="outlined"
    ></v-text-field>
  </v-form>
</template>
