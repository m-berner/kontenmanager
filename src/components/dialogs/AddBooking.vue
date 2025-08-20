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
import {useApp} from '@/composables/useApp'
import CurrencyInput from '@/components/helper/CurrencyInput.vue'
import {useSettingsStore} from '@/stores/settings'

interface IState {
  bookDate: string
  exDate: string
  credit: number
  debit: number
  description: string
  count: number
  unitQuotation: number
  bookingTypeId: number
  accountTypeId: number
  stockId: number
  sourceTax: number
  transactionTax: number
  tax: number
  fee: number
  soli: number
  marketPlace: string
  isFormValid: boolean
}

const {t} = useI18n()
const {CONS, log, notice, valRequiredRules, valDateRules} = useApp()
const records = useRecordsStore()
const settings = useSettingsStore()

const state: Reactive<IState> = reactive({
  bookDate: '',
  exDate: '',
  credit: 0,
  debit: 0,
  description: '',
  count: 0,
  unitQuotation: 0,
  bookingTypeId: 0,
  accountTypeId: 0,
  stockId: 0,
  sourceTax: 0,
  transactionTax: 0,
  tax: 0,
  fee: 0,
  soli: 0,
  marketPlace: '',
  isFormValid: false
})

const resetState = () => {
  state.bookDate = ''
  state.exDate = ''
  state.description = ''
  state.debit = 0
  state.credit = 0
  state.count = 0
  state.unitQuotation = 0
  state.bookingTypeId = 0
  state.accountTypeId = -1
  state.stockId = 0
  state.soli = 0
  state.tax = 0
  state.fee = 0
  state.sourceTax = 0
  state.transactionTax = 0
}

