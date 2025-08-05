<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onBeforeMount, onMounted, type Reactive, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/apis/useApp'
import {useRuntimeStore} from '@/stores/runtime'
import CurrencyInput from '@/components/helper/CurrencyInput.vue'
import {CurrencyDisplay} from 'vue-currency-input'

interface IState {
  id: number
  bookingTypeId: number
  credit: number
  debit: number
  date: string
  description: string
}

let currentBooking: IBooking
const {t} = useI18n()
const {CONS, getUI, log, notice, valDateRules, valRequiredRules} = useApp()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()
const settings = useSettingsStore()
const runtime = useRuntimeStore()

const state: Reactive<IState> = reactive({
  id: -1,
  bookingTypeId: -1,
  date: '',
  description: '',
  debit: 0,
  credit: 0
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_BOOKING : onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
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
}
const title = t('dialogs.updateBooking.title')
defineExpose({onClickOk, title})

onBeforeMount(() => {
  currentBooking = records.bookings[records.getBookingById(runtime.activeId)]
})

onMounted(() => {
  log('UPDATE_BOOKING: onMounted')
  state.id = currentBooking.cID
  state.bookingTypeId = currentBooking.cBookingTypeID
  state.date = currentBooking.cDate
  state.debit = currentBooking.cDebit
  state.credit = currentBooking.cCredit
  state.description = currentBooking.cDescription
})

log('--- UpdateBooking.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-container>
      <v-row>
        <v-text-field
          v-model="state.date"
          autofocus
          required
          type="date"
          v-bind:label="t('dialogs.updateBooking.dateLabel')"
          v-bind:rules="valDateRules([t('validators.dateRules', 0)])"
          variant="outlined"
        ></v-text-field>
      </v-row>
      <v-row>
        <v-select
          v-model="state.bookingTypeId"
          density="compact"
          max-width="300"
          required
          v-bind:item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
          v-bind:item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
          v-bind:items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
          v-bind:label="t('dialogs.addBooking.bookingTypeLabel')"
          v-bind:menu=false
          v-bind:menu-props="{ maxHeight: 250 }"
          v-bind:rules="valRequiredRules([t('validators.requiredRule', 0)])"
          variant="outlined"
          v-on:update:modelValue="(ev) => {console.error('CHANGE', ev)}"
        ></v-select>
      </v-row>
      <v-row cols="2" sm="2">
        <v-col>
          <CurrencyInput
            v-model="state.credit"
            v-bind:label="t('dialogs.addBooking.creditLabel')"
            v-bind:options="{ currency: getUI().currency, currencyDisplay: CurrencyDisplay.hidden, hideNegligibleDecimalDigitsOnFocus: true, hideGroupingSeparatorOnFocus: true, precision: { min: 2, max: 5 }, valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
            v-model="state.debit"
            v-bind:label="t('dialogs.addBooking.debitLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
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
