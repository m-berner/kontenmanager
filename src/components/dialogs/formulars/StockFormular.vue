<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineProps, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import {useStockFormular} from '@/composables/useStockFormular'
import {useFetch} from '@/composables/useFetch'
import {useBrowser} from '@/composables/useBrowser'
import type {IStockFormularProps} from '@/types'

const stockFormularProps = defineProps<IStockFormularProps>()

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {isinRules} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {fetchCompanyData} = useFetch()
const {stockFormularData, formRef} = useStockFormular()

const T = Object.freeze({
  MESSAGES: {
    ERROR_ONUPDATE_ISIN: t('messages.onUpdateIsin')
  },
  STRINGS: {
    COMPANY_LABEL: t('dialogs.stockFormular.companyLabel'),
    SYMBOL_LABEL: t('dialogs.stockFormular.symbolLabel'),
    MEETING_DAY_LABEL: t('dialogs.stockFormular.meetingDayLabel'),
    QUARTER_DAY_LABEL: t('dialogs.stockFormular.quarterDayLabel'),
    FADEOUT_LABEL: t('dialogs.stockFormular.fadeOutLabel'),
    FIRST_PAGE_LABEL: t('dialogs.stockFormular.firstPageLabel'),
    URL_LABEL: t('dialogs.stockFormular.urlLabel'),
    ISIN_LABEL: t('dialogs.stockFormular.isinLabel')
  },
  ISIN_RULES: [
    t('validators.isinRules.required'),
    t('validators.isinRules.length'),
    t('validators.isinRules.format'),
    t('validators.isinRules.country'),
    t('validators.isinRules.luhn')
  ]
})

const onUpdateIsin = async () => {
  log('STOCK_FORMULAR: onUpdateISIN')
  try {
    if (!stockFormularProps.isUpdate && stockFormularData.isin.length === 12) {
      stockFormularData.isin = stockFormularData.isin.toUpperCase().replace(/\s/g, '')
      const companyData = await fetchCompanyData(stockFormularData.isin)
      stockFormularData.company = companyData.company
      stockFormularData.symbol = companyData.symbol
    }
  } catch (e) {
    stockFormularData.company = ''
    stockFormularData.symbol = ''
    if (e instanceof Error) {
      log(T.MESSAGES.ERROR_ONUPDATE_ISIN, {error: e.message})
      await notice([T.MESSAGES.ERROR_ONUPDATE_ISIN, e.message])
    } else {
      throw new Error(`${T.MESSAGES.ERROR_ONUPDATE_ISIN}: unknown`)
    }
  }
}

onMounted(() => {
  log('STOCK_FORMULAR: onMounted')
  if (stockFormularProps.isUpdate) {
    const currentStock = records.stocks.getItemById(activeId.value)
    stockFormularData.id = activeId.value
    stockFormularData.isin = currentStock.cISIN.toUpperCase().replace(/\s/g, '')
    stockFormularData.company = currentStock.cCompany
    stockFormularData.symbol = currentStock.cSymbol
    stockFormularData.meetingDay = currentStock.cMeetingDay
    stockFormularData.quarterDay = currentStock.cQuarterDay
    stockFormularData.fadeOut = currentStock.cFadeOut === 1
    stockFormularData.firstPage = currentStock.cFirstPage === 1
    stockFormularData.url = currentStock.cURL
  }
})

log('--- StockFormular.vue setup ---')
</script>

<template>
  <v-container>
    <v-row>
      <v-text-field
          v-model="stockFormularData.isin"
          :counter="12"
          :label="T.STRINGS.ISIN_LABEL"
          :rules="isinRules(T.ISIN_RULES)"
          autofocus
          variant="outlined"
          @focus="formRef?.resetValidation()"
          @update:model-value="onUpdateIsin"/>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormularData.company"
          :label="T.STRINGS.COMPANY_LABEL"
          required
          variant="outlined"
      />
    </v-row>
    <v-row cols="2" sm="2">
      <v-col/>
      <v-col>
        <v-text-field
            v-model="stockFormularData.symbol"
            :label="T.STRINGS.SYMBOL_LABEL"
            required
            variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
  <v-container v-if="stockFormularProps.isUpdate">
    <v-row cols="2" sm="2">
      <v-col>
        <v-text-field
            v-model="stockFormularData.meetingDay"
            :label="T.STRINGS.MEETING_DAY_LABEL"
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-text-field
            v-model="stockFormularData.quarterDay"
            :label="T.STRINGS.QUARTER_DAY_LABEL"
            type="date"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row cols="2" sm="2">
      <v-col>
        <v-checkbox
            v-model="stockFormularData.fadeOut"
            :label="T.STRINGS.FADEOUT_LABEL"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-checkbox
            v-model="stockFormularData.firstPage"
            :label="T.STRINGS.FIRST_PAGE_LABEL"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormularData.url"
          :label="T.STRINGS.URL_LABEL"
          variant="outlined"
      />
    </v-row>
  </v-container>
</template>
