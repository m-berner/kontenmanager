<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {BOOKING_TYPE_ROLE, INDEXED_DB} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import CreditDebitFieldset from "@/adapters/ui/components/CreditDebitFieldset.vue";
import ValidationMessage from "@/adapters/ui/components/ValidationMessage.vue";
import {useBookingForm} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {bookingFormData} = useBookingForm();
const {bookingTypes, stocks} = useRecordsStore();
const {markets} = storeToRefs(useSettingsStore());
const {validationAdapter} = useAdapters();

const DATE_RULES = [
  t("validators.isoDateRules.required"),
  t("validators.isoDateRules.valid")
];
const BOOKING_TYPE_RULES = [t("validators.bookingTypeRules.required")];
const STOCK_RULES = [t("validators.stockRules.required")];
const COUNT_RULES = [t("validators.countRules.required")];
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
const selectedBookingTypeRole = computed(
    () => bookingTypes.items.find((t) => t.cID === bookingFormData.selected)?.cRole
);
const isStockBookingType = computed(
    () =>
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.BUY ||
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.SELL ||
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.DIVIDEND
);
const isDividendType = computed(
    () => selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.DIVIDEND
);
const isBuySellType = computed(
    () =>
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.BUY ||
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.SELL
);
const isBuyType = computed(
    () => selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.BUY
);
const isDividendSellType = computed(
    () =>
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.SELL ||
        selectedBookingTypeRole.value === BOOKING_TYPE_ROLE.DIVIDEND
);
const sortedStocks = computed(() =>
    [...stocks.items].sort((a, b) => a.cCompany.localeCompare(b.cCompany))
);
const sortedBookingTypes = computed(() =>
    [
      {
        cID: INDEXED_DB.STORE.BOOKING_TYPES.NONE,
        cName: "",
        cAccountNumberID: null,
        cRole: BOOKING_TYPE_ROLE.OTHER
      },
      ...bookingTypes.items
    ].sort((a, b) => a.cName.localeCompare(b.cName))
);
const sortedMarkets = computed(() =>
    [...markets.value].sort((a, b) => a.localeCompare(b))
);

log("COMPONENTS DIALOGS FORMS BookingForm: setup");
</script>

