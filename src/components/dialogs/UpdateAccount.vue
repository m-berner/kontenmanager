<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onMounted, reactive} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useNotification} from '@/composables/useNotification'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

interface IState {
  swift: string
  number: string
  logoUrl: string
  logoSearchName: string
  stockAccount: boolean
  isFormValid: boolean
}

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {updateAccount} = useIndexedDB()
const {valIbanRules, valSwiftRules, valBrandNameRules} = useValidation()
const settings = useSettingsStore()
const records = useRecordsStore()

const state: IState = reactive({
  swift: '',
  number: '',
  logoUrl: '',
  logoSearchName: '',
  stockAccount: false,
  isFormValid: false
})

const mResetState = () => {
  state.swift = ''
  state.number = ''
  state.logoUrl = ''
  state.logoSearchName = ''
  state.stockAccount = false
}
//TODO see AddAccount...
const onInputLogoUrl = () => {
  state.logoUrl = `${CONS.URLS.LOGO[0]}/${state.logoSearchName}/${CONS.URLS.LOGO[1]}`
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
        masked += ` ${withoutSpace.slice(i * 4, (i + 1) * 4)}`
      }
    }
    state.number = masked
  }
}

const onClickOk = async (): Promise<void> => {
  log('UPDATE_ACCOUNT : onClickOk')
  if (!state.isFormValid) {
    await notice(['Invalid Form!'])
    return
  }
  try {
    const account = {
      cID: settings.activeAccountId,
      cSwift: state.swift.trim().toUpperCase(),
      cNumber: state.number.replace(/\s/g, ''),
      cLogoUrl: state.logoUrl,
      cStockAccount: state.stockAccount
    }
    records.updateAccount(account)
    await updateAccount(account)
    await notice([t('dialogs.UpdateAccount.success')])
    mResetState()
  } catch (e) {
    log('UPDATE_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.updateAccount.error')])
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
  <v-form ref="form-ref" validate-on="submit" @submit.prevent>
    <v-switch
        v-model="state.stockAccount"
        :label="t('dialogs.updateAccount.stockAccountLabel')"
        color="red"
        variant="outlined"/>
    <v-text-field
        ref="swift-input"
        v-model="state.swift"
        :label="t('dialogs.updateAccount.swiftLabel')"
        :rules="valSwiftRules([t('validators.swiftRules', 0), t('validators.swiftRules', 1)])"
        autofocus
        required
        variant="outlined"
    />
    <v-text-field
        v-model="state.number"
        :label="t('dialogs.updateAccount.accountNumberLabel')"
        :placeholder="t('dialogs.updateAccount.accountNumberPlaceholder')"
        :rules="valIbanRules([t('validators.ibanRules', 0), t('validators.ibanRules', 1), t('validators.ibanRules', 2)])"
        required
        variant="outlined"
        @update:modelValue="onUpdateLogoSearchName"
    />
    <v-text-field
        v-model="state.logoSearchName"
        :label="t('dialogs.updateAccount.logoLabel')"
        :rules="valBrandNameRules([t('validators.brandNameRules', 0)])"
        placeholder="z. B. ing.com"
        required
        variant="outlined"
        @input="onInputLogoUrl"
    />
    <img :alt="CONS.URLS.LOGO[0]" :src="state.logoUrl"/>
  </v-form>
</template>
