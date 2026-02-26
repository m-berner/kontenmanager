<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";
import {computed} from "vue";
import CurrencyInput from "@/components/CurrencyInput.vue";
import type {CreditDebitFieldsetProps} from "@/types";
import {DomainUtils} from "@/domains/utils";

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

DomainUtils.log("COMPONENTS CreditDebitFieldset: setup");
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
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 9px 6px 0 6px;
}

.horizontal-fieldset legend {
  padding: 0 9px;
  font-weight: 500;
}

.fields-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.fields-container > * {
  flex: 1;
  min-width: 200px;
}
</style>
