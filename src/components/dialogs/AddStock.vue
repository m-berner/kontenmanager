<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {ICompanyData, IStockDB} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'

interface INewStock {
  isin: string,
  company: string,
  symbol: string
}

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {addStock} = useStocksDB()
const {fetchCompanyData} = useFetch()
const {isinRules, validateForm} = useValidation()
const {activeAccountId} = useSettings()
const {resetTeleport} = useRuntime()
const records = useRecordsStore()

const newStock: INewStock = reactive({
  isin: '',
  company: '',
  symbol: ''
})
const formRef: Ref<HTMLFormElement | null> = ref(null)
const formDisabled = ref(false)

const reset = (): void => {
  Object.assign(newStock, {
    isin: '',
    company: '',
    symbol: ''
  })
  formRef.value = null
  formDisabled.value = false
}

const onIsin = async (): Promise<void> => {
  if (newStock.isin !== '' && newStock.isin?.length === 12) {
    const fetchedCompanyData: ICompanyData = await fetchCompanyData(newStock.isin)
    newStock.company = fetchedCompanyData.company
    newStock.symbol = fetchedCompanyData.symbol.toUpperCase()
  }
}

const onClickOk = async (): Promise<void> => {
  log('ADD_STOCK : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const stock: Omit<IStockDB, 'cID'> = {
      cCompany: newStock.company.trim(),
      cISIN: newStock.isin,
      cSymbol: newStock.symbol,
      cMeetingDay: '',
      cQuarterDay: '',
      cFadeOut: 0,
      cFirstPage: 0,
      cURL: '',
      cAccountNumberID: activeAccountId.value
    }
    const addStockID = await addStock(stock)
    if (addStockID > 0) {
      const dbStock: IStockDB = {cID: addStockID, ...stock}
      records.stocks.add(dbStock)
      resetTeleport()
      await notice([t('dialogs.addStock.success')])
    }
  } catch (e) {
    log('ADD_STOCK: onClickOk', {error: e})
    await notice([t('dialogs.addStock.error')])
  }
}

const title = t('dialogs.addStock.title')

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_STOCK: onMounted')
  reset()
})

log('--- AddStock.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <v-alert v-if="activeAccountId === -1">{{ t('dialogs.addStock.message') }}</v-alert>
    <v-text-field
          v-model="newStock.isin"
          :counter="12"
          :label="t('dialogs.addStock.isin')"
          :rules="isinRules([
              t('validators.isinRules.required'),
              t('validators.isinRules.length'),
              t('validators.isinRules.format'),
              t('validators.isinRules.country'),
              t('validators.isinRules.luhn'),
          ])"
          autofocus
          variant="outlined"
          @focus="formRef?.resetValidation()"
          @update:modelValue="onIsin"/>
    <v-switch
        v-model="formDisabled"
        :label="t('dialogs.addStock.formDisabledLabel')"
        color="red"
        variant="outlined"/>
      <v-text-field
          v-model="newStock.company"
          :disabled="!formDisabled"
          :label="t('dialogs.addStock.company')"
          variant="outlined"/>
      <v-text-field
          v-model="newStock.symbol"
          :disabled="!formDisabled"
          :label="t('dialogs.addStock.symbol')"
          variant="outlined"/>
  </v-form>
</template>
