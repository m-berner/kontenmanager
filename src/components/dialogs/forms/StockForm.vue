<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES
} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import {useStockForm} from "@/composables/useForms";
import {fetchService} from "@/services/fetch";
import type {StockFormProps} from "@/types";
import {validationService} from "@/services/validation";
import {alertService} from "@/services/alert";

const props = defineProps<StockFormProps>();

const {t} = useI18n();
const {stockFormData} = useStockForm();

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
  DomainUtils.log("COMPONENTS DIALOGS FORMS StockForm: onUpdateISIN");

  try {
    if (!props.isUpdate && stockFormData.isin.length === 12) {
      stockFormData.isin = stockFormData.isin.toUpperCase().replace(/\s/g, "");
      const companyData = await fetchService.fetchCompanyData(
          stockFormData.isin
      );
      stockFormData.company = companyData.company;
      stockFormData.symbol = companyData.symbol;
    }
  } catch {
    stockFormData.company = "";
    stockFormData.symbol = "";
    await alertService.feedbackError(
        "StockForm ISIN update",
        new AppError(
        ERROR_CODES.STOCK_FORM,
        ERROR_CATEGORY.VALIDATION,
        true
        ),
        {data: stockFormData.isin}
    );
  }
};

DomainUtils.log("COMPONENTS DIALOGS FORMS StockForm: setup");
</script>

<template>
  <v-container>
    <v-row>
      <v-text-field
          v-model="stockFormData.isin"
          :counter="12"
          :label="t('components.dialogs.forms.stockForm.isinLabel')"
          :rules="validationService.isinRules(ISIN_RULES)"
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
            :rules="validationService.nameRules(NAME_RULES)"
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
