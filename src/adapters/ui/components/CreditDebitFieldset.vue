<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import type {CreditDebitFieldsetProps} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import CurrencyInput from "@/adapters/ui/components/CurrencyInput.vue";

const props = defineProps<CreditDebitFieldsetProps>();
const emit = defineEmits(["update:modelValue"]);
const {t} = useI18n();

const creditValue = computed({
  get: () => props.modelValue.credit,
  set: (val: number) => {
    emit("update:modelValue", {
      credit: val,
      debit: props.modelValue.debit
    });
  }
});
const debitValue = computed({
  get: () => props.modelValue.debit,
  set: (val: number) => {
    emit("update:modelValue", {
      credit: props.modelValue.credit,
      debit: val
    });
  }
});
const cRules = computed(() => props.rules[0](props.modelValue.debit));
const dRules = computed(() => props.rules[1](props.modelValue.credit));

log("COMPONENTS CreditDebitFieldset: setup");
</script>

<template>
  <fieldset class="horizontal-fieldset">
    <legend>{{ props.legend }}</legend>
    <div class="fields-container">
      <CurrencyInput
          v-model="creditValue"
          :disabled="props.disabled"
          :label="t('components.creditDebitFieldset.creditLabel')"
          :rules="cRules"/>
      <CurrencyInput
          v-model="debitValue"
          :disabled="props.disabled"
          :label="t('components.creditDebitFieldset.debitLabel')"
          :rules="dRules"/>
    </div>
  </fieldset>
</template>

<style scoped>
.horizontal-fieldset {
  /* Browsers give <fieldset> a default margin (Firefox: 0.75em top/bottom)
     that isn't touched by the padding override below — with several of
     these stacked per booking (Booking/Tax/Soli/...), that default margin
     alone added more height than the fields it wraps. */
  margin: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 6px 4px 6px;
}

.horizontal-fieldset legend {
  padding: 0 9px;
  font-weight: 500;
}

.fields-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fields-container > * {
  flex: 1;
  min-width: 200px;
}
</style>

