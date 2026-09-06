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
import {log, round2} from "@/domain/utils/utils";

import ValidationMessage from "@/adapters/ui/components/ValidationMessage.vue";
import {parseCurrency} from "@/adapters/ui/composables/currencyParsing";

const props = defineProps<CurrencyInputProps>();

const emit = defineEmits(["update:modelValue"]);
const {n, locale} = useI18n();
const formattedValue = ref<string>("");
const isFocused = ref<boolean>(false);

const wrappedRules = computed(() => {
  // A disabled field must not gate the form. Vuetify validates a disabled input
  // regardless — see the long note on `AccountForm`'s `ibanRules`, where the
  // same shape made an account permanently unsaveable — and while this instance
  // is currently harmless (nothing passes `disabled`, and `oneOfTwo` accepts the
  // 0 a disabled amount holds), it is the same trap one prop away.
  if (props.disabled || !props.rules) return undefined;
  return props.rules.map((rule) => {
    return (v: string) => {
      const numValue = parseCurrency(v, locale.value);
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

const onFocus = (): void => {
  isFocused.value = true;
  // Show raw number for editing, always as a 2-decimal dot-decimal string —
  // not `props.modelValue.toString()`, which could carry more precision (a
  // pre-existing unrounded value, or a full-precision float like `12.1`
  // rendering fine but `0.1 + 0.2` style residue rendering as
  // "12.300000000000001"). A 2-decimal seed guarantees the raw editing text
  // always matches parseCurrency's unambiguous dot-decimal fast path (see
  // composables/currencyParsing.ts), instead of one that only works for
  // values already exactly 1-2 digits.
  if (props.modelValue === 0) {
    formattedValue.value = "";
  } else {
    formattedValue.value = round2(props.modelValue).toFixed(2);
  }
};

const onBlur = (): void => {
  isFocused.value = false;
  const parsed = parseCurrency(formattedValue.value, locale.value);
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
      hide-details="auto"
      variant="solo-filled"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput">
    <!-- The only messages this field ever shows are `wrappedRules` failures
         (no hint/persistent-hint is set), so it's safe to always pair the
         text with ValidationMessage's `$error` icon rather than only on some
         messages. -->
    <template #message="{ message }">
      <ValidationMessage :message="message"/>
    </template>
  </v-text-field>
</template>
