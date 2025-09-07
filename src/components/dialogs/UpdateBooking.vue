<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking, IBookingType} from '@/types.d'
import {defineExpose, onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import CurrencyInput from '@/components/dialogs/childs/CurrencyInput.vue'

interface IState {
  id: number
  bookingTypeId: number
  credit: number
  debit: number
  date: string
  description: string
  isFormValid: boolean
}

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {updateBooking} = useBookingsDB()
const {valPositiveIntegerRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const currentBooking = records.bookings.items[records.bookings.getBookingById(runtime.activeId)]
const state: IState = reactive({
  id: currentBooking.cID,
  bookingTypeId: currentBooking.cBookingTypeID,
  date: currentBooking.cDate,
  debit: currentBooking.cDebit,
  credit: currentBooking.cCredit,
  description: currentBooking.cDescription,
  isFormValid: false
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
  try {
    const booking: IBooking = {
      cID: state.id,
      cAccountNumberID: settings.activeAccountId,
      cStockID: currentBooking.cStockID,
      cBookingTypeID: state.bookingTypeId,
      cDate: state.date,
      cExDate: currentBooking.cExDate,
      cCount: currentBooking.cCount,
      cDescription: state.description,
      cTransactionTax: currentBooking.cTransactionTax,
      cSourceTax: currentBooking.cSourceTax,
      cFee: currentBooking.cFee,
      cTax: currentBooking.cTax,
      cMarketPlace: currentBooking.cMarketPlace,
      cSoli: currentBooking.cSoli,
      cDebit: state.debit,
      cCredit: state.credit
    }
    records.bookings.updateBooking(booking)
    records.bookings.sumBookings()
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
      v-model="state.isFormValid"
      validate-on="submit"
      @submit.prevent>
    <v-container>
      <v-row>
        <v-text-field
            v-model="state.date"
            :label="t('dialogs.updateBooking.dateLabel')"
            autofocus
            required
            type="date"
            variant="outlined"
        />
      </v-row>
      <v-row>
        <v-select
            v-model="state.bookingTypeId"
            :itemTitle="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :itemValue="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="records.bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
            :label="t('dialogs.addBooking.bookingTypeLabel')"
            :menu=false
            :menuProps="{ maxHeight: 250 }"
            :rules="valPositiveIntegerRules([t('dialogs.updateBooking.validators[0]')])"
            density="compact"
            maxWidth="300"
            required
            validate-on="input"
            variant="outlined"
            @update:modelValue="(ev) => {console.error('CHANGE', ev, state.bookingTypeId)}"
        />
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <CurrencyInput
              v-model="state.credit"
              :label="t('dialogs.addBooking.creditLabel')"
              @amount="(a) => { state.credit = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-model="state.debit"
              :label="t('dialogs.addBooking.debitLabel')"
              @amount="(a) => { state.debit = a }"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
            v-model="state.description"
            :label="t('dialogs.addBooking.descriptionLabel')"
            density="compact"
            required
            variant="outlined"
        />
      </v-row>
    </v-container>
  </v-form>
</template>
