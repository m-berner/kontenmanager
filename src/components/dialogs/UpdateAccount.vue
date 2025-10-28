<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount_Store} from '@/types.d'
import {defineExpose, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useAccountFormular} from '@/composables/useAccountFormular'
import {useRecordsStore} from '@/stores/records'
import AccountFormular from '@/components/dialogs/formulars/AccountFormular.vue'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update} = useAccountsDB()
const {validateForm} = useValidation()
const settings = useSettings()
const runtime = useRuntime()
const {accountFormularData, formRef} = useAccountFormular()
const records = useRecordsStore()

const onClickOk = async (): Promise<void> => {
  log('UPDATE_ACCOUNT : onClickOk')
  if (!await validateForm(formRef)) return
  try {
    const account: IAccount_Store = {
      cID: settings.activeAccountId.value,
      cSwift: accountFormularData.swift.trim().toUpperCase(),
      cIban: accountFormularData.iban.replace(/\s/g, ''),
      cLogoUrl: accountFormularData.logoUrl,
      cWithDepot: accountFormularData.withDepot
    }
    records.accounts.update(account)
    await update(account)
    runtime.resetTeleport()
    await notice([t('dialogs.updateAccount.success')])
  } catch (e) {
    log('UPDATE_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.updateAccount.catch')])
  }
}
const title = t('dialogs.updateAccount.title')
defineExpose({onClickOk, title})

onMounted(() => {
  log('UPDATE_ACCOUNT: onMounted')
  const accountIndex = records.accounts.getIndexById(settings.activeAccountId.value)
  if (accountIndex !== -1) {
    const currentAccount = records.accounts.items[accountIndex]
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
