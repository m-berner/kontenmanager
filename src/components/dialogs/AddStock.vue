<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'

interface IState {
  isin: string
  company: string
  wkn: string
  symbol: string
  auto: boolean
  isFormValid: boolean
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules} = useApp()
const {sendMessage} = useBrowser()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: IState = reactive({
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  auto: true,
  isFormValid: false
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
    const addStockResponse = await sendMessage(JSON.stringify({
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
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
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
    const addStockResponse = await sendMessage(JSON.stringify({
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
const title = t('dialogs.addStock.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_STOCK: onMounted')
  mResetState()
})

log('--- AddStock.vue setup ---')
</script>

<template>
  <v-form v-model="state.isFormValid" validate-on="submit">
    <v-card-text class="pa-5">
      <v-text-field
          v-model="state.isin"
          :counter="12"
          :label="t('dialogs.addStock.isin')"
          :rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
          autofocus
          required
          variant="outlined"
          @update:modelValue="onIsin"
      />
      <v-text-field
          v-model="state.company"
          :disabled="state.auto"
          :label="t('dialogs.addStock.company')"
          required
          variant="outlined"
      />
      <v-text-field
          v-model="state.wkn"
          :disabled="state.auto"
          :label="t('dialogs.addStock.wkn')"
          required
          variant="outlined"
      />
      <v-text-field
          v-model="state.symbol"
          :disabled="state.auto"
          :label="t('dialogs.addStock.symbol')"
          required
          variant="outlined"
      />
    </v-card-text>
  </v-form>
</template>