<template>
  <v-container class="booking-form">
    <v-row dense>
      <v-col cols="6">
        <v-text-field
            v-model="bookingFormData.bookDate"
            :label="t('components.dialogs.forms.bookingForm.dateLabel')"
            :rules="validationAdapter.isoDateRules(DATE_RULES)"
            autofocus
            density="compact"
            hide-details="auto"
            type="date"
            variant="outlined">
          <template #message="{ message }">
            <ValidationMessage :message="message"/>
          </template>
        </v-text-field>
      </v-col>
      <v-col>
        <v-select
            v-if="isStockBookingType"
            v-model="bookingFormData.stockId"
            :item-title="INDEXED_DB.STORE.STOCKS.FIELDS.COMPANY"
            :item-value="INDEXED_DB.STORE.STOCKS.FIELDS.ID"
            :items="sortedStocks"
            :label="t('components.dialogs.forms.bookingForm.stockLabel')"
            :rules="validationAdapter.stockRules(STOCK_RULES)"
            clearable
            density="compact"
            hide-details="auto"
            max-width="300"
            variant="outlined">
          <template #message="{ message }">
            <ValidationMessage :message="message"/>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-row dense justify="center">
      <v-col cols="6">
        <v-select
            v-model="bookingFormData.selected"
            :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
            :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
            :items="sortedBookingTypes"
            :label="t('components.dialogs.forms.bookingForm.bookingTypeLabel')"
            :rules="validationAdapter.bookingTypeRules(BOOKING_TYPE_RULES)"
            clearable
            density="compact"
            hide-details="auto"
            max-width="300"
            variant="outlined">
          <template #message="{ message }">
            <ValidationMessage :message="message"/>
          </template>
        </v-select>
      </v-col>
      <v-col>
        <v-text-field
            v-if="isStockBookingType"
            v-model="bookingFormData.count"
            :label="t('components.dialogs.forms.bookingForm.countLabel')"
            :rules="validationAdapter.countRules(COUNT_RULES)"
            class="withoutSpinner"
            density="compact"
            hide-details="auto"
            type="number"
            variant="outlined">
          <template #message="{ message }">
            <ValidationMessage :message="message"/>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
    <v-row dense justify="center">
      <v-col cols="6">
        <v-text-field
            v-if="isDividendType"
            v-model="bookingFormData.exDate"
            :label="t('components.dialogs.forms.bookingForm.exDateLabel')"
            :rules="validationAdapter.isoDateRules(DATE_RULES)"
            density="compact"
            hide-details="auto"
            required
            type="date"
            variant="outlined">
          <template #message="{ message }">
            <ValidationMessage :message="message"/>
          </template>
        </v-text-field>
      </v-col>
      <v-col>
        <v-select
            v-if="isBuySellType"
            v-model="bookingFormData.marketPlace"
            :items="sortedMarkets"
            :label="t('components.dialogs.forms.bookingForm.marketPlaceLabel')"
            density="compact"
            hide-details="auto"
            max-width="350"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row dense justify="center">
      <CreditDebitFieldset
          v-model="creditDebitModel"
          :legend="t('components.dialogs.forms.bookingForm.bookingLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" dense justify="center">
      <CreditDebitFieldset
          v-model="taxModel"
          :legend="t('components.dialogs.forms.bookingForm.taxLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" dense justify="center">
      <CreditDebitFieldset
          v-model="soliModel"
          :legend="t('components.dialogs.forms.bookingForm.soliLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isDividendSellType" dense justify="center">
      <CreditDebitFieldset
          v-model="sourceTaxModel"
          :legend="t('components.dialogs.forms.bookingForm.sourceTaxLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isBuySellType" dense justify="center">
      <CreditDebitFieldset
          v-model="feeModel"
          :legend="t('components.dialogs.forms.bookingForm.feeLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row v-if="isBuyType" dense justify="center">
      <CreditDebitFieldset
          v-model="transactionTaxModel"
          :legend="t('components.dialogs.forms.bookingForm.transactionTaxLabel')"
          :rules="[
          (v: number) => validationAdapter.amountRules(v, RULES),
          (v: number) => validationAdapter.amountRules(v, RULES)
        ]"/>
    </v-row>
    <v-row dense justify="center">
      <v-col cols="12">
        <v-text-field
            v-model="bookingFormData.description"
            :label="t('components.dialogs.forms.bookingForm.descriptionLabel')"
            density="compact"
            hide-details="auto"
            type="text"
            variant="outlined"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/*
 * Vuetify's `error` theme color (vuetify.ts, "#FF0000" in every theme) drives
 * every validation hint here — field outline, label and the ValidationMessage
 * text/icon alike, all via `rgb(var(--v-theme-error))` (see VField.css/
 * VInput.css). Overriding the variable on this form's root, rather than
 * recoloring `.validation-message` text alone, keeps the outline/label/icon
 * in the same shade as the message instead of pairing a salmon message with a
 * pure-red border. Scoped to Add/Update Booking only (both mount this form),
 * not vuetify.ts's global `error` token, which every other dialog's
 * validation still uses.
 *
 * A plain `.booking-form { --v-theme-error: ... }` does NOT reach the fields:
 * every themed Vuetify component (VField, VInput, VCard, ...) carries its
 * own `.v-theme--<name>` class, and that class's runtime-injected rule
 * RE-DECLARES `--v-theme-error` directly on that descendant element. A
 * redeclaration on a descendant always wins over an ancestor's value —
 * there's no specificity contest to win, the descendant simply never
 * inherits — so the override has to be repeated on every such element inside
 * this form. `:deep()` reaches into VField/VInput's internal markup (which
 * scoped CSS can't otherwise select); `[class*="v-theme--"]` matches
 * whichever theme is active without hardcoding vuetify.ts's 6 theme names.
 *
 * The value is darksalmon's RGB channels (233,150,122) — the same red
 * ShowAccounting.vue uses for negative sums via style.css's `.color-red`
 * (`color: darksalmon`). Vuetify's CSS variables are always bare "r,g,b"
 * channels, not a color keyword, so the two can't share one literal; keep
 * them in sync by hand if `.color-red` ever changes.
 */
.booking-form,
.booking-form :deep([class*="v-theme--"]) {
  --v-theme-error: 233, 150, 122;
}
</style>
