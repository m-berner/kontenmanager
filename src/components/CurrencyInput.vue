<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineProps, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useBookingFormular} from '@/composables/useForms'
import type {I_Currency_Input_Props} from '@/types'
import {useApp} from '@/composables/useApp'

const props = defineProps<I_Currency_Input_Props>()
// eslint-disable-next-line vue/define-emits-declaration
const emit = defineEmits(['update:modelValue'])
const {n} = useI18n()
const {formRef} = useBookingFormular()
const {log} = useApp()

const unformattedValue = ref<number>(props.modelValue)
const formattedValue = ref<string>('')
const isFocused = ref<boolean>(false)

const wrappedRules = computed(() => {
    if (!props.rules) return undefined
    return props.rules.map(rule => {
        return (v: string) => {
            const numValue = parseCurrency(v)
            return rule(numValue)
        }
    })
})

// Watch für prop changes
watch(() => props.modelValue, (newVal) => {
    if (!isFocused.value) {
        formattedValue.value = formatCurrency(newVal)
    }
})

const formatCurrency = (value: number): string => {
    if (!value || value === 0) return ''
    return n(value, 'currency')
}

const parseCurrency = (value: string): number => {
    if (!value) return 0
    return Number.parseFloat(value.replace(/[^0-9.-]+/g, ''))
}

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
    const parsed = parseCurrency(formattedValue.value)
    emit('update:modelValue', parsed)
    formattedValue.value = formatCurrency(parsed)
}

const onInput = (ev: Event): void => {
    if (ev.target instanceof HTMLInputElement && isFocused.value) {
        formattedValue.value = ev.target.value.replace(',', '.')
    }
}

onMounted(() => {
    log('CURRENCY_INPUT: onMounted')
    formattedValue.value = formatCurrency(props.modelValue)
})

log('--- CurrencyInput.vue ---')
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
        @focus="formRef?.resetValidation?.(); onFocus()"
        @input="onInput"
    />
</template>
