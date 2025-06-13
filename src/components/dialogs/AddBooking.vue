<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useAppApi} from '@/pages/background'
import CurrencyInput from '@/components/helper/CurrencyInput.vue'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {notice, VALIDATORS} = useAppApi()
const records = useRecordsStore()
const settings = useSettingsStore()
const formRef = useTemplateRef('form-ref')
const {CONS, log} = useAppApi()

const state = reactive({
  _date: '',
  _ex_date: '',
  _credit: 0,
  _debit: 0,
  _description: '',
  _count: 0,
  _unit_quotation: 0,
  _booking_type_id: -1,
  _account_type_id: -1,
  _stock_id: 0,
  _source_tax: 0,
  _transaction_tax: 0,
  _tax: 0,
  _fee: 0,
  _soli: 0,
  _market_place: ''
})

const ok = async (): Promise<void> => {
  log('ADD_BOOKING: ok')
  let booking: object = {}
  let costs: number = 0
  let result: number = 0
  const formIs = await formRef.value!.validate()
  if (formIs.valid) {
    try {
      costs = state._soli + state._transaction_tax + state._tax + state._fee + state._source_tax
      switch (state._booking_type_id) {
        case 1:
          result = state._count*state._unit_quotation + costs
          booking = {
            cDate: state._date,
            cCredit: result < 0 ? -result : 0,
            cDebit: result > 0 ? result : 0,
            cDescription: state._description,
            cBookingTypeID: state._booking_type_id,
            cStockID: state._stock_id,
            cAccountNumberID: settings.activeAccountId,
            cExDate: CONS.DEFAULTS.DATE,
            cCount: state._count,
            cSoli: state._soli,
            cTax: state._tax,
            cFee: state._fee,
            cSourceTax: state._source_tax,
            cTransactionTax: state._transaction_tax,
            cMarketPlace: state._market_place
          }
          break
        case 2:
          result = state._count*state._unit_quotation - costs
          booking = {
            cDate: state._date,
            cCredit: result > 0 ? result : 0,
            cDebit: result < 0 ? -result : 0,
            cDescription: state._description,
            cBookingTypeID: state._booking_type_id,
            cStockID: state._stock_id,
            cAccountNumberID: settings.activeAccountId,
            cExDate: CONS.DEFAULTS.DATE,
            cCount: state._count,
            cSoli: state._soli,
            cTax: state._tax,
            cFee: state._fee,
            cSourceTax: state._source_tax,
            cTransactionTax: state._transaction_tax,
            cMarketPlace: state._market_place
          }
          break
        case 3:
          result = state._count*state._unit_quotation - costs
          booking = {
            cDate: state._date,
            cCredit: result > 0 ? result : 0,
            cDebit: result < 0 ? -result : 0,
            cDescription: state._description,
            cBookingTypeID: state._booking_type_id,
            cStockID: state._stock_id,
            cAccountNumberID: settings.activeAccountId,
            cExDate: state._ex_date,
            cCount: state._count,
            cSoli: state._soli,
            cTax: state._tax,
            cFee: state._fee,
            cSourceTax: state._source_tax,
            cTransactionTax: state._transaction_tax,
            cMarketPlace: ''
          }
          break
        default:
          booking = {
            cDate: state._date,
            cCredit: state._credit === null ? 0 : state._credit,
            cDebit: state._debit === null ? 0 : state._debit,
            cDescription: state._description,
            cBookingTypeID: state._booking_type_id,
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
      await browser.runtime.sendMessage({
        type: CONS.MESSAGES.DB__ADD_BOOKING, data: booking
      })
      // NOTE: CurrencyInput ensure 0 instead of null
      state._debit = 0
      state._credit = 0
      state._soli = 0
      state._tax = 0
      state._fee = 0
      state._source_tax = 0
      state._transaction_tax = 0
      formRef.value!.reset()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.addBooking.error')])
    }
  }
}
const title = t('dialogs.addBooking.title')

defineExpose({ok, title})

onMounted(() => {
  log('ADD_BOOKING: onMounted')
  // NOTE: CurrencyInput ensure 0 instead of null
  state._debit = 0
  state._credit = 0
  state._soli = 0
  state._tax = 0
  state._fee = 0
  state._source_tax = 0
  state._transaction_tax = 0
  formRef.value!.reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
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
            v-model="state._date"
            autofocus
            density="compact"
            required
            type="date"
            v-bind:label="t('dialogs.addBooking.dateLabel')"
            v-bind:rules="VALIDATORS.dateRules([t('validators.dateRules', 0)])"
            variant="outlined"
            v-on:focus="formRef?.resetValidation"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-select
            v-model="state._booking_type_id"
            density="compact"
            max-width="300"
            required
            v-bind:item-title="CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            v-bind:item-value="CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID"
            v-bind:items="records.bookingTypes.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
            v-bind:label="t('dialogs.addBooking.bookingTypeLabel')"
            v-bind:menu=false
            v-bind:menu-props="{ maxHeight: 250 }"
            v-bind:rules="VALIDATORS.requiredRule([t('validators.requiredRule', 0)])"
            variant="outlined"
            v-on:update:modelValue="(ev) => {console.error('CHANGE', ev)}"
          ></v-select>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
            v-if="state._booking_type_id < 4 && state._booking_type_id > 0"
            v-model="state._count"
            class="withoutSpinner"
            density="compact"
            type="number"
            v-bind:label="t('dialogs.addBooking.countLabel')"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col>
          <CurrencyInput
            v-if="state._booking_type_id < 4 && state._booking_type_id > 0"
            v-model="state._unit_quotation"
            v-bind:label="t('dialogs.addBooking.unitQuotationLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0} }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
            v-if="state._booking_type_id > 3"
            v-model="state._credit"
            v-bind:label="t('dialogs.addBooking.creditLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
            v-if="state._booking_type_id > 3"
            v-model="state._debit"
            v-bind:label="t('dialogs.addBooking.debitLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
            v-if="state._booking_type_id < 4 && state._booking_type_id > 1"
            v-model="state._tax"
            v-bind:label="t('dialogs.addBooking.taxLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
            v-if="state._booking_type_id < 4 && state._booking_type_id > 1"
            v-model="state._soli"
            v-bind:label="t('dialogs.addBooking.soliLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-text-field
            v-if="state._booking_type_id === 3"
            ref="date-input"
            v-model="state._ex_date"
            autofocus
            density="compact"
            required
            type="date"
            v-bind:label="t('dialogs.addBooking.exDateLabel')"
            v-bind:rules="VALIDATORS.dateRules([t('validators.dateRules', 0)])"
            variant="outlined"
            v-on:focus="formRef?.resetValidation"
          ></v-text-field>
        </v-col>
        <v-col>
          <CurrencyInput
            v-if="state._booking_type_id === 3"
            v-model="state._source_tax"
            v-bind:label="t('dialogs.addBooking.sourceTaxLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <v-select
            v-if="state._booking_type_id < 4 && state._booking_type_id > 0"
            v-model="state._stock_id"
            density="compact"
            max-width="300"
            v-bind:item-title="CONS.DB.STORES.STOCKS.FIELDS.COMPANY"
            v-bind:item-value="CONS.DB.STORES.STOCKS.FIELDS.ID"
            v-bind:items="records.stocks.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
            v-bind:label="t('dialogs.addBooking.stockLabel')"
            v-bind:menu=false
            v-bind:menu-props="{ maxHeight: 250 }"
            v-bind:rules="VALIDATORS.requiredRule([t('validators.requiredRule', 0)])"
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col>
          <v-select
            v-if="state._booking_type_id < 3 && state._booking_type_id > 0"
            v-model="state._market_place"
            density="compact"
            max-width="300"
            v-bind:items="settings.markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
            v-bind:label="t('dialogs.addBooking.marketPlaceLabel')"
            v-bind:menu=false
            v-bind:menu-props="{ maxHeight: 250 }"
            variant="outlined"
          ></v-select>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="6">
          <CurrencyInput
            v-if="state._booking_type_id < 3 && state._booking_type_id > 0"
            v-model="state._fee"
            v-bind:label="t('dialogs.addBooking.feeLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
        <v-col>
          <CurrencyInput
            v-if="state._booking_type_id === 1"
            v-model="state._transaction_tax"
            v-bind:label="t('dialogs.addBooking.transactionTaxLabel')"
            v-bind:options="{ currency: 'EUR', valueRange: {min: 0}  }"
          ></CurrencyInput>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12">
          <v-text-field
            v-model="state._description"
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
