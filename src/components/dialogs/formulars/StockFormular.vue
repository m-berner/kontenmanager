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
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useStockFormular} from '@/composables/useStockFormular'
import {useFetch} from '@/composables/useFetch'
import {useDebounce} from '@/composables/useDebounce'
import {storeToRefs} from 'pinia'

interface IStockFormularProps {
  isUpdate: boolean
}

const stockFormularProps = defineProps<IStockFormularProps>()

const {t} = useI18n()
const {log} = useApp()
const {isinRules} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {fetchCompanyData} = useFetch()
const {stockFormularData, formRef} = useStockFormular()

const onUpdateISIN = async () => {
  if (!stockFormularProps.isUpdate) {
    log('STOCK_FORMULAR: onUpdateISIN')
    stockFormularData.isin = stockFormularData.isin.toUpperCase().replace(/\s/g, '')
    const companyData = await fetchCompanyData(stockFormularData.isin)
    stockFormularData.company = companyData.company
    stockFormularData.symbol = companyData.symbol
  }
}

const {debouncedFunction: debouncedIsin} = useDebounce(onUpdateISIN, 400)

onMounted(() => {
  log('STOCK_FORMULAR: onMounted')
  if (stockFormularProps.isUpdate) {
    const currentStock = records.stocks.getItemById(activeId.value)
    stockFormularData.id = activeId.value
    stockFormularData.isin = stockFormularData.isin.toUpperCase().replace(/\s/g, '')
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
          :label="t('dialogs.updateStock.isin')"
          :rules="isinRules([
                t('validators.isinRules.required'),
                t('validators.isinRules.length'),
                t('validators.isinRules.format'),
                t('validators.isinRules.country'),
                t('validators.isinRules.luhn')
                ])"
          autofocus
          variant="outlined"
          @focus="formRef?.resetValidation()"
          @update:model-value="debouncedIsin"/>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormularData.company"
          :label="t('dialogs.updateStock.company')"
          required
          variant="outlined"
      />
    </v-row>
    <v-row cols="2" sm="2">
      <v-col/>
      <v-col>
        <v-text-field
            v-model="stockFormularData.symbol"
            :label="t('dialogs.updateStock.symbol')"
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
            :label="t('dialogs.updateStock.meetingDay')"
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-text-field
            v-model="stockFormularData.quarterDay"
            :label="t('dialogs.updateStock.quarterDay')"
            type="date"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row cols="2" sm="2">
      <v-col>
        <v-checkbox
            v-model="stockFormularData.fadeOut"
            :label="t('dialogs.updateStock.fadeOut')"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-checkbox
            v-model="stockFormularData.firstPage"
            :label="t('dialogs.updateStock.firstPage')"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormularData.url"
          :label="t('dialogs.updateStock.url')"
          variant="outlined"
      />
    </v-row>
  </v-container>
</template>
