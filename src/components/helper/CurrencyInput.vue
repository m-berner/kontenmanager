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
  //modelValue: number
  options: CurrencyInputOptions
  label: string
  disabled?: boolean
}

const _props = defineProps<CurrencyInputProps>()
const {inputRef, formattedValue} = useCurrencyInput(_props.options)
</script>

<template>
  <v-text-field
    v-bind:ref="inputRef"
    density="compact"
    type="text"
    v-bind:disabled="_props.disabled"
    v-bind:label="_props.label"
    v-bind:modelValue="formattedValue"
    variant="outlined"
  ></v-text-field>
</template>
