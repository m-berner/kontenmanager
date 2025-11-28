<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking_DB, IBooking_Store} from '@/types.d'
import {defineExpose, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'

interface IT {
  STRINGS: Record<string, string>
  MESSAGES: Record<string, string>
}

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {add} = useBookingsDB()
const {validateForm} = useValidation()
const {bookingFormularData, formRef} = useBookingFormular()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)

const T = Object.freeze<IT>({
  MESSAGES: {
    ERROR_ONCLICK_OK: t('messages.onClickOk'),
    SUCCESS_ADD: t('messages.addBooking.success'),
    ERROR_ADD: t('messages.addBooking.error')
  },
  STRINGS: {
    TITLE: t('dialogs.addBooking.title')
  }
})

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
    soliCredit: 0,
    soliDebit: 0,
    taxCredit: 0,
    taxDebit: 0,
    feeCredit: 0,
    feeDebit: 0,
    sourceTaxCredit: 0,
    sourceTaxDebit: 0,
    transactionTaxCredit: 0,
    transactionTaxDebit: 0
  })
}

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    let booking: Omit<IBooking_DB, 'cID'>
    switch (bookingFormularData.bookingTypeId) {
      case 1:
        booking = {
          cBookDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: bookingFormularData.count,
          cSoliCredit: bookingFormularData.soliCredit,
          cSoliDebit: bookingFormularData.soliDebit,
          cTaxCredit: bookingFormularData.taxCredit,
          cTaxDebit: bookingFormularData.taxDebit,
          cFeeCredit: bookingFormularData.feeCredit,
          cFeeDebit: bookingFormularData.feeDebit,
          cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
          cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
          cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
          cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
          cMarketPlace: bookingFormularData.marketPlace
        }
        break
      case 2:
        booking = {
          cBookDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: bookingFormularData.count,
          cSoliCredit: bookingFormularData.soliCredit,
          cSoliDebit: bookingFormularData.soliDebit,
          cTaxCredit: bookingFormularData.taxCredit,
          cTaxDebit: bookingFormularData.taxDebit,
          cFeeCredit: bookingFormularData.feeCredit,
          cFeeDebit: bookingFormularData.feeDebit,
          cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
          cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
          cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
          cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
          cMarketPlace: bookingFormularData.marketPlace
        }
        break
      case 3:
        booking = {
          cBookDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: bookingFormularData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: bookingFormularData.exDate,
          cCount: bookingFormularData.count,
          cSoliCredit: bookingFormularData.soliCredit,
          cSoliDebit: bookingFormularData.soliDebit,
          cTaxCredit: bookingFormularData.taxCredit,
          cTaxDebit: bookingFormularData.taxDebit,
          cFeeCredit: bookingFormularData.feeCredit,
          cFeeDebit: bookingFormularData.feeDebit,
          cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
          cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
          cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
          cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
          cMarketPlace: ''
        }
        break
      default:
        booking = {
          cBookDate: bookingFormularData.bookDate,
          cCredit: bookingFormularData.credit,
          cDebit: bookingFormularData.debit,
          cDescription: bookingFormularData.description,
          cBookingTypeID: bookingFormularData.bookingTypeId,
          cStockID: 0,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DATE.DEFAULT_ISO,
          cCount: 0,
          cSoliCredit: bookingFormularData.soliCredit,
          cSoliDebit: bookingFormularData.soliDebit,
          cTaxCredit: bookingFormularData.taxCredit,
          cTaxDebit: bookingFormularData.taxDebit,
          cFeeCredit: bookingFormularData.feeCredit,
          cFeeDebit: bookingFormularData.feeDebit,
          cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
          cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
          cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
          cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
          cMarketPlace: ''
        }
    }
    const addBookingID = await add(booking)
    if (addBookingID > -1) {
      const completeBooking: IBooking_Store = {cID: addBookingID, ...booking}
      records.bookings.add(completeBooking)
      reset()
      await notice([T.MESSAGES.SUCCESS_ADD])
    } else {
      log('ADD_BOOKING: onClickOk', {error: T.MESSAGES.ERROR_ADD})
      await notice([T.MESSAGES.ERROR_ADD])
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
  log('ADD_BOOKING: onMounted')
  reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <BookingFormular/>
  </v-form>
</template>
