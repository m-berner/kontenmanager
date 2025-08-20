<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, type Reactive, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useRuntimeStore} from '@/stores/runtime'
import CurrencyInput from '@/components/helper/CurrencyInput.vue'

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
const {CONS, log, notice, valPositiveIntegerRules} = useApp()
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const currentBooking = records.bookings[records.getBookingById(runtime.activeId)]
const state: Reactive<IState> = reactive({
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
    records.updateBooking(booking)
    records.sumBookings()
    const updateBookingResponseString = await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.DB__UPDATE_BOOKING,
      data: booking
    }))
    const updateBookingResponse = JSON.parse(updateBookingResponseString)
    await notice([updateBookingResponse.data])
    runtime.resetOptionsMenuColors()
    runtime.resetTeleport()
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.updateBooking.error')])
  }
}
const title = t('dialogs.updateBooking.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('UPDATE_BOOKING: onMounted')
  //runtime.setCredit(currentBooking.cCredit)
  // currentBooking = records.bookings[records.getBookingById(runtime.activeId)]
  // state.id = currentBooking.cID
  // state.bookingTypeId = currentBooking.cBookingTypeID
  // state.date = currentBooking.cDate
  // state.debit = currentBooking.cDebit
  // state.credit = currentBooking.cCredit
  // state.description = currentBooking.cDescription
})

log('--- UpdateBooking.vue setup ---')
</script>

<template>
  <v-form v-model="state.isFormValid" validate-on="submit">
    <v-container>
      <v-row>
        <v-text-field
            v-model="state.date"
            autofocus
            required
            type="date"
            v-bind:label="t('dialogs.updateBooking.dateLabel')"
            variant="outlined"
        ></v-text-field>
      </v-row>
      <v-row>
        <v-select
            v-model="state.bookingTypeId"
            density="compact"
            maxWidth="300"
            required
            v-bind:itemTitle="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            v-bind:itemValue="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
            v-bind:items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
            v-bind:label="t('dialogs.addBooking.bookingTypeLabel')"
            v-bind:menu=false
            v-bind:menuProps="{ maxHeight: 250 }"
            v-bind:rules="valPositiveIntegerRules([t('dialogs.updateBooking.validators[0]')])"
            validate-on="input"
            variant="outlined"
            v-on:update:modelValue="(ev) => {console.error('CHANGE', ev, state.bookingTypeId)}"
        ></v-select>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <CurrencyInput
              v-model="state.credit"
              v-bind:label="t('dialogs.addBooking.creditLabel')"
              v-on:amount="(a) => { state.credit = a }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
              v-model="state.debit"
              v-bind:label="t('dialogs.addBooking.debitLabel')"
              v-on:amount="(a) => { state.debit = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
            v-model="state.description"
            density="compact"
            required
            v-bind:label="t('dialogs.addBooking.descriptionLabel')"
            variant="outlined"
        ></v-text-field>
      </v-row>
    </v-container>
  </v-form>
</template>
