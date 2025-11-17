<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IStock_DB} from '@/types.d'
import {defineExpose} from 'vue'
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
const {update} = useStocksDB()
const {validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {stockFormularData, formRef} = useStockFormular()

const STRINGS = Object.freeze({
  TITLE: t('dialogs.updateStock.title'),
  SUCCESS_ADD: t('dialogs.updateStock.success.add'),
  ERROR_ONCLICK_OK: t('dialogs.updateStock.errors.onClickOk')
})

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
    records.stocks.update(stock)
    await update(stock)
    await notice([STRINGS.SUCCESS_ADD])
    runtime.resetTeleport()
  } catch (e) {
    if (e instanceof Error) {
      log(STRINGS.ERROR_ONCLICK_OK, {error: e.message})
      await notice([STRINGS.ERROR_ONCLICK_OK, e.message])
    } else {
      throw new Error(`${STRINGS.ERROR_ONCLICK_OK}: unknown`)
    }
  }
}
const title = STRINGS.TITLE
defineExpose({onClickOk, title})

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
