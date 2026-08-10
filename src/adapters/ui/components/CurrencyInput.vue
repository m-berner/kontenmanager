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
  // A disabled field must not gate the form. Vuetify validates a disabled input
  // regardless — see the long note on `AccountForm`'s `ibanRules`, where the
  // same shape made an account permanently unsaveable — and while this instance
  // is currently harmless (nothing passes `disabled`, and `oneOfTwo` accepts the
  // 0 a disabled amount holds), it is the same trap one prop away.
  if (props.disabled || !props.rules) return undefined;
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

  // A dot followed by at most 2 digits can only be a real decimal fraction
  // (every amount in this app is rounded to 2 places via round2()), so it's
  // safe to parse directly regardless of locale. This covers the raw
  // dot-decimal editing state onFocus/onInput seed. A dot followed by 3+
  // digits is genuinely ambiguous in a locale where "." is the group
  // separator (e.g. de-DE "1.234" typed/pasted as a whole-number amount, not
  // a fraction) and must fall through to the locale-aware branch below,
  // which strips it as a group separator instead of misreading it as "1.234".
  if (/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
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
    // Store the raw typed/pasted text as-is - parseCurrency() already does
    // full locale-aware group/decimal parsing below. A blind single-comma
    // replace here previously collided with a "." typed as a group separator
    // (e.g. a de-DE "1.234,56" paste, or an en-US "1,234.56" one), silently
    // inflating or truncating the parsed amount by orders of magnitude.
    formattedValue.value = ev.target.value;
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

