<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";
import {computed} from "vue";
import {useRecordsStore} from "@/stores/records";
import {useSettingsStore} from "@/stores/settings";
import {useBookingForm} from "@/composables/useForms";
import CreditDebitFieldset from "@/components/CreditDebitFieldset.vue";
import {INDEXED_DB} from "@/configs/database";
import {validationService} from "@/services/validation";
import {DomainUtils} from "@/domains/utils";

const {t} = useI18n();
const {bookingFormData} = useBookingForm();
const {bookingTypes, stocks} = useRecordsStore();
const {markets} = useSettingsStore();

const DATE_RULES = [
  t("validators.isoDateRules.required"),
  t("validators.isoDateRules.valid")
];
const BOOKING_TYPE_RULES = [t("validators.bookingTypeRules.required")];
const RULES = [t("validators.creditDebitFieldset.onlyOnePositive")];

const creditDebitModel = computed({
  get: () => ({
    credit: bookingFormData.credit,
    debit: bookingFormData.debit
  }),
  set: (val: { credit: number; debit: number }) => {
    bookingFormData.credit = val.credit;
    bookingFormData.debit = val.debit;
  }
});
const taxModel = computed({
  get: () => ({
    credit: bookingFormData.taxCredit,
    debit: bookingFormData.taxDebit
  }),
  set: (val) => {
    bookingFormData.taxCredit = val.credit;
    bookingFormData.taxDebit = val.debit;
  }
});
const soliModel = computed({
  get: () => ({
    credit: bookingFormData.soliCredit,
    debit: bookingFormData.soliDebit
  }),
  set: (val) => {
    bookingFormData.soliCredit = val.credit;
    bookingFormData.soliDebit = val.debit;
  }
});
const sourceTaxModel = computed({
  get: () => ({
    credit: bookingFormData.sourceTaxCredit,
    debit: bookingFormData.sourceTaxDebit
  }),
  set: (val) => {
    bookingFormData.sourceTaxCredit = val.credit;
    bookingFormData.sourceTaxDebit = val.debit;
  }
});
const transactionTaxModel = computed({
  get: () => ({
    credit: bookingFormData.transactionTaxCredit,
    debit: bookingFormData.transactionTaxDebit
  }),
  set: (val) => {
    bookingFormData.transactionTaxCredit = val.credit;
    bookingFormData.transactionTaxDebit = val.debit;
  }
});
const feeModel = computed({
  get: () => ({
    credit: bookingFormData.feeCredit,
    debit: bookingFormData.feeDebit
  }),
  set: (val) => {
    bookingFormData.feeCredit = val.credit;
    bookingFormData.feeDebit = val.debit;
  }
});
const isStockBookingType = computed(
    () =>
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY ||
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL ||
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND
);
const isDividendType = computed(
    () => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND
);
const isBuySellType = computed(
    () =>
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY ||
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL
);
const isBuyType = computed(
    () => bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.BUY
);
const isDividendSellType = computed(
    () =>
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.SELL ||
        bookingFormData.selected === INDEXED_DB.STORE.BOOKING_TYPES.DIVIDEND
);
const sortedStocks = computed(() =>
    [...stocks.items].sort((a, b) => a.cCompany.localeCompare(b.cCompany))
);
const sortedBookingTypes = computed(() =>
    [
      {
        cID: INDEXED_DB.STORE.BOOKING_TYPES.NONE,
        cName: "",
        cAccountNumberID: null
      },
      ...bookingTypes.items
    ].sort((a, b) => a.cName.localeCompare(b.cName))
);
const sortedMarkets = computed(() =>
    [...markets].sort((a, b) => a.localeCompare(b))
);

DomainUtils.log("COMPONENTS DIALOGS FORMS BookingForm: setup");
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field
            v-model="bookingFormData.bookDate"
            :label="t('components.dialogs.forms.bookingForm.dateLabel')"
            :rules="validationService.isoDateRules(DATE_RULES)"
            autofocus
            density="compact"
            type="date"
            variant="outlined"/>
      </v-col>
      <v-col>
        <v-select
            v-if="isStockBookingType"
            v-model="bookingFormData.stockId"
            :item-title="INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY"
            :item-value="INDEXED_DB.STORE.STOCKS.FIELDS.ID"
            :items="sortedStocks"
            :label="t('components.dialogs.forms.bookingForm.stockLabel')"
            clearable
            density="compact"
            max-width="300"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-select
            v-model="bookingFormData.selected"
            :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
            :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
            :items="sortedBookingTypes"
            :label="t('components.dialogs.forms.bookingForm.bookingTypeLabel')"
            :rules="validationService.bookingTypeRules(BOOKING_TYPE_RULES)"
            clearable
            density="compact"
            max-width="300"
            variant="outlined"/>
      </v-col>
      <v-col>
        <v-text-field
            v-if="isStockBookingType"
            v-model="bookingFormData.count"
            :label="t('components.dialogs.forms.bookingForm.countLabel')"
            class="withoutSpinner"
            density="compact"
            type="number"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="6">
        <v-text-field
            v-if="isDividendType"
            ref="date-input"
            v-model="bookingFormData.exDate"
            :label="t('components.dialogs.forms.bookingForm.exDateLabel')"
            :rules="validationService.isoDateRules(DATE_RULES)"
            density="compact"
            required
            type="date"
            variant="outlined"/>
      </v-col>
      <v-col>
        <v-select
            v-if="isBuySellType"
            v-model="bookingFormData.marketPlace"
            :items="sortedMarkets"
            :label="t('components.dialogs.forms.bookingForm.marketPlaceLabel')"
            density="compact"
            max-width="350"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row justify="center">
      <CreditDebitFieldset
          v-model="creditDebitModel"
          :legend="t('components.dialogs.forms.bookingForm.bookingLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="taxModel"
          :legend="t('components.dialogs.forms.bookingForm.taxLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="soliModel"
          :legend="t('components.dialogs.forms.bookingForm.soliLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" justify="center">
      <CreditDebitFieldset
          v-model="sourceTaxModel"
          :legend="t('components.dialogs.forms.bookingForm.sourceTaxLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isBuySellType" justify="center">
      <CreditDebitFieldset
          v-model="feeModel"
          :legend="t('components.dialogs.forms.bookingForm.feeLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isBuyType" justify="center">
      <CreditDebitFieldset
          v-model="transactionTaxModel"
          :legend="t('components.dialogs.forms.bookingForm.transactionTaxLabel')"
          :rules="[
          (v: number) => validationService.amountRules(v, RULES),
          (v: number) => validationService.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="bookingFormData.description"
            :label="t('components.dialogs.forms.bookingForm.descriptionLabel')"
            density="compact"
            type="text"
            variant="outlined"/>
      </v-col>
    </v-row>
  </v-container>
</template>
