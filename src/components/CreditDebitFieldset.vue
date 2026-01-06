<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {computed, defineEmits, defineProps} from 'vue'
import CurrencyInput from '@/components/CurrencyInput.vue'
import type {I_Credit_Debit_Fieldset_Props} from '@/types'
import {useApp} from '@/composables/useApp'
import {useBookingFormular} from '@/composables/useBookingFormular'

const props = defineProps<I_Credit_Debit_Fieldset_Props>()
// eslint-disable-next-line vue/define-emits-declaration
const emit = defineEmits(['update:modelValue'])
const {t} = useI18n()
const {log} = useApp()
const {cdRef} = useBookingFormular()

const creditValue = computed(
    {
        get: () => props.modelValue.credit,
        set: (val: number) => {
            emit('update:modelValue', {
                credit: val,
                debit: props.modelValue.debit
            })
        }
    }
)
const debitValue = computed(
    {
        get: () => props.modelValue.debit,
        set: (val: number) => {
            emit('update:modelValue', {
                credit: props.modelValue.credit,
                debit: val
            })
        }
    }
)
const cRules = computed(() => props.rules[0](props.modelValue.debit))
const dRules = computed(() => props.rules[1](props.modelValue.credit))

log('--- CreditDebitFieldset.vue ---')
</script>

<template>
    <v-form ref="cdRef">
        <fieldset class="horizontal-fieldset">
            <legend>{{ props.legend }}</legend>
            <div class="fields-container">
                <CurrencyInput
                    v-model="creditValue"
                    :disabled="props.disabled"
                    :label="t('components.creditDebitFieldset.creditLabel')"
                    :rules="cRules"/>
                <CurrencyInput
                    v-model="debitValue"
                    :disabled="props.disabled"
                    :label="t('components.creditDebitFieldset.debitLabel')"
                    :rules="dRules"/>
            </div>
        </fieldset>
    </v-form>
</template>

<style scoped>
.horizontal-fieldset {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 9px 6px 0 6px;
}

.horizontal-fieldset legend {
    padding: 0 9px;
    font-weight: 500;
}

.fields-container {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.fields-container > * {
    flex: 1;
    min-width: 200px;
}
</style>
