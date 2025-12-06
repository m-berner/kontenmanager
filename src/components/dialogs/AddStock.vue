<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock_DB} from '@/types'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useStockFormular} from '@/composables/useStockFormular'
import StockFormular from '@/components/dialogs/formulars/StockFormular.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useStocksDB()
const {validateForm} = useValidation()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()
const {stockFormularData, formRef} = useStockFormular()
const T = Object.freeze({
  MESSAGES: {
    SUCCESS_ADD: t('messages.addStock.success'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('dialogs.addStock.title')
  }
})
// TODO show accounting: per year view, entries correct wrong calculations
// TODO export per year
const formDisabled = ref(false)

const reset = (): void => {
  Object.assign(stockFormularData, {
    isin: '',
    company: '',
    symbol: ''
  })
  formDisabled.value = false
}

const onClickOk = async (): Promise<void> => {
  log('ADD_STOCK : onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    const stock: Omit<IStock_DB, 'cID'> = {
      cCompany: stockFormularData.company.trim(),
      cISIN: stockFormularData.isin,
      cSymbol: stockFormularData.symbol,
      cMeetingDay: '',
      cQuarterDay: '',
      cFadeOut: 0,
      cFirstPage: 0,
      cURL: '',
      cAccountNumberID: activeAccountId.value,
      cAskDates: CONS.DATE.DEFAULT_ISO
    }
    const addStockID = await add(stock)
    if (addStockID > 0) {
      const dbStock: IStock_DB = {cID: addStockID, ...stock}
      records.stocks.add(dbStock)
      resetTeleport()
      await notice([T.MESSAGES.SUCCESS_ADD])
    }
  } catch (e) {
    if (e instanceof Error) {
      log(T.MESSAGES.ERROR_ONCLICK_OK, {error: e.message})
      await notice([T.MESSAGES.ERROR_ONCLICK_OK, e.message])
    } else {
      throw new Error(`${T.MESSAGES.ERROR_ONCLICK_OK}: unknown`)
    }
  }
}

const title = T.STRINGS.TITLE
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
    <StockFormular :isUpdate="false"/>
  </v-form>
</template>
