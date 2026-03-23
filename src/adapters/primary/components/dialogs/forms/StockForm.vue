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
import {useStockForm} from "@/adapters/primary/composables/useForms";

const props = defineProps<StockFormProps>();

const {t} = useI18n();
const {stockFormData} = useStockForm();
const {fetchAdapter, validationAdapter, alertAdapter} = useAdapters();

const NAME_RULES = [
  t("validators.nameRules.required"),
  t("validators.nameRules.length"),
  t("validators.nameRules.begin")
];

const ISIN_RULES = [
  t("validators.isinRules.required"),
  t("validators.isinRules.length"),
  t("validators.isinRules.format"),
  t("validators.isinRules.country"),
  t("validators.isinRules.luhn")
];

const onUpdateIsin = async () => {
  log("COMPONENTS DIALOGS FORMS StockForm: onUpdateISIN");

  try {
    if (!props.isUpdate && stockFormData.isin.length === 12) {
      stockFormData.isin = stockFormData.isin.toUpperCase().replace(/\s/g, "");
      const companyData = await fetchAdapter.fetchCompanyData(
          stockFormData.isin
      );
      stockFormData.company = companyData.company;
      stockFormData.symbol = companyData.symbol;
    }
  } catch (err) {
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
          :rules="validationAdapter.isinRules(ISIN_RULES)"
          autofocus
          variant="outlined"
          @update:model-value="onUpdateIsin"/>
    </v-row>
    <v-row>
      <v-text-field
          v-model="stockFormData.company"
          :label="t('components.dialogs.forms.stockForm.companyLabel')"
          required
          variant="outlined"/>
    </v-row>
    <v-row cols="2" sm="2">
      <v-col/>
      <v-col>
        <v-text-field
            v-model="stockFormData.symbol"
            :label="t('components.dialogs.forms.stockForm.symbolLabel')"
            :rules="validationAdapter.nameRules(NAME_RULES)"
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
      <v-text-field
          v-model="stockFormData.url"
          :label="t('components.dialogs.forms.stockForm.urlLabel')"
          variant="outlined"/>
    </v-row>
  </v-container>
</template>
