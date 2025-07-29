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
import {useRuntimeStore} from '@/stores/runtime'

interface IState {
  id: number
  isin: string
  company: string
  wkn: string
  symbol: string
  meetingDay: string
  quarterDay: string
  fadeOut: boolean
  firstPage: boolean
  url: string
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules} = useApp()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: Reactive<IState> = reactive({
  id: -1,
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  meetingDay: '',
  quarterDay: '',
  fadeOut: false,
  firstPage: false,
  url: ''
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
    try {
      const stock: IStock = {
        cID: state.id,
        cISIN: state.isin,
        cCompany: state.company,
        cWKN: state.wkn,
        cSymbol: state.symbol,
        cMeetingDay: state.meetingDay,
        cQuarterDay: state.quarterDay,
        cFadeOut: state.fadeOut ? 1 : 0,
        cFirstPage: state.firstPage ? 1 : 0,
        cURL: state.url,
        cAccountNumberID: settings.activeAccountId
      }
      const stockStore: IStockStore = {
        ...stock,
        mPortfolio: 0,
        mChange: 0,
        mBuyValue: 0,
        mEuroChange: 0,
        mMin: 0,
        mValue: 0,
        mMax: 0
      }
      records.updateStock(stockStore)
      const updateStockResponseString = await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__UPDATE_STOCK,
        data: stock
      }))
      const updateStockResponse = JSON.parse(updateStockResponseString)
      await notice([updateStockResponse.data])
      runtime.resetTeleport()
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
  const currentStock = records.stocks[records.getStockById(runtime.activeId)]
  state.id = currentStock.cID
  state.isin = currentStock.cISIN
  state.company = currentStock.cCompany
  state.wkn = currentStock.cWKN
  state.symbol = currentStock.cSymbol
  state.meetingDay = currentStock.cMeetingDay
  state.quarterDay = currentStock.cQuarterDay
  state.fadeOut = currentStock.cFadeOut === 1
  state.firstPage = currentStock.cFirstPage === 1
  state.url = currentStock.cURL
})
log('--- UpdateStock.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-container>
      <v-row>
        <v-text-field
          v-model="state.isin"
          autofocus
          required
          v-bind:counter="12"
          v-bind:label="t('dialogs.updateStock.isin')"
          v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
          variant="outlined"
        ></v-text-field>
      </v-row>
      <v-row>
        <v-text-field
          v-model="state.company"
          required
          v-bind:label="t('dialogs.updateStock.company')"
          variant="outlined"
        ></v-text-field>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
            v-model="state.wkn"
            required
            v-bind:label="t('dialogs.updateStock.wkn')"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            v-model="state.symbol"
            required
            v-bind:label="t('dialogs.updateStock.symbol')"
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
            v-model="state.meetingDay"
            v-bind:label="t('dialogs.updateStock.meetingDay')"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            v-model="state.quarterDay"
            v-bind:label="t('dialogs.updateStock.quarterDay')"
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-checkbox
            v-model="state.fadeOut"
            v-bind:label="t('dialogs.updateStock.fadeOut')"
            variant="outlined"
          ></v-checkbox>
        </v-col>
        <v-col>
          <v-checkbox
            v-model="state.firstPage"
            v-bind:label="t('dialogs.updateStock.firstPage')"
            variant="outlined"
          ></v-checkbox>
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
          v-model="state.url"
          v-bind:label="t('dialogs.updateStock.url')"
          variant="outlined"
        ></v-text-field>
      </v-row>
    </v-container>
  </v-form>
</template>
