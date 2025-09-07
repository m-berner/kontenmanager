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
import {defineExpose, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useNotification} from '@/composables/useNotification'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'

interface IFormularData {
  isin: string
  company: string
  wkn: string
  symbol: string
  auto: boolean
}

const {t} = useI18n()
const {log, notice} = useNotification()
const {addStock} = useStocksDB()
const {fetchCompanyData} = useFetch()
const {valIbanRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const formularData: IFormularData = reactive({
  isin: '',
  company: '',
  wkn: '',
  symbol: '',
  auto: true
})
const isFormValid: Ref<boolean> = ref(false)

const reset = (): void => {
  Object.assign(formularData, {
    isin: '',
    company: '',
    wkn: '',
    symbol: '',
    auto: false
  })
  isFormValid.value = false
}

const validateForm = (): boolean => {
  if (!isFormValid.value) {
    notice([t('dialogs.addAccount.invalidForm')])
    return false
  }

  return true
}

const onIsin = async (): Promise<void> => {
  if (formularData.isin !== '' && formularData.isin?.length === 12) {
    const fetchedCompanyData: ICompanyData = await fetchCompanyData(formularData.isin)
    formularData.company = fetchedCompanyData.company
    formularData.wkn = fetchedCompanyData.wkn.toUpperCase()
    formularData.symbol = fetchedCompanyData.symbol.toUpperCase()
  }
}

const onClickOk = async (): Promise<void> => {
  log('ADD_STOCK : onClickOk')
  if (!validateForm()) return

  try {
    const stock: Omit<IStock, 'cID'> = {
      cCompany: formularData.company.trim(),
      cISIN: formularData.isin,
      cWKN: formularData.wkn,
      cSymbol: formularData.symbol,
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
    const test = records.stocks.items.filter((s) => {
      return s.cISIN === stock.cISIN
    })
    if (test.length > 0) {
      await notice(['Unternehmen existiert bereits'])
      return
    }
    const addStockID = await addStock(stock)
    if (typeof addStockID === 'number') {
      const completeStock: IStock = {cID: addStockID, ...stock}
      records.stocks.addStock({
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
      v-model="isFormValid"
      validate-on="submit"
      @submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          v-model="formularData.isin"
          :counter="12"
          :label="t('dialogs.addStock.isin')"
          :rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
          autofocus
          required
          variant="outlined"
          @update:modelValue="onIsin"
      />
      <v-text-field
          v-model="formularData.company"
          :disabled="formularData.auto"
          :label="t('dialogs.addStock.company')"
          required
          variant="outlined"
      />
      <v-text-field
          v-model="formularData.wkn"
          :disabled="formularData.auto"
          :label="t('dialogs.addStock.wkn')"
          required
          variant="outlined"
      />
      <v-text-field
          v-model="formularData.symbol"
          :disabled="formularData.auto"
          :label="t('dialogs.addStock.symbol')"
          required
          variant="outlined"
      />
    </v-card-text>
  </v-form>
</template>
