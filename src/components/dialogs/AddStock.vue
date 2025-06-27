<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, type Reactive, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useAppApi} from '@/pages/background'

interface IState {
  _isin: string
  _company: string
  _wkn: string
  _symbol: string
  _auto: boolean
}

const {t} = useI18n()
const {CONS, log, notice, VALIDATORS} = useAppApi()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()

const state: Reactive<IState> = reactive({
  _isin: '',
  _company: '',
  _wkn: '',
  _symbol: '',
  _auto: true
})

const onIsin = async (): Promise<void> => {
  console.log('ADD_STOCK: onIsin')
  if (state._isin !== '' && state._isin?.length === 12) {
    const addStockResponse = await browser.runtime.sendMessage(JSON.stringify({
      type: CONS.MESSAGES.FETCH__COMPANY_DATA,
      data: state._isin
    }))
    const addStock = JSON.parse(addStockResponse).data
    state._company = addStock.company
    state._wkn = addStock.wkn.toUpperCase()
    state._symbol = addStock.symbol.toUpperCase()
  }
}
const ok = async (): Promise<void> => {
  log('ADD_STOCK: ok')
  const formIs = await formRef.value!.validate()
  if (formIs.valid) {
    try {
      const stock = {
        cCompany: state._company.trim(),
        cISIN: state._isin,
        cWKN: state._wkn,
        cSymbol: state._symbol,
      }
      records.addStock(stock)
      const addStockResponse = await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__ADD_STOCK, data: stock
      }))
      const addStockData: IStock = JSON.parse(addStockResponse).data
      records.addStock(addStockData)
      await notice([t('dialogs.AddStock.success')])
      formRef.value!.reset()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.addStock.error')])
    }
  }
}
const title = t('dialogs.addStock.title')

defineExpose({ok, title})

onMounted(() => {
  log('ADD_STOCK: onMounted')
  formRef.value!.reset()
  state._auto = true
})

log('--- AddStock.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-switch v-model="state._auto" color="secondary" hide-details label="Auto"
                v-on:click="state._auto = !state._auto"></v-switch>
      <v-text-field
        v-model="state._isin"
        autofocus
        required
        v-bind:counter="12"
        v-bind:label="t('dialogs.addStock.isin')"
        v-bind:rules="VALIDATORS.ibanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
        variant="outlined"
        v-on:focus="formRef?.resetValidation"
        v-on:update:modelValue="onIsin"
      ></v-text-field>
      <v-text-field
        v-model="state._company"
        required
        v-bind:disabled="state._auto"
        v-bind:label="t('dialogs.addStock.company')"
        variant="outlined"
      ></v-text-field>
      <v-text-field
        v-model="state._wkn"
        required
        v-bind:disabled="state._auto"
        v-bind:label="t('dialogs.addStock.wkn')"
        variant="outlined"
      ></v-text-field>
      <v-text-field
        v-model="state._symbol"
        required
        v-bind:disabled="state._auto"
        v-bind:label="t('dialogs.addStock.symbol')"
        variant="outlined"
      ></v-text-field>
    </v-card-text>
  </v-form>
  <!--<v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-switch
      v-model="state._stockAccount"
      color="red"
      v-bind:label="t('dialogs.addAccount.stockAccountLabel')"></v-switch>
    <v-text-field
      ref="swift-input"
      v-model="state._swift"
      autofocus
      required
      v-bind:label="t('dialogs.addAccount.swiftLabel')"
      v-bind:rules="VALIDATORS.swiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._number"
      required
      v-bind:label="t('dialogs.addAccount.accountNumberLabel')"
      v-bind:placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
      v-bind:rules="VALIDATORS.ibanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state._brandFetchName"
      autofocus
      placeholder="z. B. ing.com"
      required
      v-bind:label="t('dialogs.addAccount.logoLabel')"
      v-bind:rules="VALIDATORS.brandNameRules([t('validators.brandNameRules', 0)])"
      variant="outlined"
    ></v-text-field>
  </v-form>-->
</template>
