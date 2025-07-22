<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {type CurrencyInputOptions, useCurrencyInput} from 'vue-currency-input'

interface CurrencyInputProps {
  options: CurrencyInputOptions
  label: string
  disabled?: boolean
}

const currencyInputProps = defineProps<CurrencyInputProps>()
const {inputRef, formattedValue} = useCurrencyInput(currencyInputProps.options)
</script>

<template>
  <v-text-field
    density="compact"
    type="text"
    variant="outlined"
    v-bind:ref="inputRef"
    v-bind:disabled="currencyInputProps.disabled"
    v-bind:label="currencyInputProps.label"
    v-bind:modelValue="formattedValue"
  ></v-text-field>
</template>
