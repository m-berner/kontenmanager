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
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'

interface IState {
  isin: string
  company: string
  wkn: string
  symbol: string
  auto: boolean
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules} = useApp()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: Reactive<IState> = reactive({
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  auto: true
})

const mResetState = (): void => {
  state.isin = ''
  state.company = ''
  state.wkn = ''
  state.symbol = ''
  state.auto = false
}
const onIsin = async (): Promise<void> => {
  if (state.isin !== '' && state.isin?.length === 12) {
    const addStockResponse = await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.FETCH__COMPANY_DATA,
      data: state.isin
    }))
    const addStock = JSON.parse(addStockResponse).data
    state.company = addStock.company
    state.wkn = addStock.wkn.toUpperCase()
    state.symbol = addStock.symbol.toUpperCase()
  }
}
const onClickOk = async (): Promise<void> => {
  log('ADD_STOCK : onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
    try {
      const stock: Omit<IStockStore, 'cID'> = {
        cCompany: state.company.trim(),
        cISIN: state.isin,
        cWKN: state.wkn,
        cSymbol: state.symbol,
        cMeetingDay: '',
        cQuarterDay: '',
        cFadeOut: 0,
        cFirstPage: 0,
        cURL: '',
        cAccountNumberID: settings.activeAccountId,
        mPortfolio: 0,
        mChange: 0,
        mBuyValue: 0,
        mEuroChange: 0,
        mMin: 0,
        mValue: 0,
        mMax: 0
      }
      const addStockResponse = await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__ADD_STOCK, data: stock
      }))
      const addStockData: IStock = JSON.parse(addStockResponse).data
      const test = records.stocks.filter((stock) => {
        return stock.cISIN === addStockData.cISIN
      })
      if (test.length > 0) {
        await notice(['Unternehmen existiert bereits'])
        return
      }
      records.addStock({
        ...addStockData,
        mPortfolio: 0,
        mChange: 0,
        mBuyValue: 0,
        mEuroChange: 0,
        mMin: 0,
        mValue: 0,
        mMax: 0
      })
      await notice([t('dialogs.addStock.success')])
      mResetState()
      runtime.resetTeleport()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.addStock.error')])
    }
  }
}
const title = t('dialogs.addStock.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_STOCK: onMounted')
  mResetState()
})

log('--- AddStock.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          v-model="state.isin"
          autofocus
          required
          variant="outlined"
          v-bind:counter="12"
          v-bind:label="t('dialogs.addStock.isin')"
          v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
          v-on:update:modelValue="onIsin"
      ></v-text-field>
      <v-text-field
          v-model="state.company"
          required
          variant="outlined"
          v-bind:disabled="state.auto"
          v-bind:label="t('dialogs.addStock.company')"
      ></v-text-field>
      <v-text-field
          v-model="state.wkn"
          required
          variant="outlined"
          v-bind:disabled="state.auto"
          v-bind:label="t('dialogs.addStock.wkn')"
      ></v-text-field>
      <v-text-field
          v-model="state.symbol"
          required
          variant="outlined"
          v-bind:disabled="state.auto"
          v-bind:label="t('dialogs.addStock.symbol')"
      ></v-text-field>
    </v-card-text>
  </v-form>
  <!--<v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-switch
      v-model="state._stockAccount"
      color="red"
      v-bind:label="t('dialogs.addAccount.stockAccountLabel')"></v-switch>
    <v-text-field
      ref="swift-input"
      v-model="state._swift"
      autofocus
      required
      v-bind:label="t('dialogs.addAccount.swiftLabel')"
      v-bind:rules="VALIDATORS.swiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._number"
      required
      v-bind:label="t('dialogs.addAccount.accountNumberLabel')"
      v-bind:placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
      v-bind:rules="VALIDATORS.ibanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._brandFetchName"
      autofocus
      placeholder="z. B. ing.com"
      required
      v-bind:label="t('dialogs.addAccount.logoLabel')"
      v-bind:rules="VALIDATORS.brandNameRules([t('validators.brandNameRules', 0)])"
      variant="outlined"
    ></v-text-field>
  </v-form>-->
</template>
