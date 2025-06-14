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
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {CONS, log, notice, VALIDATORS} = useAppApi()
const formRef = useTemplateRef('form-ref')
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const state = reactive({
  _swift: '',
  _number: '',
  _logoUrl: '',
  _logoSearchName: '',
  _stockAccount: false
})

const onInput = () => {
  state._logoUrl = `https://cdn.brandfetch.io/${state._logoSearchName}/w/48/h/48?c=1idV74s2UaSDMRIQg-7`
}
const ibanMask = (iban: string) => {
  if (iban !== '') {
    const withoutSpace = iban.replace(/\s/g, '')
    const loops = Math.ceil(withoutSpace.length / 4)
    let masked = ''
    for (let i = 0; i < loops; i++) {
      if (i === 0) {
        masked = withoutSpace.slice(i * 4, (i + 1) * 4).toUpperCase()
      } else {
        masked += ' ' + withoutSpace.slice(i * 4, (i + 1) * 4)
      }
    }
    state._number = masked
  }
}

const ok = async (): Promise<void> => {
  log('ADD_ACCOUNT: ok')
  const formIs = await formRef.value!.validate()
  if (formIs.valid) {
    try {
      const account: Omit<IAccount, 'cID'> = {
        cSwift: state._swift.trim().toUpperCase(),
        cNumber: state._number.replace(/\s/g, ''),
        cLogoUrl: state._logoUrl,
        cLogoSearchName: state._logoSearchName,
        cStockAccount: state._stockAccount
      }
      const addAccountResponse = await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__ADD_ACCOUNT, data: account
      }))
      const addAccountData: IAccount = JSON.parse(addAccountResponse).data
      records.addAccount(addAccountData)
      runtime.setLogo()
      settings.setActiveAccountId(addAccountData.cID)
      await notice([t('dialogs.AddAccount.success')])
      formRef.value!.reset()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.addAccount.error')])
    }
  }
}
const title = t('dialogs.addAccount.title')

defineExpose({ok, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  formRef.value!.reset()
})

log('--- AddAccount.vue setup ---')
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
      @update:modelValue="ibanMask"
    ></v-text-field>
    <v-text-field
      v-model="state._logoSearchName"
      autofocus
      placeholder="z. B. ing.com"
      required
      v-bind:label="t('dialogs.addAccount.logoLabel')"
      v-bind:rules="VALIDATORS.brandNameRules([t('validators.brandNameRules', 0)])"
      variant="outlined"
      v-on:input="onInput"
    ></v-text-field>
    <img alt="logo" v-bind:src="state._logoUrl">
  </v-form>
</template>
