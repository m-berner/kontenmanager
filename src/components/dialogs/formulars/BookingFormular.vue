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
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import CreditDebitFieldset from '@/components/CreditDebitFieldset.vue'

interface IT {
  STRINGS: Record<string, string>
  DATE_RULES: string[]
}

const {t} = useI18n()
const {CONS} = useApp()
const {dateRules} = useValidation()
const {bookingFormularData} = useBookingFormular()
const {bookingTypes, stocks} = useRecordsStore()
const {markets} = useSettingsStore()

const T = Object.freeze<IT>({
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
  DATE_RULES: [t('validators.dateRules.required')]
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
            v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.stockId"
            :item-title="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.COMPANY"
            :item-value="CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID"
            :items="stocks.items.sort((a: IStock_Store, b: IStock_Store): number => { return a.cCompany.localeCompare(b.cCompany) })"
            :label="T.STRINGS.STOCK_LABEL"
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
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
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
            v-if="bookingFormularData.bookingTypeId === 3"
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
            v-if="bookingFormularData.bookingTypeId < 3 && bookingFormularData.bookingTypeId > 0"
            v-model="bookingFormularData.marketPlace"
            :items="markets.sort((a: string, b: string): number => { return a.localeCompare(b) })"
            :label="T.STRINGS.MARKET_PLACE_LABEL"
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
          :legend="T.STRINGS.BOOKING_LABEL"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1" justify="center">
      <CreditDebitFieldset
          v-model="taxModel"
          :legend="T.STRINGS.TAX_LABEL"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 4 && bookingFormularData.bookingTypeId > 1" justify="center">
      <CreditDebitFieldset
          v-model="soliModel"
          :legend="T.STRINGS.SOLI_LABEL"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId === 2 || bookingFormularData.bookingTypeId === 3" justify="center">
      <CreditDebitFieldset
          v-model="sourceTaxModel"
          :legend="T.STRINGS.SOURCE_TAX_LABEL"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId < 3 && bookingFormularData.bookingTypeId > 0" justify="center">
      <CreditDebitFieldset
          v-model="feeModel"
          :legend="T.STRINGS.FEE_LABEL"/>
    </v-row>
    <v-row v-if="bookingFormularData.bookingTypeId === 1" justify="center">
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
