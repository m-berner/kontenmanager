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
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import {useRecordsStore} from '@/stores/records'
import BookingFormular from '@/components/dialogs/forms/BookingFormular.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {addBooking} = useBookingsDB()
const {validateForm} = useValidation()
const {bookingFormularData, formRef} = useBookingFormular()
const records = useRecordsStore()
const {activeAccountId} = useSettings()

const reset = (): void => {
  Object.assign(bookingFormularData, {
    bookDate: '',
    exDate: '',
    description: '',
    debit: 0,
    credit: 0,
    count: 0,
    bookingTypeId: 0,
    accountTypeId: -1,
    stockId: 0,
    soli: 0,
    tax: 0,
    fee: 0,
    sourceTax: 0,
    transactionTax: 0
  })
}
const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    let booking: Omit<IBooking, 'cID'>
    switch (bookingFormularData.bookingTypeId) {
      case 1:
        booking = {
          cDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: bookingFormularData.count,
          cSoli: bookingFormularData.soli,
          cTax: bookingFormularData.tax,
          cFee: bookingFormularData.fee,
          cSourceTax: bookingFormularData.sourceTax,
          cTransactionTax: bookingFormularData.transactionTax,
          cMarketPlace: bookingFormularData.marketPlace
        }
        break
      case 2:
        booking = {
          cDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: bookingFormularData.count,
          cSoli: bookingFormularData.soli,
          cTax: bookingFormularData.tax,
          cFee: bookingFormularData.fee,
          cSourceTax: bookingFormularData.sourceTax,
          cTransactionTax: bookingFormularData.transactionTax,
          cMarketPlace: bookingFormularData.marketPlace
        }
        break
      case 3:
        booking = {
          cDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: bookingFormularData.exDate,
          cCount: bookingFormularData.count,
          cSoli: bookingFormularData.soli,
          cTax: bookingFormularData.tax,
          cFee: bookingFormularData.fee,
          cSourceTax: bookingFormularData.sourceTax,
          cTransactionTax: bookingFormularData.transactionTax,
          cMarketPlace: ''
        }
        break
      default:
        booking = {
          cDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: 0,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: 0,
          cSoli: 0,
          cTax: 0,
          cFee: 0,
          cSourceTax: 0,
          cTransactionTax: 0,
          cMarketPlace: ''
        }
    }
    const addBookingID = await addBooking(booking) // TODO minimum limit 0, -1?
    if (addBookingID > 0) {
      const completeBooking: IBooking = {cID: addBookingID, ...booking}
      records.bookings.add(completeBooking)
      reset()
      await notice([t('dialogs.addBooking.success')])
    } //TODO user notice in case it failed
  } catch (e) {
    log('ADD_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.addBooking.catch')])
  }
}
const title = t('dialogs.addBooking.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
  reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-alert v-if="activeAccountId === -1">{{ t('dialogs.addBooking.message') }}</v-alert>
  <v-form v-else
          ref="formRef"
          validate-on="submit"
          @submit.prevent>
    <BookingFormular/>
  </v-form>
</template>
