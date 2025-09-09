<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock, IStockDB} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'

interface IFormularData {
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
const {log} = useApp()
const {notice} = useBrowser()
const {updateStock} = useStocksDB()
const {valIbanRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const formularData: IFormularData = reactive({
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
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const stock: IStockDB = {
      cID: formularData.id,
      cISIN: formularData.isin,
      cCompany: formularData.company,
      cWKN: formularData.wkn,
      cSymbol: formularData.symbol,
      cMeetingDay: formularData.meetingDay,
      cQuarterDay: formularData.quarterDay,
      cFadeOut: formularData.fadeOut ? 1 : 0,
      cFirstPage: formularData.firstPage ? 1 : 0,
      cURL: formularData.url,
      cAccountNumberID: settings.activeAccountId
    }
    const stockStore: IStock = {
      ...stock,
      mPortfolio: 0,
      mChange: 0,
      mBuyValue: 0,
      mEuroChange: 0,
      mMin: 0,
      mValue: 0,
      mMax: 0
    }
    records.stocks.updateStock(stockStore)
    const updateStockResponse = await updateStock(stock)
    await notice([updateStockResponse as string])
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
  const currentStock = records.stocks.items[records.stocks.getStockIndexById(runtime.activeId)]
  formularData.id = runtime.activeId
  formularData.isin = currentStock.cISIN
  formularData.company = currentStock.cCompany
  formularData.wkn = currentStock.cWKN
  formularData.symbol = currentStock.cSymbol
  formularData.meetingDay = currentStock.cMeetingDay
  formularData.quarterDay = currentStock.cQuarterDay
  formularData.fadeOut = currentStock.cFadeOut === 1
  formularData.firstPage = currentStock.cFirstPage === 1
  formularData.url = currentStock.cURL
})

log('--- UpdateStock.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-container>
      <v-row>
        <v-text-field
            v-model="formularData.isin"
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
            v-model="formularData.company"
            :label="t('dialogs.updateStock.company')"
            required
            variant="outlined"
        />
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="formularData.wkn"
              :label="t('dialogs.updateStock.wkn')"
              required
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="formularData.symbol"
              :label="t('dialogs.updateStock.symbol')"
              required
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="formularData.meetingDay"
              :label="t('dialogs.updateStock.meetingDay')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="formularData.quarterDay"
              :label="t('dialogs.updateStock.quarterDay')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-checkbox
              v-model="formularData.fadeOut"
              :label="t('dialogs.updateStock.fadeOut')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-checkbox
              v-model="formularData.firstPage"
              :label="t('dialogs.updateStock.firstPage')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
            v-model="formularData.url"
            :label="t('dialogs.updateStock.url')"
            variant="outlined"
        />
      </v-row>
    </v-container>
  </v-form>
</template>
