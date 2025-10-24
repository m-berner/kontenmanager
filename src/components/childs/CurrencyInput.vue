<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {Ref} from 'vue'
import {defineProps, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'

interface CurrencyInputProps {
  modelValue: number,
  disabled?: boolean,
  label: string
}

const currencyInputProps = defineProps<CurrencyInputProps>()
const {n, t} = useI18n()
const {formRef} = useBookingFormular()
const {isGreaterZeroRules} = useValidation()

const formatCurrency = (value: number): string => {
  if (!value || value === 0) return ''
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
  if (unformattedValue.value === 0) {
    formattedValue.value = ''
  } else {
    formattedValue.value = unformattedValue.value.toString()
  }
}

const onBlur = (): void => {
  isFocused.value = false
  unformattedValue.value = parseCurrency(formattedValue.value)
  formattedValue.value = formatCurrency(unformattedValue.value)
}

const onInput = (ev: Event): void => {
  if (ev.target instanceof HTMLInputElement) {
    const inValue = Number.parseFloat(ev.target.value)
    if (isFocused.value && !Number.isNaN(inValue)) {
      // if (inValue < 0) {
      //   console.error('v', inValue)
      //   formattedValue.value = (-inValue).toString()
      // } else {
      //   formattedValue.value = inValue.toString()
      // }
      formattedValue.value = ev.target.value
    }
  }
}

onMounted(() => {
  formattedValue.value = formatCurrency(unformattedValue.value)
})
</script>

<template>
  <v-text-field
      v-bind="currencyInputProps"
      density="compact"
      variant="solo-filled"
      :rules="isGreaterZeroRules([t('validators.isGreaterZeroRules')])"
      @blur="onBlur"
      @focus="formRef?.resetValidation(); onFocus"
      @input="onInput"
  />
</template>
