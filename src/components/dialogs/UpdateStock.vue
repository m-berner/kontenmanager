<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock_DB} from '@/types.d'
import {defineExpose, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useStockFormular} from '@/composables/useStockFormular'
import {useRecordsStore} from '@/stores/records'
import StockFormular from '@/components/dialogs/formulars/StockFormular.vue'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update} = useStocksDB()
const {validateForm} = useValidation()
const records = useRecordsStore()
const {activeAccountId} = useSettings()
const runtime = useRuntime()
const {stockFormularData, formRef} = useStockFormular()

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!await validateForm(formRef)) return
  try {
    const stock: IStock_DB = {
      cID: stockFormularData.id,
      cISIN: stockFormularData.isin.replace(/\s/g, '').toUpperCase(),
      cCompany: stockFormularData.company,
      cSymbol: stockFormularData.symbol,
      cMeetingDay: stockFormularData.meetingDay,
      cQuarterDay: stockFormularData.quarterDay,
      cFadeOut: stockFormularData.fadeOut ? 1 : 0,
      cFirstPage: stockFormularData.firstPage ? 1 : 0,
      cURL: stockFormularData.url,
      cAccountNumberID: activeAccountId.value,
      cAskDates: stockFormularData.askDates
    }
    records.stocks.updateStock(stock)
    await update(stock)
    await notice([t('dialogs.updateStock.success')])
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
  const currentStock = records.stocks.getItemById(runtime.activeId.value)
  if (currentStock !== undefined) {
    Object.assign(stockFormularData, {
      id: runtime.activeId.value,
      isin: currentStock.cISIN.replace(/\s/g, '').toUpperCase(),
      company: currentStock.cCompany,
      symbol: currentStock.cSymbol,
      meetingDay: currentStock.cMeetingDay,
      quarterDay: currentStock.cQuarterDay,
      fadeOut: currentStock.cFadeOut === 1,
      firstPage: currentStock.cFirstPage === 1,
      url: currentStock.cURL,
      askDate: currentStock.cAskDates
    })
  } // TODO error notice for user
})

log('--- UpdateStock.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <StockFormular :isUpdate="true"/>
  </v-form>
</template>
