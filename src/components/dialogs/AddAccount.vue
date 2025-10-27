<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount_Store} from '@/types.d'
import {computed, defineExpose, onMounted} from 'vue'
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
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {addAccount} = useAccountsDB()
const {validateForm} = useValidation()
const {resetTeleport} = useRuntime()
const {accountFormularData, formRef} = useAccountFormular()
const {activeAccountId} = useSettings()
const records = useRecordsStore()

const reset = (): void => {
  Object.assign(accountFormularData, {
    swift: '',
    iban: '',
    logoUrl: '',
    withDepot: false
  })
}

const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')
  if (!await validateForm(formRef)) return

  try {
    const account = {
      cSwift: accountFormularData.swift.trim().toUpperCase(),
      cIban: accountFormularData.iban.replace(/\s/g, ''),
      cLogoUrl: accountFormularData.logoUrl,
      cWithDepot: accountFormularData.withDepot
    }
    const addAccountID = await addAccount(account)
    if (addAccountID > -1) {
      const completeAccount: IAccount_Store = {cID: addAccountID, ...account}
      records.accounts.add(completeAccount)
      activeAccountId.value = addAccountID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)
      records.clean(false)
      resetTeleport()
      await notice([t('dialogs.addAccount.success')])
    }
  } catch (e) {
    log('ADD_ACCOUNT: onClickOk', {error: e})
    await notice([t('dialogs.addAccount.error')])
  }
}

const title = computed(() => t('dialogs.addAccount.title'))

defineExpose({onClickOk, title})

onMounted(() => {
  log('ADD_ACCOUNT: onMounted')
  reset()
})

log('--- AddAccount.vue setup ---')
</script>

<template>
  <v-form
      ref="formRef"
      validate-on="submit"
      @submit.prevent>
    <AccountFormular/>
  </v-form>
</template>
