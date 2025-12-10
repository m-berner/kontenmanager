<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Account_Store} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useAccountFormular} from '@/composables/useAccountFormular'
import AccountFormular from '@/components/dialogs/formulars/AccountFormular.vue'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useAccountsDB()
const {validateForm} = useValidation()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {accountFormularData, formRef} = useAccountFormular()
const records = useRecordsStore()
const {items: accountItems} = storeToRefs(records.accounts)

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_UPDATE: t('messages.updateAccount.success'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('components.dialogs.updateAccount.title')
  }
})

const onClickOk = async (): Promise<void> => {
  log('UPDATE_ACCOUNT : onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    const account: I_Account_Store = {
      cID: activeAccountId.value,
      cSwift: accountFormularData.swift.trim().toUpperCase(),
      cIban: accountFormularData.iban.replace(/\s/g, ''),
      cLogoUrl: accountFormularData.logoUrl,
      cWithDepot: accountFormularData.withDepot
    }
    records.accounts.update(account)
    await update(account)
    runtime.resetTeleport()
    await notice([T.MESSAGES.SUCCESS_UPDATE])
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    log(T.MESSAGES.ERROR_ONCLICK_OK, {error: errorMessage})
    await notice([T.MESSAGES.ERROR_ONCLICK_OK, errorMessage])
  }
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
  log('UPDATE_ACCOUNT: onBeforeMount')
  const accountIndex = records.accounts.getIndexById(activeAccountId.value)
  if (accountIndex !== -1) {
    const currentAccount = accountItems.value[accountIndex]
    Object.assign(accountFormularData, {
      id: currentAccount.cID,
      swift: currentAccount.cSwift,
      iban: currentAccount.cIban,
      logoUrl: currentAccount.cLogoUrl,
      withDepot: currentAccount.cWithDepot
    })
  }
})

log('--- UpdateAccount.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <AccountFormular/>
  </v-form>
</template>
