<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import CurrencyInput from '@/components/childs/CurrencyInput.vue'

interface CreditDebitFieldsetProps {
  creditModelValue: number,
  debitModelValue: number,
  disabled?: boolean,
  legend: string
}

const creditDebitFieldsetProps = defineProps<CreditDebitFieldsetProps>()
const {t} = useI18n()
</script>

<template>
  <fieldset class="horizontal-fieldset">
    <legend>{{ creditDebitFieldsetProps.legend }}</legend>
    <div class="fields-container">
      <CurrencyInput
          v-bind="creditDebitFieldsetProps"
          v-model="creditDebitFieldsetProps.creditModelValue"
          :label="t('dialogs.formular.credit')"
      />
      <CurrencyInput
          v-bind="creditDebitFieldsetProps"
          v-model="creditDebitFieldsetProps.debitModelValue"
          :label="t('dialogs.formular.debit')"
      />
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
