<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IBookingType, IStock} from '@/types.d'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useValidation} from '@/composables/useValidation'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import CurrencyInput from '@/components/dialogs/childs/CurrencyInput.vue'
import {useBookingContainer} from '@/composables/useBookingContainer'

const {t} = useI18n()
const {CONS} = useApp()
const {dateRules, requiredRules} = useValidation()
const {containerData} = useBookingContainer()
const records = useRecordsStore()
const settings = useSettingsStore()
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <v-text-field
            v-model="containerData.bookDate"
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
            v-model="containerData.bookingTypeId"
            :itemTitle="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :itemValue="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="records.bookingTypes.items.sort((a: IBookingType, b: IBookingType): number => { return a.cName.localeCompare(b.cName) })"
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
            v-if="containerData.bookingTypeId < 4 && containerData.bookingTypeId > 0"
            v-model="containerData.count"
            :label="t('dialogs.addBooking.countLabel')"
            class="withoutSpinner"
            density="compact"
            type="number"
            variant="outlined"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="containerData.bookingTypeId < 4 && containerData.bookingTypeId > 0"
            v-model="containerData.unitQuotation"
            :label="t('dialogs.addBooking.unitQuotationLabel')"
            @amount="(a) => { containerData.unitQuotation = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <CurrencyInput
            v-if="containerData.bookingTypeId > 3"
            v-model="containerData.credit"
            :label="t('dialogs.addBooking.creditLabel')"
            @amount="(a) => { containerData.credit = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="containerData.bookingTypeId > 3"
            v-model="containerData.debit"
            :label="t('dialogs.addBooking.debitLabel')"
            @amount="(a) => { containerData.debit = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <CurrencyInput
            v-if="containerData.bookingTypeId < 4 && containerData.bookingTypeId > 1"
            v-model="containerData.tax"
            :label="t('dialogs.addBooking.taxLabel')"
            @amount="(a) => { containerData.tax = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="containerData.bookingTypeId < 4 && containerData.bookingTypeId > 1"
            v-model="containerData.soli"
            :label="t('dialogs.addBooking.soliLabel')"
            @amount="(a) => { containerData.soli = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-text-field
            v-if="containerData.bookingTypeId === 3"
            ref="date-input"
            v-model="containerData.exDate"
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
            v-if="containerData.bookingTypeId === 3"
            v-model="containerData.sourceTax"
            :label="t('dialogs.addBooking.sourceTaxLabel')"
            @amount="(a) => { containerData.sourceTax = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-select
            v-if="containerData.bookingTypeId < 4 && containerData.bookingTypeId > 0"
            v-model="containerData.stockId"
            :item-title="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.COMPANY"
            :item-value="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID"
            :items="records.stocks.items.sort((a: IStock, b: IStock): number => { return a.cCompany.localeCompare(b.cCompany) })"
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
            v-if="containerData.bookingTypeId < 3 && containerData.bookingTypeId > 0"
            v-model="containerData.marketPlace"
            :items="settings.markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
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
            v-if="containerData.bookingTypeId < 3 && containerData.bookingTypeId > 0"
            v-model="containerData.fee"
            :label="t('dialogs.addBooking.feeLabel')"
            @amount="(a) => { containerData.fee = a }"
        />
      </v-col>
      <v-col>
        <CurrencyInput
            v-if="containerData.bookingTypeId === 1"
            v-model="containerData.transactionTax"
            :label="t('dialogs.addBooking.transactionTaxLabel')"
            @amount="(a) => { containerData.transactionTax = a }"
        />
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="containerData.description"
            :label="t('dialogs.addBooking.descriptionLabel')"
            density="compact"
            required
            variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
