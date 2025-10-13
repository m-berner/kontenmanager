<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {Ref} from 'vue'
import {defineEmits, defineProps, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'

interface CurrencyInputProps {
  modelValue: number
  label: string
  disabled?: boolean
}

const currencyInputProps = defineProps<CurrencyInputProps>()
const emit = defineEmits<{ 'amount': [value: number] }>()
const {n} = useI18n()

const formatCurrency = (value: number): string => {
  if (!value) return ''
  return n(value, 'currency')
}

const parseCurrency = (value: string): number => {
  if (!value) return 0
  return Number.parseFloat(value.replace(/[^0-9.-]+/g, ''))
}

const unformattedValue: Ref<number> = ref(currencyInputProps.modelValue)
const formattedValue: Ref<string> = ref(formatCurrency(currencyInputProps.modelValue))
const isFocused: Ref<boolean> = ref(false)

const onFocus = (): void => {
  isFocused.value = true
  // Show raw number for editing
  formattedValue.value = unformattedValue.value.toString()
}

const onBlur = (): void => {
  isFocused.value = false
  unformattedValue.value = parseCurrency(formattedValue.value)
  formattedValue.value = formatCurrency(unformattedValue.value)
}

const onInput = (value: number): void => {
  if (isFocused.value) {
    unformattedValue.value = value
  }
}

onMounted(() => {
  formattedValue.value = formatCurrency(unformattedValue.value)
})

watch(() => unformattedValue.value, (value) => {
  emit('amount', value)
})
</script>

<template>
  <v-text-field
      v-model="formattedValue"
      :disabled="currencyInputProps.disabled"
      :label="currencyInputProps.label"
      density="compact"
      hide-details
      type="text"
      variant="outlined"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput"
  />
</template>
