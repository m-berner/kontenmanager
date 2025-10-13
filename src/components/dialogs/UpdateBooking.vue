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
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import BookingContainer from '@/components/dialogs/childs/BookingContainer.vue'
import {useBookingContainer} from '@/composables/useBookingContainer'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {updateBooking} = useBookingsDB()
const {validateForm} = useValidation()
const {containerData} = useBookingContainer()
const records = useRecordsStore()
const settings = useSettings()
const runtime = useRuntime()

const currentBooking = records.bookings.items[records.bookings.getIndexById(runtime.activeId.value)]
containerData.id = currentBooking.cID
containerData.bookingTypeId = currentBooking.cBookingTypeID
containerData.bookDate = currentBooking.cDate
containerData.debit = currentBooking.cDebit
containerData.credit = currentBooking.cCredit
containerData.description = currentBooking.cDescription
containerData.exDate = ''
containerData.count = 0
containerData.unitQuotation = 0
containerData.accountTypeId = 0
containerData.stockId = 0
containerData.sourceTax = 0
containerData.transactionTax = 0
containerData.tax = 0
containerData.fee = 0
containerData.soli = 0
containerData.marketPlace = ''
const formRef: Ref<HTMLFormElement | null> = ref(null)

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const booking: IBooking = {
      cID: containerData.id,
      cAccountNumberID: settings.activeAccountId.value,
      cStockID: currentBooking.cStockID,
      cBookingTypeID: containerData.bookingTypeId,
      cDate: containerData.bookDate,
      cExDate: currentBooking.cExDate,
      cCount: currentBooking.cCount,
      cDescription: containerData.description,
      cTransactionTax: currentBooking.cTransactionTax,
      cSourceTax: currentBooking.cSourceTax,
      cFee: currentBooking.cFee,
      cTax: currentBooking.cTax,
      cMarketPlace: currentBooking.cMarketPlace,
      cSoli: currentBooking.cSoli,
      cDebit: containerData.debit,
      cCredit: containerData.credit
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
})

log('--- UpdateBooking.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <BookingContainer/>
  </v-form>
</template>
