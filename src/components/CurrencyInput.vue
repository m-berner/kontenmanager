<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Currency input wrapper around `v-text-field` that provides
 * localized formatting on blur and raw numeric editing on focus. Emits
 * `update:modelValue` with a parsed number.
 */
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {CurrencyInputProps} from "@/types";
import {DomainUtils} from "@/domains/utils";

const props = defineProps<CurrencyInputProps>();

const emit = defineEmits(["update:modelValue"]);
const {n} = useI18n();
const formattedValue = ref<string>("");
const isFocused = ref<boolean>(false);

const wrappedRules = computed(() => {
  if (!props.rules) return undefined;
  return props.rules.map((rule) => {
    return (v: string) => {
      const numValue = parseCurrency(v);
      return rule(numValue);
    };
  });
});

// Watch for prop changes
watch(
    () => props.modelValue,
    (newVal) => {
      if (!isFocused.value) {
        formattedValue.value = formatCurrency(newVal);
      }
    }
);

const formatCurrency = (value: number): string => {
  if (!value || value === 0) return "";
  return n(value, "currency");
};

const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove all spaces and replace comma with period for parsing
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(\.\d*)?/);
  return match ? Number.parseFloat(match[0]) : 0;
};

const onFocus = (): void => {
  isFocused.value = true;
  // Show raw number for editing
  if (props.modelValue === 0) {
    formattedValue.value = "";
  } else {
    formattedValue.value = props.modelValue.toString();
  }
};

const onBlur = (): void => {
  isFocused.value = false;
  const parsed = parseCurrency(formattedValue.value);
  emit("update:modelValue", parsed);
  formattedValue.value = formatCurrency(parsed);
};

const onInput = (ev: Event): void => {
  if (ev.target instanceof HTMLInputElement && isFocused.value) {
    formattedValue.value = ev.target.value.replace(",", ".");
  }
};

onMounted(async () => {
  DomainUtils.log("COMPONENTS CurrencyInput: onMounted");
  formattedValue.value = formatCurrency(props.modelValue);
});

DomainUtils.log("COMPONENTS CurrencyInput: setup");
</script>

<template>
  <v-text-field
      :disabled="props.disabled"
      :label="props.label"
      :model-value="formattedValue"
      :rules="wrappedRules"
      density="compact"
      variant="solo-filled"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput"/>
</template>
