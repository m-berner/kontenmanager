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
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {creditRules, debitRules} = useValidation()
const {INDEXED_DB} = useAppConfig()
const {isoDateRules, bookingTypeRules} = useValidation()
const {formRef, bookingFormularData, selected} = useBookingFormular()
const {bookingTypes, stocks} = useRecordsStore()
const {markets} = useSettingsStore()

const T = Object.freeze(
    {
        STRINGS: {
            DATE_LABEL: t('components.dialogs.forms.bookingFormular.dateLabel'),
            STOCK_LABEL: t('components.dialogs.forms.bookingFormular.stockLabel'),
            BOOKING_TYPE_LABEL: t('components.dialogs.forms.bookingFormular.bookingTypeLabel'),
            COUNT_LABEL: t('components.dialogs.forms.bookingFormular.countLabel'),
            EX_DATE_LABEL: t('components.dialogs.forms.bookingFormular.exDateLabel'),
            MARKET_PLACE_LABEL: t('components.dialogs.forms.bookingFormular.marketPlaceLabel'),
            BOOKING_LABEL: t('components.dialogs.forms.bookingFormular.bookingLabel'),
            TAX_LABEL: t('components.dialogs.forms.bookingFormular.taxLabel'),
            SOLI_LABEL: t('components.dialogs.forms.bookingFormular.soliLabel'),
            SOURCE_TAX_LABEL: t('components.dialogs.forms.bookingFormular.sourceTaxLabel'),
            FEE_LABEL: t('components.dialogs.forms.bookingFormular.feeLabel'),
            TRANSACTION_TAX_LABEL: t('components.dialogs.forms.bookingFormular.transactionTaxLabel'),
            DESCRIPTION_LABEL: t('components.dialogs.forms.bookingFormular.descriptionLabel')
        },
        DATE_RULES: [
            t('validators.isoDateRules.required'),
            t('validators.isoDateRules.valid')
        ],
        BOOKING_TYPE_RULES: [t('validators.bookingTypeRules.required')],
        RULES: [
            t('validators.creditDebitFieldset.onlyOnePositive')
        ]
    }
)

const creditDebitModel = computed(
    {
        get: () => ({
            credit: bookingFormularData.credit,
            debit: bookingFormularData.debit
        }),
        set: (val: { credit: number, debit: number }) => {
            bookingFormularData.credit = val.credit
            bookingFormularData.debit = val.debit
        }
    }
)
const taxModel = computed(
    {
        get: () => ({credit: bookingFormularData.taxCredit, debit: bookingFormularData.taxDebit}),
        set: (val) => {
            bookingFormularData.taxCredit = val.credit
            bookingFormularData.taxDebit = val.debit
        }
    }
)
const soliModel = computed(
    {
        get: () => ({
            credit: bookingFormularData.soliCredit,
            debit: bookingFormularData.soliDebit
        }),
        set: (val) => {
            bookingFormularData.soliCredit = val.credit
            bookingFormularData.soliDebit = val.debit
        }
    }
)
const sourceTaxModel = computed(
    {
        get: () => ({
            credit: bookingFormularData.sourceTaxCredit,
            debit: bookingFormularData.sourceTaxDebit
        }),
        set: (val) => {
            bookingFormularData.sourceTaxCredit = val.credit
            bookingFormularData.sourceTaxDebit = val.debit
        }
    }
)
const transactionTaxModel = computed(
    {
        get: () => ({
            credit: bookingFormularData.transactionTaxCredit,
            debit: bookingFormularData.transactionTaxDebit
        }),
        set: (val) => {
            bookingFormularData.transactionTaxCredit = val.credit
            bookingFormularData.transactionTaxDebit = val.debit
        }
    }
)
const feeModel = computed(
    {
        get: () => ({credit: bookingFormularData.feeCredit, debit: bookingFormularData.feeDebit}),
        set: (val) => {
            bookingFormularData.feeCredit = val.credit
            bookingFormularData.feeDebit = val.debit
        }
    }
)
const isStockBookingType = computed(() => selected.value === INDEXED_DB.STORE.BOOKING_TYPES.BUY || selected.value === INDEXED_DB.STORE.BOOKING_TYPES.SELL || selected.value === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND)
const isDividendType = computed(() => selected.value === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND)
const isBuySellType = computed(() => selected.value === INDEXED_DB.STORE.BOOKING_TYPES.BUY || selected.value === INDEXED_DB.STORE.BOOKING_TYPES.SELL)
const isBuyType = computed(() => selected.value === INDEXED_DB.STORE.BOOKING_TYPES.BUY)
const isDividendSellType = computed(() => selected.value === INDEXED_DB.STORE.BOOKING_TYPES.SELL || selected.value === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND)
const sortedStocks = computed(() => [...stocks.items].sort((a, b) => a.cCompany.localeCompare(b.cCompany)))
const sortedBookingTypes = computed(() => [{
    cID: INDEXED_DB.STORE.BOOKING_TYPES.NONE,
    cName: '',
    cAccountNumberID: null
}, ...bookingTypes.items].sort((a, b) => a.cName.localeCompare(b.cName)))
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
                    :rules="isoDateRules(T.DATE_RULES)"
                    autofocus
                    density="compact"
                    type="date"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
            <v-col>
                <v-select
                    v-if="isStockBookingType"
                    v-model="bookingFormularData.stockId"
                    :item-title="INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY"
                    :item-value="INDEXED_DB.STORE.STOCKS.FIELDS.ID"
                    :items="sortedStocks"
                    :label="T.STRINGS.STOCK_LABEL"
                    clearable
                    density="compact"
                    max-width="300"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
        <v-row justify="center">
            <v-col cols="6">
                <v-select
                    v-model="selected"
                    :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
                    :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
                    :items="sortedBookingTypes"
                    :label="T.STRINGS.BOOKING_TYPE_LABEL"
                    :rules="bookingTypeRules(T.BOOKING_TYPE_RULES)"
                    clearable
                    density="compact"
                    max-width="300"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
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
                    @focus="formRef?.resetValidation?.()"
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
                    :rules="isoDateRules(T.DATE_RULES)"
                    autofocus
                    density="compact"
                    required
                    type="date"
                    variant="outlined"
                    @focus="formRef?.resetValidation?.()"
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
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
        <v-row justify="center">
            <CreditDebitFieldset
                v-model="creditDebitModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
                :legend="T.STRINGS.BOOKING_LABEL"/>
        </v-row>
        <v-row v-if="isDividendSellType" justify="center">
            <CreditDebitFieldset
                v-model="taxModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
                :legend="T.STRINGS.TAX_LABEL"/>
        </v-row>
        <v-row v-if="isDividendSellType" justify="center">
            <CreditDebitFieldset
                v-model="soliModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
                :legend="T.STRINGS.SOLI_LABEL"/>
        </v-row>
        <v-row v-if="isDividendSellType" justify="center">
            <CreditDebitFieldset
                v-model="sourceTaxModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
                :legend="T.STRINGS.SOURCE_TAX_LABEL"/>
        </v-row>
        <v-row v-if="isBuySellType" justify="center">
            <CreditDebitFieldset
                v-model="feeModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
                :legend="T.STRINGS.FEE_LABEL"/>
        </v-row>
        <v-row v-if="isBuyType" justify="center">
            <CreditDebitFieldset
                v-model="transactionTaxModel"
                :rules="[(v: number) => creditRules(v, T.RULES), (v: number) => debitRules(v, T.RULES)]"
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
                    @focus="formRef?.resetValidation?.()"
                />
            </v-col>
        </v-row>
    </v-container>
</template>
