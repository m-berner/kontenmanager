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
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'

interface IFormData {
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
const {isinRules, validateForm} = useValidation()
const records = useRecordsStore()
const {activeAccountId} = useSettings()
const runtime = useRuntime()

const formData: IFormData = reactive({
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
      cID: formData.id,
      cISIN: formData.isin,
      cCompany: formData.company,
      cWKN: formData.wkn,
      cSymbol: formData.symbol,
      cMeetingDay: formData.meetingDay,
      cQuarterDay: formData.quarterDay,
      cFadeOut: formData.fadeOut ? 1 : 0,
      cFirstPage: formData.firstPage ? 1 : 0,
      cURL: formData.url,
      cAccountNumberID: activeAccountId.value
    }
    const stocksStore: IStock = {
      ...stock,
      mPortfolio: 0,
      mChange: 0,
      mBuyValue: 0,
      mEuroChange: 0,
      mMin: 0,
      mValue: 0,
      mMax: 0
    }
    records.stocks.updateStock(stocksStore)
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
  // const currentStock = records.stocks.items[records.stocks.getIndexById(runtime.activeId.value)]
  const currentStock = records.stocks.getItemById(runtime.activeId.value)
  formData.id = runtime.activeId.value
  formData.isin = currentStock.cISIN
  formData.company = currentStock.cCompany
  formData.wkn = currentStock.cWKN
  formData.symbol = currentStock.cSymbol
  formData.meetingDay = currentStock.cMeetingDay
  formData.quarterDay = currentStock.cQuarterDay
  formData.fadeOut = currentStock.cFadeOut === 1
  formData.firstPage = currentStock.cFirstPage === 1
  formData.url = currentStock.cURL
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
            v-model="formData.isin"
            :counter="12"
            :label="t('dialogs.updateStock.isin')"
            :rules="isinRules([
                t('validators.isinRules.required'),
                t('validators.isinRules.length'),
                t('validators.isinRules.format'),
                t('validators.isinRules.country'),
                t('validators.isinRules.luhn')
                ])"
            autofocus
            required
            variant="outlined"/>
      </v-row>
      <v-row>
        <v-text-field
            v-model="formData.company"
            :label="t('dialogs.updateStock.company')"
            required
            variant="outlined"
        />
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="formData.wkn"
              :label="t('dialogs.updateStock.wkn')"
              required
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="formData.symbol"
              :label="t('dialogs.updateStock.symbol')"
              required
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-text-field
              v-model="formData.meetingDay"
              :label="t('dialogs.updateStock.meetingDay')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-text-field
              v-model="formData.quarterDay"
              :label="t('dialogs.updateStock.quarterDay')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <v-checkbox
              v-model="formData.fadeOut"
              :label="t('dialogs.updateStock.fadeOut')"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-checkbox
              v-model="formData.firstPage"
              :label="t('dialogs.updateStock.firstPage')"
              variant="outlined"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
            v-model="formData.url"
            :label="t('dialogs.updateStock.url')"
            variant="outlined"
        />
      </v-row>
    </v-container>
  </v-form>
</template>
