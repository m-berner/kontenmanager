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
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
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
const {sendMessage} = useBrowser()
const formRef = useTemplateRef<HTMLFormElement>('form-ref')
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const state: IState = reactive({
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
    state.logoUrl = `${CONS.URLS.LOGO[0]}/${state.logoSearchName.trim()}/${CONS.URLS.LOGO[1]}`
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
  const formIs = formRef.value.validate()
  if (formIs.valid) {
    try {
      const account: Omit<IAccount, 'cID'> = {
        cSwift: state.swift.trim().toUpperCase(),
        cNumber: state.accountNumber.replace(/\s/g, ''),
        cLogoUrl: state.logoUrl,
        cStockAccount: state.stockAccount
      }
      const addAccountResponse = await sendMessage(JSON.stringify({
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
  <v-form ref="form-ref" validate-on="submit" @submit.prevent>
    <v-switch
        v-model="state.stockAccount"
        :label="t('dialogs.addAccount.stockAccountLabel')"
        color="red"></v-switch>
    <v-text-field
        v-model="state.swift"
        :label="t('dialogs.addAccount.swiftLabel')"
        :rules="valSwiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
        autofocus
        required
        variant="outlined"
    ></v-text-field>
    <v-text-field
        v-model="state.accountNumber"
        :label="t('dialogs.addAccount.accountNumberLabel')"
        :placeholder="t('dialogs.addAccount.accountNumberPlaceholder')"
        :rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
        required
        variant="outlined"
        @update:modelValue="onUpdateIbanMask"
    ></v-text-field>
    <v-text-field
        v-model="state.logoSearchName"
        :label="t('dialogs.addAccount.logoLabel')"
        :rules="valBrandNameRules([t('validators.brandNameRules', 0)])"
        placeholder="z. B. ing.com"
        required
        variant="outlined"
        @input="onInputLogoName"
    ></v-text-field>
    <img
        :src="state.logoUrl"
        alt="logo"
        style="max-width: 48px; max-height: 48px;">
  </v-form>
</template>
