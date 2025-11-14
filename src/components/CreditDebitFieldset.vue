<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {computed} from 'vue'
import {useValidation} from '@/composables/useValidation'
import CurrencyInput from '@/components/CurrencyInput.vue'

interface CreditDebitFieldsetProps {
  modelValue: { credit: number, debit: number }
  disabled?: boolean,
  legend: string
}

const props = defineProps<CreditDebitFieldsetProps>()
// eslint-disable-next-line vue/define-emits-declaration
const emit = defineEmits(['update:modelValue'])
const {t} = useI18n()
const {isValidCredit, isValidDebit} = useValidation()

const creditValue = computed({
  get: () => props.modelValue.credit,
  set: (val: number) => {
    emit('update:modelValue', {
      credit: val,
      debit: props.modelValue.debit
    })
  }
})

const debitValue = computed({
  get: () => props.modelValue.debit,
  set: (val: number) => {
    emit('update:modelValue', {
      credit: props.modelValue.credit,
      debit: val
    })
  }
})

// Reaktive Rules - werden neu berechnet wenn sich der jeweils andere Wert ändert
const creditRules = computed(() => isValidCredit([t('dialogs.formular.onlyOnePositive'), t('dialogs.formular.notNegative')], props.modelValue.debit))
const debitRules = computed(() => isValidDebit([t('dialogs.formular.onlyOnePositive'), t('dialogs.formular.notNegative')], props.modelValue.credit))
</script>

<template>
  <fieldset class="horizontal-fieldset">
    <legend>{{ props.legend }}</legend>
    <div class="fields-container">
      <CurrencyInput
          v-model="creditValue"
          :disabled="props.disabled"
          :label="t('dialogs.formular.creditLabel')"
          :rules="creditRules"/>
      <CurrencyInput
          v-model="debitValue"
          :disabled="props.disabled"
          :label="t('dialogs.formular.debitLabel')"
          :rules="debitRules"/>
    </div>
  </fieldset>
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
