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
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/pages/background'

interface IState {
  swift: string
  number: string
  logoUrl: string
  logoSearchName: string
  stockAccount: boolean
}

const {t} = useI18n()
const {CONS, log, notice, valIbanRules, valSwiftRules, valBrandNameRules} = useApp()
const formRef = useTemplateRef('form-ref')
const settings = useSettingsStore()
const records = useRecordsStore()

const state: Reactive<IState> = reactive({
  swift: '',
  number: '',
  logoUrl: '',
  logoSearchName: '',
  stockAccount: false
})

const mResetState = () => {
  state.swift = ''
  state.number= ''
  state.logoUrl = ''
  state.logoSearchName = ''
  state.stockAccount = false
}
const onInputLogoUrl = () => {
  state.logoUrl = `https://cdn.brandfetch.io/${state.logoSearchName}/w/48/h/48?c=1idV74s2UaSDMRIQg-7`
}
const onUpdateLogoSearchName = (iban: string) => {
  if (iban) {
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
    state.number = masked
  }
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_ACCOUNT : onClickOk')
  if (!formRef.value) {
    console.error('Form ref is null')
    return
  }
  const formIs = await formRef.value.validate()
  if (formIs.valid) {
    try {
      const account = {
        cID: settings.activeAccountId,
        cSwift: state.swift.trim().toUpperCase(),
        cNumber: state.number.replace(/\s/g, ''),
        cLogoUrl: state.logoUrl,
        cStockAccount: state.stockAccount
      }
      records.updateAccount(account)
      await browser.runtime.sendMessage(JSON.stringify({
        type: CONS.MESSAGES.DB__UPDATE_ACCOUNT, data: account
      }))
      await notice([t('dialogs.UpdateAccount.success')])
      mResetState()
    } catch (e) {
      console.error(e)
      await notice([t('dialogs.updateAccount.error')])
    }
  }
}
const title = t('dialogs.updateAccount.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('UPDATE_ACCOUNT: onMounted')
  const accountIndex = records.getAccountIndexById(settings.activeAccountId)
  if (accountIndex !== -1) {
    const currentAccount = records.accounts[accountIndex]
    state.swift = currentAccount.cSwift
    state.number = currentAccount.cNumber
    state.logoUrl = currentAccount.cLogoUrl
    state.logoSearchName = ''
    state.stockAccount = currentAccount.cStockAccount
  }
})

log('--- UpdateAccount.vue setup ---')
</script>

<template>
  <v-form ref="form-ref" validate-on="submit" v-on:submit.prevent>
    <v-switch
      v-model="state.stockAccount"
      color="red"
      variant="outlined"
      v-bind:label="t('dialogs.updateAccount.stockAccountLabel')"></v-switch>
    <v-text-field
      ref="swift-input"
      v-model="state.swift"
      autofocus
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateAccount.swiftLabel')"
      v-bind:rules="valSwiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
    ></v-text-field>
    <v-text-field
      v-model="state.number"
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateAccount.accountNumberLabel')"
      v-bind:placeholder="t('dialogs.updateAccount.accountNumberPlaceholder')"
      v-bind:rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
      v-on:update:modelValue="onUpdateLogoSearchName"
    ></v-text-field>
    <v-text-field
      v-model="state.logoSearchName"
      placeholder="z. B. ing.com"
      required
      variant="outlined"
      v-bind:label="t('dialogs.updateAccount.logoLabel')"
      v-bind:rules="valBrandNameRules([t('validators.brandNameRules', 0)])"
      v-on:input="onInputLogoUrl"
    ></v-text-field>
    <img alt="brandfetch.com logo" v-bind:src="state.logoUrl">
  </v-form>
</template>
