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
import {useApp} from '@/apis/useApp'
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
const {CONS, log, notice, valIbanRules, valSwiftRules, valBrandNameRules} = useApp()
const formRef = useTemplateRef<HTMLFormElement>('form-ref')
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

const mResetState = (): void => {
  state.swift = ''
  state.accountNumber = ''
  state.logoUrl = ''
  state.logoSearchName = ''
  state.stockAccount = false
}
const onInputLogoName = (): void => {
  if (state.logoSearchName && state.logoSearchName.trim()) {
    state.logoUrl = `https://cdn.brandfetch.io/${state.logoSearchName.trim()}/w/48/h/48?c=1idV74s2UaSDMRIQg-7`
  } else {
    state.logoUrl = ''
  }
}
const onUpdateIbanMask = (iban: string): void => {
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
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
    try {
      const account: Omit<IAccount, 'cID'> = {
        cSwift: state.swift.trim().toUpperCase(),
        cNumber: state.accountNumber.replace(/\s/g, ''),
        cLogoUrl: state.logoUrl,
        cStockAccount: state.stockAccount
      }
      const addAccountResponse = await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__ADD_ACCOUNT, data: account
      }))
      const addAccountData: IAccount = JSON.parse(addAccountResponse).data
      records.addAccount(addAccountData)
      settings.setActiveAccountId(addAccountData.cID)
      await notice([t('dialogs.AddAccount.success')])
      mResetState()
      runtime.resetTeleport()
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
  mResetState()
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
      v-model="state.swift"
      autofocus
      required
      variant="outlined"
      v-bind:label="t('dialogs.addAccount.swiftLabel')"
      v-bind:rules="valSwiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
    ></v-text-field>
    <v-text-field
      v-model="state.accountNumber"
      required
      variant="outlined"
      v-bind:label="t('dialogs.addAccount.accountNumberLabel')"
      v-bind:placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
      v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      v-on:update:modelValue="onUpdateIbanMask"
    ></v-text-field>
    <v-text-field
      v-model="state.logoSearchName"
      placeholder="z. B. ing.com"
      required
      variant="outlined"
      v-bind:label="t('dialogs.addAccount.logoLabel')"
      v-bind:rules="valBrandNameRules([t('validators.brandNameRules', 0)])"
      v-on:input="onInputLogoName"
    ></v-text-field>
    <img
      alt="logo"
      style="max-width: 48px; max-height: 48px;"
      v-bind:src="state.logoUrl">
  </v-form>
</template>
