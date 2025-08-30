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
import {useSettingsStore} from '@/stores/settings'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useRuntimeStore} from '@/stores/runtime'
import type {IStock, IStockStore} from '@/types.d'
import {useValidation} from '@/composables/useValidation'
import {useNotification} from '@/composables/useNotification'

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
  isFormValid: boolean
}

const {t} = useI18n()
const {log, notice} = useNotification()
const {updateStock} = useIndexedDB()
const {valIbanRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: IState = reactive({
  id: -1,
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  meetingDay: '',
  quarterDay: '',
  fadeOut: false,
  firstPage: false,
  url: '',
  isFormValid: false
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
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
    const updateStockResponse = await updateStock(stock)
    await notice([updateStockResponse])
    runtime.resetTeleport()
  } catch (e) {
    log('UPDATE_STOCK: onClickOk', {error: e})
    await notice([t('dialogs.updateStock.error')])
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
  <v-form ref="form-ref" validate-on="submit" @submit.prevent>
    <v-container>
      <v-row>
        <v-text-field
            v-model="state.isin"
            :counter="12"
            :label="t('dialogs.updateStock.isin')"
            :rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
            autofocus
            required
            variant="outlined"
        />
      </v-row>
      <v-row>
        <v-text-field
            v-model="state.company"
            :label="t('dialogs.updateStock.company')"
            required
            variant="outlined"
        />
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="state.wkn"
              :label="t('dialogs.updateStock.wkn')"
              required
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="state.symbol"
              :label="t('dialogs.updateStock.symbol')"
              required
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="state.meetingDay"
              :label="t('dialogs.updateStock.meetingDay')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="state.quarterDay"
              :label="t('dialogs.updateStock.quarterDay')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-checkbox
              v-model="state.fadeOut"
              :label="t('dialogs.updateStock.fadeOut')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-checkbox
              v-model="state.firstPage"
              :label="t('dialogs.updateStock.firstPage')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
            v-model="state.url"
            :label="t('dialogs.updateStock.url')"
            variant="outlined"
        />
      </v-row>
    </v-container>
  </v-form>
</template>
