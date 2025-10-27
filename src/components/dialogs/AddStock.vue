<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock_DB} from '@/types.d'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useStockFormular} from '@/composables/useStockFormular'
import StockFormular from '@/components/dialogs/formulars/StockFormular.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {addStock} = useStocksDB()
const {validateForm} = useValidation()
const {activeAccountId} = useSettings()
const {resetTeleport} = useRuntime()
const records = useRecordsStore()
const {stockFormularData, formRef} = useStockFormular()

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
    const addStockID = await addStock(stock)
    if (addStockID > 0) {
      const dbStock: IStock_DB = {cID: addStockID, ...stock}
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
// TODO update button in Company Content...
// TODO Setting button also in company view
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
