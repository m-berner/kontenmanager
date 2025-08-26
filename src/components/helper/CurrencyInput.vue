<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineProps, defineEmits, onMounted, reactive, watch} from 'vue'
import {useI18n} from 'vue-i18n'

interface CurrencyInputProps {
  modelValue: number
  label: string
  disabled?: boolean
}

interface IState {
  unformattedValue: number
  formattedValue: string
  isFocused: boolean
}

const currencyInputProps = defineProps<CurrencyInputProps>()
const emit = defineEmits(['amount'])
const {n} = useI18n()

const formatCurrency = (value: number): string => {
  if (!value) return ''
  return n(value, 'currency')
}

const state: IState = reactive({
  unformattedValue: currencyInputProps.modelValue,
  formattedValue: formatCurrency(currencyInputProps.modelValue),
  isFocused: false
})

const parseCurrency = (value: string): number => {
  if (!value) return 0
  return Number.parseFloat(value.replace(/[^0-9.-]+/g, ''))
}

const onFocus = (): void => {
  state.isFocused = true
  // Show raw number for editing
  state.formattedValue = state.unformattedValue.toString()
}

const onBlur = (): void => {
  state.isFocused = false
  state.unformattedValue = parseCurrency(state.formattedValue)
  state.formattedValue = formatCurrency(state.unformattedValue)
}

const onInput = (value: number): void => {
  if (state.isFocused) {
    state.unformattedValue = value
  }
}

watch(() => state.unformattedValue, (value) => {
  emit('amount', value)
})

onMounted(() => {
  state.formattedValue = formatCurrency(state.unformattedValue)
})

</script>

<template>
  <v-text-field
      v-model="state.formattedValue"
      :disabled="currencyInputProps.disabled"
      :label="currencyInputProps.label"
      density="compact"
      hide-details
      type="text"
      variant="outlined"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput"
  ></v-text-field>
</template>
