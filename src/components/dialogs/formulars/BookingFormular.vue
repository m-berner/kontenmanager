<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {computed} from 'vue'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import CreditDebitFieldset from '@/components/CreditDebitFieldset.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {dateRules, positiveBookingType} = useValidation()
const {bookingFormularData, selected} = useBookingFormular()
const {bookingTypes, stocks} = useRecordsStore()
const {markets} = useSettingsStore()

const T = Object.freeze({
  STRINGS: {
    DATE_LABEL: t('dialogs.bookingFormular.dateLabel'),
    STOCK_LABEL: t('dialogs.bookingFormular.stockLabel'),
    BOOKING_TYPE_LABEL: t('dialogs.bookingFormular.bookingTypeLabel'),
    COUNT_LABEL: t('dialogs.bookingFormular.countLabel'),
    EX_DATE_LABEL: t('dialogs.bookingFormular.exDateLabel'),
    MARKET_PLACE_LABEL: t('dialogs.bookingFormular.marketPlaceLabel'),
    BOOKING_LABEL: t('dialogs.bookingFormular.bookingLabel'),
    TAX_LABEL: t('dialogs.bookingFormular.taxLabel'),
    SOLI_LABEL: t('dialogs.bookingFormular.soliLabel'),
    SOURCE_TAX_LABEL: t('dialogs.bookingFormular.sourceTaxLabel'),
    FEE_LABEL: t('dialogs.bookingFormular.feeLabel'),
    TRANSACTION_TAX_LABEL: t('dialogs.bookingFormular.transactionTaxLabel'),
    DESCRIPTION_LABEL: t('dialogs.bookingFormular.descriptionLabel')
  },
  DATE_RULES: [t('validators.dateRules.required')],
  BOOKING_TYPE_RULES: [t('validators.bookingTypeRules')]
})

const creditDebitModel = computed({
  get: () => ({credit: bookingFormularData.credit, debit: bookingFormularData.debit}),
  set: (val: { credit: number, debit: number }) => {
    bookingFormularData.credit = val.credit
    bookingFormularData.debit = val.debit
  }
})
const taxModel = computed({
  get: () => ({credit: bookingFormularData.taxCredit, debit: bookingFormularData.taxDebit}),
  set: (val) => {
    bookingFormularData.taxCredit = val.credit
    bookingFormularData.taxDebit = val.debit
  }
})
const soliModel = computed({
  get: () => ({credit: bookingFormularData.soliCredit, debit: bookingFormularData.soliDebit}),
  set: (val) => {
    bookingFormularData.soliCredit = val.credit
    bookingFormularData.soliDebit = val.debit
  }
})
const sourceTaxModel = computed({
  get: () => ({credit: bookingFormularData.sourceTaxCredit, debit: bookingFormularData.sourceTaxDebit}),
  set: (val) => {
    bookingFormularData.sourceTaxCredit = val.credit
    bookingFormularData.sourceTaxDebit = val.debit
  }
})
const transactionTaxModel = computed({
  get: () => ({credit: bookingFormularData.transactionTaxCredit, debit: bookingFormularData.transactionTaxDebit}),
  set: (val) => {
    bookingFormularData.transactionTaxCredit = val.credit
    bookingFormularData.transactionTaxDebit = val.debit
  }
})
const feeModel = computed({
  get: () => ({credit: bookingFormularData.feeCredit, debit: bookingFormularData.feeDebit}),
  set: (val) => {
    bookingFormularData.feeCredit = val.credit
    bookingFormularData.feeDebit = val.debit
  }
})
const isStockBookingType = computed(() => selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.BUY || selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.SELL || selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.DIVIDEND)
const isDividendType = computed(() => selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.DIVIDEND)
const isBuySellType = computed(() => selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.BUY || selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.SELL)
const isBuyType = computed(() => selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.BUY)
const isDividendSellType = computed(() => selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.SELL || selected.value === CONS.INDEXED_DB.STORES.BOOKING_TYPES.DIVIDEND)
const sortedStocks = computed(() => [...stocks.items].sort((a, b) => a.cCompany.localeCompare(b.cCompany)))
const sortedBookingTypes = computed(() => [{cID: CONS.INDEXED_DB.STORES.BOOKING_TYPES.NONE, cName: '', cAccountNumberID: null}, ...bookingTypes.items].sort((a, b) => a.cName.localeCompare(b.cName)))
const sortedMarkets = computed(() => [...markets].sort((a, b) => a.localeCompare(b)))

log('--- BookingFormular.vue setup ---')
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field
            v-model="bookingFormularData.bookDate"
            :label="T.STRINGS.DATE_LABEL"
            :rules="dateRules(T.DATE_RULES)"
            autofocus
            density="compact"
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-select
            v-if="isStockBookingType"
            v-model="bookingFormularData.stockId"
            :item-title="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.COMPANY"
            :item-value="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID"
            :items="sortedStocks"
            :label="T.STRINGS.STOCK_LABEL"
            clearable
            density="compact"
            max-width="300"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-select
            v-model="selected"
            :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="sortedBookingTypes"
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
            clearable
            :rules="positiveBookingType(T.BOOKING_TYPE_RULES)"
            density="compact"
            max-width="300"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-text-field
            v-if="isStockBookingType"
            v-model="bookingFormularData.count"
            :label="T.STRINGS.COUNT_LABEL"
            class="withoutSpinner"
            density="compact"
            type="number"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-text-field
            v-if="isDividendType"
            ref="date-input"
            v-model="bookingFormularData.exDate"
            :label="T.STRINGS.EX_DATE_LABEL"
            :rules="dateRules(T.DATE_RULES)"
            autofocus
            density="compact"
            required
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-select
            v-if="isBuySellType"
            v-model="bookingFormularData.marketPlace"
            :items="sortedMarkets"
            :label="T.STRINGS.MARKET_PLACE_LABEL"
            density="compact"
            max-width="350"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <CreditDebitFieldset
          v-model="creditDebitModel"
          :legend="T.STRINGS.BOOKING_LABEL"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="taxModel"
          :legend="T.STRINGS.TAX_LABEL"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="soliModel"
          :legend="T.STRINGS.SOLI_LABEL"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="sourceTaxModel"
          :legend="T.STRINGS.SOURCE_TAX_LABEL"/>
    </v-row>
    <v-row v-if="isBuySellType" justify="center">
      <CreditDebitFieldset
          v-model="feeModel"
          :legend="T.STRINGS.FEE_LABEL"/>
    </v-row>
    <v-row v-if="isBuyType" justify="center">
      <CreditDebitFieldset
          v-model="transactionTaxModel"
          :legend="T.STRINGS.TRANSACTION_TAX_LABEL"/>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="bookingFormularData.description"
            :label="T.STRINGS.DESCRIPTION_LABEL"
            density="compact"
            type="text"
            variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
