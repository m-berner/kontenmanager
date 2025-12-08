<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_DB, I_Booking_Store} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useBookingsDB()
const {validateForm} = useValidation()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {bookingFormularData, formRef, selected} = useBookingFormular()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)

const T = Object.freeze({
  MESSAGES: {
    ERROR_ONCLICK_OK: t('messages.onClickOk'),
    SUCCESS_UPDATE: t('messages.updateBooking.success')
  },
  STRINGS: {
    TITLE: t('dialogs.updateBooking.title')
  }
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    const booking: I_Booking_Store & I_Booking_DB = {
      cID: bookingFormularData.id,
      cAccountNumberID: activeAccountId.value,
      cStockID: bookingFormularData.stockId,
      cBookingTypeID: selected.value,
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
    await update(booking)
    await notice([T.MESSAGES.SUCCESS_UPDATE])
    runtime.resetOptionsMenuColors()
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
  log('UPDATE_BOOKING: onMounted')
  const bookingIndex = records.bookings.getIndexById(activeId.value)
  if (bookingIndex > -1) {
    const currentBooking = bookingItems.value[bookingIndex]
    selected.value = currentBooking.cBookingTypeID
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
})

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
