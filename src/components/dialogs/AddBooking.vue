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
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useBookingsDB()
const {validateForm} = useValidation()
const {bookingFormularData, formRef, reset, selected} = useBookingFormular()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)

const T = Object.freeze({
  MESSAGES: {
    ERROR_ONCLICK_OK: t('messages.onClickOk'),
    SUCCESS_ADD: t('messages.addBooking.success'),
    ERROR_ADD: t('messages.addBooking.error')
  },
  STRINGS: {
    TITLE: t('dialogs.addBooking.title')
  }
})

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  const createBooking = (baseData: typeof bookingFormularData, accountId: number, defaultISODate: string): Omit<I_Booking_DB, 'cID'> => {
    const base = {
      cBookDate: baseData.bookDate,
      cCredit: baseData.credit,
      cDebit: baseData.debit,
      cDescription: baseData.description,
      cBookingTypeID: selected.value,
      cAccountNumberID: accountId,
      cSoliCredit: baseData.soliCredit,
      cSoliDebit: baseData.soliDebit,
      cTaxCredit: baseData.taxCredit,
      cTaxDebit: baseData.taxDebit,
      cFeeCredit: baseData.feeCredit,
      cFeeDebit: baseData.feeDebit,
      cSourceTaxCredit: baseData.sourceTaxCredit,
      cSourceTaxDebit: baseData.sourceTaxDebit,
      cTransactionTaxCredit: baseData.transactionTaxCredit,
      cTransactionTaxDebit: baseData.transactionTaxDebit
    }

    const isStockRelated = baseData.bookingTypeId >= 1 && baseData.bookingTypeId <= 3
    const isDividend = baseData.bookingTypeId === 3
    const hasMarketplace = baseData.bookingTypeId >= 1 && baseData.bookingTypeId <= 2

    return {
      ...base,
      cStockID: isStockRelated ? baseData.stockId : 0,
      cCount: isStockRelated ? baseData.count : 0,
      cExDate: isDividend ? baseData.exDate : defaultISODate,
      cMarketPlace: hasMarketplace ? baseData.marketPlace : ''
    }
  }
  try {
    let booking: Omit<I_Booking_DB, 'cID'>
    switch (bookingFormularData.bookingTypeId) {
      case 1:
        booking = createBooking(bookingFormularData, activeAccountId.value, CONS.DATE.DEFAULT_ISO)
        break
      case 2:
        booking = createBooking(bookingFormularData, activeAccountId.value, CONS.DATE.DEFAULT_ISO)
        break
      case 3:
        booking = createBooking(bookingFormularData, activeAccountId.value, CONS.DATE.DEFAULT_ISO)
        break
      default:
        booking = createBooking(bookingFormularData, activeAccountId.value, CONS.DATE.DEFAULT_ISO)
    }
    const addBookingID = await add(booking)
    if (addBookingID === -1) {
      log('ADD_BOOKING: onClickOk', {error: T.MESSAGES.ERROR_ADD})
      await notice([T.MESSAGES.ERROR_ADD])
    }
    const completeBooking: I_Booking_Store = {cID: addBookingID, ...booking}
    records.bookings.add(completeBooking, true)
    reset()
    await notice([T.MESSAGES.SUCCESS_ADD])
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    log(T.MESSAGES.ERROR_ONCLICK_OK, {error: errorMessage})
    await notice([T.MESSAGES.ERROR_ONCLICK_OK, errorMessage])
  }
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
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
