<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import type {StockFormProps} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useStockForm} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const props = defineProps<StockFormProps>();

const {t} = useI18n();
const {stockFormData} = useStockForm();
const {fetchAdapter, validationAdapter, alertAdapter} = useAdapters();
const settings = useSettingsStore();
const records = useRecordsStore();

const NAME_RULES = [
  t("validators.nameRules.required"),
  t("validators.nameRules.length"),
  t("validators.nameRules.begin")
];

// The symbol is backed by a per-account UNIQUE index (stocks_uk4) just like the
// ISIN is (stocks_uk3), so it needs the same duplicate message the ISIN has.
const SYMBOL_RULES = [
  ...NAME_RULES,
  t("validators.symbolRules.duplicate")
];

const ISIN_RULES = [
  t("validators.isinRules.required"),
  t("validators.isinRules.length"),
  t("validators.isinRules.format"),
  t("validators.isinRules.country"),
  t("validators.isinRules.luhn"),
  t("validators.isinRules.duplicate")
];

let isinUpdateSeq = 0;

const onUpdateIsin = async () => {
  log("COMPONENTS DIALOGS FORMS StockForm: onUpdateISIN");

  // Guards against out-of-order fetch resolution: every keystroke that leaves
  // the ISIN at 12 chars re-triggers a fetch, and nothing else stops an older,
  // slower request from resolving after a newer one and overwriting
  // company/symbol with data for a since-corrected ISIN.
  const seq = ++isinUpdateSeq;

  try {
    if (stockFormData.isin.length === 12) {
      stockFormData.isin = stockFormData.isin.toUpperCase().replace(/\s/g, "");
    }
    if (!props.isUpdate && stockFormData.isin.length === 12) {
      // In E2E/offline mode the service may be disabled; skip auto-fetch to avoid alerts
      if (settings.service === "none") {
        stockFormData.company = stockFormData.company || "";
        stockFormData.symbol = stockFormData.symbol || "";
        return;
      }
      const companyData = await fetchAdapter.fetchCompanyData(stockFormData.isin);
      if (seq !== isinUpdateSeq) return; // superseded by a newer ISIN edit
      stockFormData.company = companyData.company;
      stockFormData.symbol = companyData.symbol;
    }
  } catch (err) {
    if (seq !== isinUpdateSeq) return; // superseded by a newer ISIN edit
    stockFormData.company = "";
    stockFormData.symbol = "";
    await alertAdapter.feedbackError(
        "StockForm ISIN update",
        appError(
            ERROR_DEFINITIONS.STOCK_FORM.CODE,
            ERROR_CATEGORY.VALIDATION,
            true
        ),
        {data: {isin: stockFormData.isin, error: serializeError(err)}}
    );
  }
};

log("COMPONENTS DIALOGS FORMS StockForm: setup");
</script>

<template>
  <v-container>
    <v-row>
      <v-text-field
          v-model="stockFormData.isin"
          :counter="12"
          :label="t('components.dialogs.forms.stockForm.isinLabel')"
          :rules="validationAdapter.isinRules(ISIN_RULES, (isin) => records.stocks.isDuplicate(isin, props.isUpdate ? stockFormData.id : undefined))"
          autofocus
          variant="outlined"
          @update:model-value="onUpdateIsin"/>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormData.company"
          :label="t('components.dialogs.forms.stockForm.companyLabel')"
          :rules="[validationAdapter.required(t('validators.nameRules.required'))]"
          variant="outlined"/>
    </v-row>
    <v-row cols="2" sm="2">
      <v-col/>
      <v-col>
        <v-text-field
            v-model="stockFormData.symbol"
            :label="t('components.dialogs.forms.stockForm.symbolLabel')"
            :rules="validationAdapter.symbolRules(SYMBOL_RULES, (symbol) => records.stocks.isDuplicateSymbol(symbol, props.isUpdate ? stockFormData.id : undefined))"
            required
            variant="outlined"/>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-if="props.isUpdate">
    <v-row cols="2" sm="2">
      <v-col>
        <v-text-field
            v-model="stockFormData.meetingDay"
            :label="t('components.dialogs.forms.stockForm.meetingDayLabel')"
            type="date"
            variant="outlined"/>
      </v-col>
      <v-col>
        <v-text-field
            v-model="stockFormData.quarterDay"
            :label="t('components.dialogs.forms.stockForm.quarterDayLabel')"
            type="date"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row cols="2" sm="2">
      <v-col>
        <v-checkbox
            v-model="stockFormData.fadeOut"
            :label="t('components.dialogs.forms.stockForm.fadeOutLabel')"
            variant="outlined"/>
      </v-col>
      <v-col>
        <v-checkbox
            v-model="stockFormData.firstPage"
            :label="t('components.dialogs.forms.stockForm.firstPageLabel')"
            variant="outlined"/>
      </v-col>
    </v-row>
    <v-row>
      <!--
        This was the only field in the form with no `:rules` binding at all, so
        an arbitrary scheme (`javascript:`, `data:`, `file:`) was accepted here,
        persisted, and later handed to `window.open` by `useMenu.openLink`.
        `urlRules` allows blank — the link is optional — and otherwise requires
        a credential-free http(s) URL, matching what `sanitizeExternalUrl`
        enforces at the sink.
      -->
      <v-text-field
          v-model="stockFormData.url"
          :label="t('components.dialogs.forms.stockForm.urlLabel')"
          :rules="validationAdapter.urlRules(t('validators.urlRules.invalid'))"
          variant="outlined"/>
    </v-row>
  </v-container>
</template>
