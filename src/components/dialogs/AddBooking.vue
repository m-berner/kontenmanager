<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBooking, IBookingType, IStock} from '@/types.d'
import {defineExpose, onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import CurrencyInput from '@/components/dialogs/childs/CurrencyInput.vue'

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
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {addBooking} = useBookingsDB()
const {valRequiredRules, valDateRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()

const state: IState = reactive({
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
  let booking: Omit<IBooking, 'cID'>
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
          cCredit: state.credit,
          cDebit: state.debit,
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
    const addBookingID = await addBooking(booking)
    if (typeof addBookingID === 'number') {
      const completeBooking: IBooking = {cID: addBookingID, ...booking}
      records.bookings.addBooking(completeBooking)
      await notice([t('dialogs.AddBooking.success')])
      resetState()
    }
  } catch (e) {
    log('ADD_BOOKING: onClickOk', {error: e})
    await notice([t('dialogs.addBooking.error')])
  }
}
const title = t('dialogs.addBooking.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
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
  <v-form
      v-model="state.isFormValid"
      validate-on="submit"
      @submit.prevent>
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
              :label="t('dialogs.addBooking.dateLabel')"
              :rules="valDateRules([t('validators.dateRules', 0)])"
              autofocus
              density="compact"
              required
              type="date"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-select
              v-model="state.bookingTypeId"
              :itemTitle="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
              :itemValue="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
              :items="records.bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
              :label="t('dialogs.addBooking.bookingTypeLabel')"
              :menu=false
              :menuProps="{ maxHeight: 250 }"
              :rules="valRequiredRules([t('validators.requiredRule', 0)])"
              density="compact"
              max-width="300"
              required
              variant="outlined"
              @update:modelValue="(ev) => {console.error('CHANGE', ev)}"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.count"
              :label="t('dialogs.addBooking.countLabel')"
              class="withoutSpinner"
              density="compact"
              type="number"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.unitQuotation"
              :label="t('dialogs.addBooking.unitQuotationLabel')"
              @amount="(a) => { state.unitQuotation = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId > 3"
              v-model="state.credit"
              :label="t('dialogs.addBooking.creditLabel')"
              @amount="(a) => { state.credit = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId > 3"
              v-model="state.debit"
              :label="t('dialogs.addBooking.debitLabel')"
              @amount="(a) => { state.debit = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 1"
              v-model="state.tax"
              :label="t('dialogs.addBooking.taxLabel')"
              @amount="(a) => { state.tax = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 1"
              v-model="state.soli"
              :label="t('dialogs.addBooking.soliLabel')"
              @amount="(a) => { state.soli = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
              v-if="state.bookingTypeId === 3"
              ref="date-input"
              v-model="state.exDate"
              :label="t('dialogs.addBooking.exDateLabel')"
              :rules="valDateRules([t('validators.dateRules', 0)])"
              autofocus
              density="compact"
              required
              type="date"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId === 3"
              v-model="state.sourceTax"
              :label="t('dialogs.addBooking.sourceTaxLabel')"
              @amount="(a) => { state.sourceTax = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-select
              v-if="state.bookingTypeId < 4 && state.bookingTypeId > 0"
              v-model="state.stockId"
              :item-title="CONS.DB.STORES.STOCKS.FIELDS.COMPANY"
              :item-value="CONS.DB.STORES.STOCKS.FIELDS.ID"
              :items="records.stocks.items.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
              :label="t('dialogs.addBooking.stockLabel')"
              :menu=false
              :menu-props="{ maxHeight: 250 }"
              :rules="valRequiredRules([t('validators.requiredRule', 0)])"
              density="compact"
              max-width="300"
              variant="outlined"
          />
        </v-col>
        <v-col>
          <v-select
              v-if="state.bookingTypeId < 3 && state.bookingTypeId > 0"
              v-model="state.marketPlace"
              :items="settings.markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
              :label="t('dialogs.addBooking.marketPlaceLabel')"
              :menu=false
              :menuProps="{ maxHeight: 250 }"
              density="compact"
              max-width="350"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
              v-if="state.bookingTypeId < 3 && state.bookingTypeId > 0"
              v-model="state.fee"
              :label="t('dialogs.addBooking.feeLabel')"
              @amount="(a) => { state.fee = a }"
          />
        </v-col>
        <v-col>
          <CurrencyInput
              v-if="state.bookingTypeId === 1"
              v-model="state.transactionTax"
              :label="t('dialogs.addBooking.transactionTaxLabel')"
              @amount="(a) => { state.transactionTax = a }"
          />
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12">
          <v-text-field
              v-model="state.description"
              :label="t('dialogs.addBooking.descriptionLabel')"
              density="compact"
              required
              variant="outlined"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
