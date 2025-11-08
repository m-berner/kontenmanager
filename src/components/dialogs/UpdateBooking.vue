<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking_DB, IBooking_Store} from '@/types.d'
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingFormular} from '@/composables/useBookingFormular'
import {useRecordsStore} from '@/stores/records'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'
import {storeToRefs} from 'pinia'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update} = useBookingsDB()
const {validateForm} = useValidation()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {bookingFormularData, formRef} = useBookingFormular()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)

const bookingIndex = records.bookings.getIndexById(activeId.value)
if (bookingIndex > -1) {
  const currentBooking = bookingItems.value[bookingIndex]
  Object.assign(bookingFormularData, {
    id: currentBooking.cID,
    bookingTypeId: currentBooking.cBookingTypeID,
    bookDate: currentBooking.cBookDate,
    debit: currentBooking.cDebit,
    credit: currentBooking.cCredit,
    description: currentBooking.cDescription,
    exDate: currentBooking.cExDate,
    count: currentBooking.cCount,
    accountTypeId: currentBooking.cAccountNumberID,
    stockId: currentBooking.cStockID,
    sourceTaxCredit: currentBooking.cSourceTaxCredit,
    sourceTaxDebit: currentBooking.cSourceTaxDebit,
    transactionTaxCredit: currentBooking.cTransactionTaxCredit,
    transactionTaxDebit: currentBooking.cTransactionTaxDebit,
    taxCredit: currentBooking.cTaxCredit,
    taxDebit: currentBooking.cTaxDebit,
    feeCredit: currentBooking.cFeeCredit,
    feeDebit: currentBooking.cFeeDebit,
    soliCredit: currentBooking.cSoliCredit,
    soliDebit: currentBooking.cSoliDebit,
    marketPlace: currentBooking.cMarketPlace
  })
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return
  console.error(bookingFormularData)
  try {
    const booking: IBooking_Store & IBooking_DB = {
      cID: bookingFormularData.id,
      cAccountNumberID: activeAccountId.value,
      cStockID: bookingFormularData.stockId,
      cBookingTypeID: bookingFormularData.bookingTypeId,
      cBookDate: bookingFormularData.bookDate,
      cExDate: bookingFormularData.exDate,
      cCount: bookingFormularData.count,
      cDescription: bookingFormularData.description,
      cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
      cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
      cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
      cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
      cFeeCredit: bookingFormularData.feeCredit,
      cFeeDebit: bookingFormularData.feeDebit,
      cTaxCredit: bookingFormularData.taxCredit,
      cTaxDebit: bookingFormularData.taxDebit,
      cMarketPlace: bookingFormularData.marketPlace,
      cSoliCredit: bookingFormularData.soliCredit,
      cSoliDebit: bookingFormularData.soliDebit,
      cDebit: bookingFormularData.debit,
      cCredit: bookingFormularData.credit
    }
    records.bookings.update(booking)
    const updateBookingResponse = await update(booking)
    await notice([updateBookingResponse as string])
    runtime.resetOptionsMenuColors()
    runtime.resetTeleport()
  } catch (e) {
    log('UPDATE_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.updateBooking.error')])
  }
}
const title = t('dialogs.updateBooking.title')
defineExpose({onClickOk, title})

log('--- UpdateBooking.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <BookingFormular/>
  </v-form>
</template>
