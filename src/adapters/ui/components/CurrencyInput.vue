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

import type {CurrencyInputProps} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const props = defineProps<CurrencyInputProps>();

const emit = defineEmits(["update:modelValue"]);
const {n, locale} = useI18n();
const formattedValue = ref<string>("");
const isFocused = ref<boolean>(false);

/**
 * Detects the active locale's group (thousands) and decimal separator
 * characters, so a fully formatted display value (e.g. "$1,234.56" or
 * "1.234,56 €") can be reversed back into a plain number correctly,
 * instead of assuming "," is always the decimal separator.
 */
const getSeparators = (): { group: string; decimal: string } => {
  const parts = new Intl.NumberFormat(locale.value).formatToParts(1234.5);
  return {
    group: parts.find((p) => p.type === "group")?.value ?? ",",
    decimal: parts.find((p) => p.type === "decimal")?.value ?? "."
  };
};

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
  const trimmed = value.trim();

  // Already-plain numeric input (the raw editing state set by onFocus/onInput,
  // always dot-decimal with no grouping) is unambiguous — parse it directly
  // rather than risk treating its "." as a locale group separator (e.g. in
  // locales like de-DE where "." is the group separator).
  if (/^-?\d+(\.\d*)?$/.test(trimmed)) {
    return Number.parseFloat(trimmed);
  }

  const {group, decimal} = getSeparators();
  // Strip group (thousands) separators first, then normalize the decimal
  // separator to ".", so locale-formatted display values like "$1,234.56"
  // or "1.234,56 €" both parse to 1234.56 instead of silently losing
  // magnitude (only the first separator was previously converted).
  const withoutGroups = group ? trimmed.split(group).join("") : trimmed;
  const withDotDecimal = decimal === "." ? withoutGroups : withoutGroups.split(decimal).join(".");
  const normalized = withDotDecimal.replace(/\s/g, "");
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
  log("COMPONENTS CurrencyInput: onMounted");
  formattedValue.value = formatCurrency(props.modelValue);
});

log("COMPONENTS CurrencyInput: setup");
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

