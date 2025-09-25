<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {ICompanyData, IStock} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {addStock} = useStocksDB()
const {fetchCompanyData} = useFetch()
const {ibanRules, validateForm} = useValidation()
const records = useRecordsStore()
const {activeAccountId} = useSettings()
const runtime = useRuntime()

const isin = ref('')
const company = ref('')
const wkn = ref('')
const symbol = ref('')
const auto = ref(false)
const formRef: Ref<HTMLFormElement | null> = ref(null)

const reset = (): void => {
  isin.value = ''
  company.value = ''
  wkn.value = ''
  symbol.value = ''
  auto.value = false
  formRef.value = null
}

const onIsin = async (): Promise<void> => {
  if (isin.value !== '' && isin.value?.length === 12) {
    const fetchedCompanyData: ICompanyData = await fetchCompanyData(isin.value)
    company.value = fetchedCompanyData.company
    // wkn.value = fetchedCompanyData.wkn.toUpperCase()
    symbol.value = fetchedCompanyData.symbol.toUpperCase()
  }
}

const onClickOk = async (): Promise<void> => {
  log('ADD_STOCK : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const stock: Omit<IStock, 'cID'> = {
      cCompany: company.value.trim(),
      cISIN: isin.value,
      // cWKN: wkn.value,
      cSymbol: symbol.value,
      cMeetingDay: '',
      cQuarterDay: '',
      cFadeOut: 0,
      cFirstPage: 0,
      cURL: '',
      cAccountNumberID: activeAccountId.value,
      mPortfolio: 0,
      mChange: 0,
      mBuyValue: 0,
      mEuroChange: 0,
      mMin: 0,
      mValue: 0,
      mMax: 0
    }

    const addStockID = await addStock(stock)
    if (addStockID > 0) {
      const completeStock: IStock = {cID: addStockID, ...stock}
      records.stocks.add({
        ...completeStock,
        mPortfolio: 0,
        mChange: 0,
        mBuyValue: 0,
        mEuroChange: 0,
        mMin: 0,
        mValue: 0,
        mMax: 0
      })
      await notice([t('dialogs.addStock.success')])
      reset()
      runtime.resetTeleport()
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
    <v-card-text class="pa-5">
      <v-text-field
          v-model="isin"
          :counter="12"
          :label="t('dialogs.addStock.isin')"
          :rules="ibanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
          autofocus
          required
          variant="outlined"
          @update:modelValue="onIsin"
      />
      <v-text-field
          v-model="company"
          :disabled="auto"
          :label="t('dialogs.addStock.company')"
          required
          variant="outlined"
      />
      <v-text-field
          v-model="symbol"
          :disabled="auto"
          :label="t('dialogs.addStock.symbol')"
          required
          variant="outlined"
      />
    </v-card-text>
  </v-form>
</template>
