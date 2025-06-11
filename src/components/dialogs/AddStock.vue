<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive, useTemplateRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useAppApi} from '@/pages/background'

const {t} = useI18n()
const {CONS, log, notice, VALIDATORS} = useAppApi()
const formRef = useTemplateRef('form-ref')
const records = useRecordsStore()

const state = reactive({
  _swift: '',
  _number: '',
  _logoUrl: '',
  _brandFetchName: '',
  _stockAccount: 0
})

const ok = async (): Promise<void> => {
  log('ADD_STOCK: ok')
  const formIs = await formRef.value!.validate()
  const appMessagePort = browser.runtime.connect({ name: CONS.MESSAGES.PORT__APP })
  if (formIs.valid) {
    try {
      const stock = {
        cSwift: state._swift.trim().toUpperCase(),
        cNumber: state._number.replace(/\s/g, ''),
        cLogoUrl: state._logoUrl
      }
      records.addStock(stock)
      const onResponse = async (m: object): Promise<void> => {
        log('APPINDEX: onResponse', {info: Object.values(m)[1]})
        if (Object.values(m)[0] === CONS.MESSAGES.DB__ADD_STOCK__RESPONSE) {
          await notice([t('dialogs.addStock.success')])
        }
      }
      appMessagePort.onMessage.addListener(onResponse)
      appMessagePort.postMessage({
        type: CONS.MESSAGES.DB__ADD_STOCK, data: stock
      })
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
})

log('--- AddStock.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
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
  </v-form>
</template>
