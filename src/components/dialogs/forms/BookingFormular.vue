<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType, IStock} from '@/types.d'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import {useRecordsStore} from '@/stores/records'
import CurrencyInput from '@/components/dialogs/forms/CurrencyInput.vue'

const {t} = useI18n()
const {CONS} = useApp()
const {dateRules, requiredRules} = useValidation()
const {bookingFormularData} = useBookingFormular()
const {bookingTypes, stocks} = useRecordsStore()
const {markets} = useSettings()
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
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
            v-model="bookingFormularData.bookingTypeId"
            :itemTitle="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :itemValue="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
            :label="t('dialogs.addBooking.bookingTypeLabel')"
            :menu=false
            :menuProps="{ maxHeight: 250 }"
            :rules="requiredRules([t('validators.requiredRules')])"
            density="compact"
            max-width="300"
            variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
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
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId > 3"
            v-model="bookingFormularData.credit"
            :label="t('dialogs.addBooking.creditLabel')"
            @amount="(a) => { bookingFormularData.credit = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId > 3"
            v-model="bookingFormularData.debit"
            :label="t('dialogs.addBooking.debitLabel')"
            @amount="(a) => { bookingFormularData.debit = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1"
            v-model="bookingFormularData.tax"
            :label="t('dialogs.addBooking.taxLabel')"
            @amount="(a) => { bookingFormularData.tax = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1"
            v-model="bookingFormularData.soli"
            :label="t('dialogs.addBooking.soliLabel')"
            @amount="(a) => { bookingFormularData.soli = a }"
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
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId === 3"
            v-model="bookingFormularData.sourceTax"
            :label="t('dialogs.addBooking.sourceTaxLabel')"
            @amount="(a) => { bookingFormularData.sourceTax = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-select
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.stockId"
            :item-title="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.COMPANY"
            :item-value="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID"
            :items="stocks.items.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
            :label="t('dialogs.addBooking.stockLabel')"
            :menu=false
            :menu-props="{ maxHeight: 250 }"
            :rules="requiredRules([t('validators.requiredRules')])"
            density="compact"
            max-width="300"
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
      <v-col cols="6">
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId < 3 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.fee"
            :label="t('dialogs.addBooking.feeLabel')"
            @amount="(a) => { bookingFormularData.fee = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="bookingFormularData.bookingTypeId === 1"
            v-model="bookingFormularData.transactionTax"
            :label="t('dialogs.addBooking.transactionTaxLabel')"
            @amount="(a) => { bookingFormularData.transactionTax = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="bookingFormularData.description"
            :label="t('dialogs.addBooking.descriptionLabel')"
            density="compact"
            required
            variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
