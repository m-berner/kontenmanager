<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking} from '@/types.d'
import type {Ref} from 'vue'
import {defineExpose, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import BookingContainer from '@/components/dialogs/childs/BookingContainer.vue'
import {useBookingContainer} from '@/composables/useBookingContainer'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {addBooking} = useBookingsDB()
const {validateForm} = useValidation()
const {containerData} = useBookingContainer()
const records = useRecordsStore()
const {activeAccountId} = useSettings()

const formRef: Ref<HTMLFormElement | null> = ref(null)

const reset = (): void => {
  Object.assign(containerData, {
    bookDate: '',
    exDate: '',
    description: '',
    debit: 0,
    credit: 0,
    count: 0,
    unitQuotation: 0,
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
    let result: number = 0
    const costs = containerData.soli + containerData.transactionTax + containerData.tax + containerData.fee + containerData.sourceTax
    switch (containerData.bookingTypeId) {
      case 1:
        result = containerData.count * containerData.unitQuotation + costs
        booking = {
          cDate: containerData.bookDate,
          cCredit: result < 0 ? -result : 0,
          cDebit: result > 0 ? result : 0,
          cDescription: containerData.description,
          cBookingTypeID: containerData.bookingTypeId,
          cStockID: containerData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: containerData.count,
          cSoli: containerData.soli,
          cTax: containerData.tax,
          cFee: containerData.fee,
          cSourceTax: containerData.sourceTax,
          cTransactionTax: containerData.transactionTax,
          cMarketPlace: containerData.marketPlace
        }
        break
      case 2:
        result = containerData.count * containerData.unitQuotation - costs
        booking = {
          cDate: containerData.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: containerData.description,
          cBookingTypeID: containerData.bookingTypeId,
          cStockID: containerData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: containerData.count,
          cSoli: containerData.soli,
          cTax: containerData.tax,
          cFee: containerData.fee,
          cSourceTax: containerData.sourceTax,
          cTransactionTax: containerData.transactionTax,
          cMarketPlace: containerData.marketPlace
        }
        break
      case 3:
        result = containerData.count * containerData.unitQuotation - costs
        booking = {
          cDate: containerData.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: containerData.description,
          cBookingTypeID: containerData.bookingTypeId,
          cStockID: containerData.stockId,
          cAccountNumberID: activeAccountId.value,
          cExDate: containerData.exDate,
          cCount: containerData.count,
          cSoli: containerData.soli,
          cTax: containerData.tax,
          cFee: containerData.fee,
          cSourceTax: containerData.sourceTax,
          cTransactionTax: containerData.transactionTax,
          cMarketPlace: ''
        }
        break
      default:
        booking = {
          cDate: containerData.bookDate,
          cCredit: containerData.credit,
          cDebit: containerData.debit,
          cDescription: containerData.description,
          cBookingTypeID: containerData.bookingTypeId,
          cStockID: 0,
          cAccountNumberID: activeAccountId.value,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: 0,
          cSoli: 0,
          cTax: 0,
          cFee: 0,
          cSourceTax: 0,
          cTransactionTax: 0,
          cMarketPlace: ''
        }
    }
    const addBookingID = await addBooking(booking) // TODO minimum limit?
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
    <BookingContainer/>
  </v-form>
</template>
