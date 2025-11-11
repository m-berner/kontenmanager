<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType_Store, IStock_Store} from '@/types.d'
import {useI18n} from 'vue-i18n'
import {computed} from 'vue'
import {useApp} from '@/composables/useApp'
import {useSettingsStore} from '@/stores/settings'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import {useRecordsStore} from '@/stores/records'
import CreditDebitFieldset from '@/components/CreditDebitFieldset.vue'

const {t} = useI18n()
const {CONS} = useApp()
const {dateRules} = useValidation()
const {bookingFormularData} = useBookingFormular()
const {bookingTypes, stocks} = useRecordsStore()
const {markets} = useSettingsStore()

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
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field
            v-model="bookingFormularData.bookDate"
            :label="t('dialogs.addBooking.dateLabel')"
            :rules="dateRules([t('validators.dateRules.required')])"
            autofocus
            density="compact"
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-select
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.stockId"
            :item-title="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.COMPANY"
            :item-value="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID"
            :items="stocks.items.sort((a: IStock_Store, b: IStock_Store): number => { return a.cCompany.localeCompare(b.cCompany) })"
            :label="t('dialogs.addBooking.stockLabel')"
            :menu=false
            :menu-props="{ maxHeight: 250 }"
            density="compact"
            max-width="300"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-select
            v-model="bookingFormularData.bookingTypeId"
            :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="bookingTypes.items.sort((a: IBookingType_Store, b: IBookingType_Store): number => { return a.cName.localeCompare(b.cName) })"
            :label="t('dialogs.addBooking.bookingTypeLabel')"
            :menu=false
            :menu-props="{ maxHeight: 250 }"
            density="compact"
            max-width="300"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-text-field
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.count"
            :label="t('dialogs.addBooking.countLabel')"
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
            v-if="bookingFormularData.bookingTypeId === 3"
            ref="date-input"
            v-model="bookingFormularData.exDate"
            :label="t('dialogs.addBooking.exDateLabel')"
            :rules="dateRules([t('validators.dateRules', 0)])"
            autofocus
            density="compact"
            required
            type="date"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <v-select
            v-if="bookingFormularData.bookingTypeId < 3 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.marketPlace"
            :items="markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
            :label="t('dialogs.addBooking.marketPlaceLabel')"
            :menu=false
            :menuProps="{ maxHeight: 250 }"
            density="compact"
            max-width="350"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <CreditDebitFieldset
          v-model="creditDebitModel"
          :legend="t('dialogs.formular.bookingLabel')"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1" justify="center">
      <CreditDebitFieldset
          v-model="taxModel"
          :legend="t('dialogs.addBooking.taxLabel')"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1" justify="center">
      <CreditDebitFieldset
          v-model="soliModel"
          :legend="t('dialogs.addBooking.soliLabel')"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId === 3" justify="center">
      <CreditDebitFieldset
          v-model="sourceTaxModel"
          :legend="t('dialogs.addBooking.sourceTaxLabel')"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 3 && bookingFormularData.bookingTypeId > 0" justify="center">
      <CreditDebitFieldset
          v-model="feeModel"
          :legend="t('dialogs.addBooking.feeLabel')"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId === 1" justify="center">
      <CreditDebitFieldset
          v-model="transactionTaxModel"
          :legend="t('dialogs.addBooking.transactionTaxLabel')"/>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="bookingFormularData.description"
            :label="t('dialogs.addBooking.descriptionLabel')"
            density="compact"
            type="text"
            variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