const onClickOk = async (): Promise<void> => {
  log('ADD_BOOKING : onClickOk')
  let booking: object = {}
  let costs: number = 0
  let result: number = 0
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
  try {
    costs = state.soli + state.transactionTax + state.tax + state.fee + state.sourceTax
    switch (state.bookingTypeId) {
      case 1:
        result = state.count * state.unitQuotation + costs
        booking = {
          cDate: state.bookDate,
          cCredit: result < 0 ? -result : 0,
          cDebit: result > 0 ? result : 0,
          cDescription: state.description,
          cBookingTypeID: state.bookingTypeId,
          cStockID: state.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: state.count,
          cSoli: state.soli,
          cTax: state.tax,
          cFee: state.fee,
          cSourceTax: state.sourceTax,
          cTransactionTax: state.transactionTax,
          cMarketPlace: state.marketPlace
        }
        break
      case 2:
        result = state.count * state.unitQuotation - costs
        booking = {
          cDate: state.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: state.description,
          cBookingTypeID: state.bookingTypeId,
          cStockID: state.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: CONS.DEFAULTS.DATE,
          cCount: state.count,
          cSoli: state.soli,
          cTax: state.tax,
          cFee: state.fee,
          cSourceTax: state.sourceTax,
          cTransactionTax: state.transactionTax,
          cMarketPlace: state.marketPlace
        }
        break
      case 3:
        result = state.count * state.unitQuotation - costs
        booking = {
          cDate: state.bookDate,
          cCredit: result > 0 ? result : 0,
          cDebit: result < 0 ? -result : 0,
          cDescription: state.description,
          cBookingTypeID: state.bookingTypeId,
          cStockID: state.stockId,
          cAccountNumberID: settings.activeAccountId,
          cExDate: state.exDate,
          cCount: state.count,
          cSoli: state.soli,
          cTax: state.tax,
          cFee: state.fee,
          cSourceTax: state.sourceTax,
          cTransactionTax: state.transactionTax,
          cMarketPlace: ''
        }
        break
      default:
        booking = {
          cDate: state.bookDate,
          cCredit: state.credit === undefined ? 0 : state.credit,
          cDebit: state.debit === undefined ? 0 : state.debit,
          cDescription: state.description,
          cBookingTypeID: state.bookingTypeId,
          cStockID: 0,
          cAccountNumberID: settings.activeAccountId,
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
    const addBookingResponseString = await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.DB__ADD_BOOKING, data: booking
    }))
    const addBookingData: IBooking = JSON.parse(addBookingResponseString).data
    records.addBooking(addBookingData)
    await notice([t('dialogs.AddBooking.success')])
    // NOTE: CurrencyInput ensure 0 instead of null
    resetState()
  } catch (e) {
    console.error(e)
    await notice([t('dialogs.addBooking.error')])
  }
}
const title = t('dialogs.addBooking.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
  // NOTE: CurrencyInput ensure 0 instead of null
  state.debit = 0
  state.credit = 0
  state.soli = 0
  state.tax = 0
  state.fee = 0
  state.sourceTax = 0
  state.transactionTax = 0
  state.bookingTypeId = 0
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-form v-model="state.isFormValid" validate-on="submit">
    <v-container>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field v-if="settings.activeAccountId === -1">
            {{ t('dialogs.addBookingType.message') }}
          </v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-text-field
              ref="date-input"
              v-model="state.bookDate"
              autofocus
              density="compact"
              required
              type="date"
              v-bind:label="t('dialogs.addBooking.dateLabel')"
              v-bind:rules="valDateRules([t('validators.dateRules', 0)])"
              variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-select
              v-model="state.bookingTypeId"
              density="compact"
              max-width="300"
              required
              v-bind:itemTitle="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
              v-bind:itemValue="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
              v-bind:items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
              v-bind:label="t('dialogs.addBooking.bookingTypeLabel')"
              v-bind:menu=false
              v-bind:menuProps="{ maxHeight: 250 }"
              v-bind:rules="valRequiredRules([t('validators.requiredRule', 0)])"
              variant="outlined"
              v-on:update:modelValue="(ev) => {console.error('CHANGE', ev)}"
          ></v-select>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.count"
              class="withoutSpinner"
              density="compact"
              type="number"
              v-bind:label="t('dialogs.addBooking.countLabel')"
              variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.unitQuotation"
              v-bind:label="t('dialogs.addBooking.unitQuotationLabel')"
              v-on:amount="(a) => { state.unitQuotation = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId > 3"
              v-model="state.credit"
              v-bind:label="t('dialogs.addBooking.creditLabel')"
              v-on:amount="(a) => { state.credit = a }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId > 3"
              v-model="state.debit"
              v-bind:label="t('dialogs.addBooking.debitLabel')"
              v-on:amount="(a) => { state.debit = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 1"
              v-model="state.tax"
              v-bind:label="t('dialogs.addBooking.taxLabel')"
              v-on:amount="(a) => { state.tax = a }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 1"
              v-model="state.soli"
              v-bind:label="t('dialogs.addBooking.soliLabel')"
              v-on:amount="(a) => { state.soli = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="state.bookingTypeId === 3"
              ref="date-input"
              v-model="state.exDate"
              autofocus
              density="compact"
              required
              type="date"
              v-bind:label="t('dialogs.addBooking.exDateLabel')"
              v-bind:rules="valDateRules([t('validators.dateRules', 0)])"
              variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId === 3"
              v-model="state.sourceTax"
              v-bind:label="t('dialogs.addBooking.sourceTaxLabel')"
              v-on:amount="(a) => { state.sourceTax = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-select
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.stockId"
              density="compact"
              max-width="300"
              v-bind:item-title="CONS.DB.STORES.STOCKS.FIELDS.COMPANY"
              v-bind:item-value="CONS.DB.STORES.STOCKS.FIELDS.ID"
              v-bind:items="records.stocks.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
              v-bind:label="t('dialogs.addBooking.stockLabel')"
              v-bind:menu=false
              v-bind:menu-props="{ maxHeight: 250 }"
              v-bind:rules="valRequiredRules([t('validators.requiredRule', 0)])"
              variant="outlined"
          ></v-select>
        </v-col>
        <v-col>
          <v-select
              v-if="state.bookingTypeId < 3 && state.bookingTypeId > 0"
              v-model="state.marketPlace"
              density="compact"
              max-width="350"
              v-bind:items="settings.markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
              v-bind:label="t('dialogs.addBooking.marketPlaceLabel')"
              v-bind:menu=false
              v-bind:menuProps="{ maxHeight: 250 }"
          ></v-select>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId < 3 && state.bookingTypeId > 0"
              v-model="state.fee"
              v-bind:label="t('dialogs.addBooking.feeLabel')"
              v-on:amount="(a) => { state.fee = a }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId === 1"
              v-model="state.transactionTax"
              v-bind:label="t('dialogs.addBooking.transactionTaxLabel')"
              v-on:amount="(a) => { state.transactionTax = a }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12">
          <v-text-field
              v-model="state.description"
              density="compact"
              required
              v-bind:label="t('dialogs.addBooking.descriptionLabel')"
              variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
