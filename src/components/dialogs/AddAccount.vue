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
import {useAppApi} from '@/pages/background'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

interface IState {
  swift: string
  accountNumber: string
  logoUrl: string
  logoSearchName: string
  stockAccount: boolean
}

const {t} = useI18n()
const {CONS, log, notice, VALIDATORS} = useAppApi()
const formRef = useTemplateRef('form-ref')
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const state: Reactive<IState> = reactive({
  swift: '',
  accountNumber: '',
  logoUrl: '',
  logoSearchName: '',
  stockAccount: false
})

const onInputLogoName = () => {
  state.logoUrl = `https://cdn.brandfetch.io/${state.logoSearchName}/w/48/h/48?c=1idV74s2UaSDMRIQg-7`
}
const onUpdateIbanMask = (iban: string) => {
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
    state.accountNumber = masked
  }
}
const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')
  const formIs = await formRef.value!.validate()
  if (formIs.valid) {
    try {
      const account: Omit<IAccount, 'cID'> = {
        cSwift: state.swift.trim().toUpperCase(),
        cNumber: state.accountNumber.replace(/\s/g, ''),
        cLogoUrl: state.logoUrl,
        cLogoSearchName: state.logoSearchName,
        cStockAccount: state.stockAccount
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
defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  formRef.value!.reset()
})

log('--- AddAccount.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-switch
      v-model="state.stockAccount"
      color="red"
      v-bind:label="t('dialogs.addAccount.stockAccountLabel')"></v-switch>
    <v-text-field
      ref="swift-input"
      v-model="state.swift"
      autofocus
      required
      v-bind:label="t('dialogs.addAccount.swiftLabel')"
      v-bind:rules="VALIDATORS.swiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
      variant="outlined"
    ></v-text-field>
    <v-text-field
      v-model="state.accountNumber"
      required
      v-bind:label="t('dialogs.addAccount.accountNumberLabel')"
      v-bind:placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
      v-bind:rules="VALIDATORS.ibanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      variant="outlined"
      @update:modelValue="onUpdateIbanMask"
    ></v-text-field>
    <v-text-field
      v-model="state.logoSearchName"
      autofocus
      placeholder="z. B. ing.com"
      required
      v-bind:label="t('dialogs.addAccount.logoLabel')"
      v-bind:rules="VALIDATORS.brandNameRules([t('validators.brandNameRules', 0)])"
      variant="outlined"
      v-on:input="onInputLogoName"
    ></v-text-field>
    <img alt="logo" v-bind:src="state.logoUrl">
  </v-form>
</template>
