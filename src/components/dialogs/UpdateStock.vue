<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Stock_DB} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useBrowser} from '@/composables/useBrowser'
import {useStockFormular} from '@/composables/useStockFormular'
import {useStocksDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useApp} from '@/composables/useApp'
import StockFormular from '@/components/dialogs/formulars/StockFormular.vue'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useStocksDB()
const {validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {stockFormularData, formRef} = useStockFormular()

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_UPDATE: t('messages.updateStock.success'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('dialogs.updateStock.title')
  }
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_STOCK : onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    const stock: I_Stock_DB = {
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
    records.stocks.update(stock)
    await update(stock)
    await notice([T.MESSAGES.SUCCESS_UPDATE])
    runtime.resetTeleport()
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    log(T.MESSAGES.ERROR_ONCLICK_OK, {error: errorMessage})
    await notice([T.MESSAGES.ERROR_ONCLICK_OK, errorMessage])
  }
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
  log('UPDATE_STOCK_FORMULAR: onBeforeMount')
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
