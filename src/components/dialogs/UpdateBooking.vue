<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking} from '@/types.d'
import {defineExpose, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import BookingFormular from '@/components/dialogs/forms/BookingFormular.vue'
import {useBookingFormular} from '@/composables/useBookingFormular'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {updateBooking} = useBookingsDB()
const {validateForm} = useValidation()
const {bookingFormularData, formRef} = useBookingFormular()
const records = useRecordsStore()
const settings = useSettings()
const runtime = useRuntime()

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return
  try {
    const booking: IBooking = {
      cID: bookingFormularData.id,
      cAccountNumberID: settings.activeAccountId.value,
      cStockID: bookingFormularData.stockId,
      cBookingTypeID: bookingFormularData.bookingTypeId,
      cDate: bookingFormularData.bookDate,
      cExDate: bookingFormularData.exDate,
      cCount: bookingFormularData.count,
      cDescription: bookingFormularData.description,
      cTransactionTax: bookingFormularData.transactionTax,
      cSourceTax: bookingFormularData.sourceTax,
      cFee: bookingFormularData.fee,
      cTax: bookingFormularData.tax,
      cMarketPlace: bookingFormularData.marketPlace,
      cSoli: bookingFormularData.soli,
      cDebit: bookingFormularData.debit,
      cCredit: bookingFormularData.credit
    }
    records.bookings.update(booking)
    const updateBookingResponse = await updateBooking(booking)
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

onMounted(() => {
  log('UPDATE_BOOKING: onMounted')
  const bookingIndex = records.bookings.getIndexById(runtime.activeId.value)
  if (bookingIndex > -1) {
    const currentBooking = records.bookings.items[bookingIndex]
    Object.assign(bookingFormularData, {
      id: currentBooking.cID,
      bookingTypeId: currentBooking.cBookingTypeID,
      bookDate: currentBooking.cDate,
      debit: currentBooking.cDebit,
      credit: currentBooking.cCredit,
      description: currentBooking.cDescription,
      exDate: currentBooking.cExDate,
      count: currentBooking.cCount,
      accountTypeId: currentBooking.cAccountNumberID,
      stockId: currentBooking.cStockID,
      sourceTax: currentBooking.cSourceTax,
      transactionTax: currentBooking.cTransactionTax,
      tax: currentBooking.cTax,
      fee: currentBooking.cFee,
      soli: currentBooking.cSoli,
      marketPlace: currentBooking.cMarketPlace
    })
  }
})

log('--- UpdateBooking.vue setup ---')
</script>

<template>
  <v-alert v-if="records.bookings.items.length === 0">{{ t('dialogs.updateBooking.message') }}</v-alert>
  <v-form v-else
          ref="formRef"
          validate-on="submit"
          @submit.prevent>
    <BookingFormular/>
  </v-form>
</template>
