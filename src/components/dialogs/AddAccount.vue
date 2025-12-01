<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccount_Store, IBookingType_Store} from '@/types'
import {defineExpose, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useAccountFormular} from '@/composables/useAccountFormular'
import AccountFormular from '@/components/dialogs/formulars/AccountFormular.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {add} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {validateForm} = useValidation()
const {resetTeleport} = useRuntimeStore()
const {accountFormularData, formRef} = useAccountFormular()
const settings = useSettingsStore()
const records = useRecordsStore()

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_ADD: t('messages.addAccount.success'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('dialogs.addAccount.title'),
    BUY: t('dialogs.importDatabase.shareBuy'),
    SELL: t('dialogs.importDatabase.shareSell'),
    DIVIDEND: t('dialogs.importDatabase.dividend')
  }
})

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
    const {activeAccountId} = storeToRefs(settings)
    const account = {
      cSwift: accountFormularData.swift.trim().toUpperCase(),
      cIban: accountFormularData.iban.replace(/\s/g, ''),
      cLogoUrl: accountFormularData.logoUrl,
      cWithDepot: accountFormularData.withDepot
    }
    const addAccountID = await add(account)
    if (addAccountID > -1) {
      const completeAccount: IAccount_Store = {cID: addAccountID, ...account}
      records.accounts.add(completeAccount)
      activeAccountId.value = addAccountID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)
      records.clean(false)
      resetTeleport()
      if (accountFormularData.withDepot) {
        const bookingTypes = [
          {
            cName: T.STRINGS.BUY,
            cAccountNumberID: addAccountID
          },
          {
            cName: T.STRINGS.SELL,
            cAccountNumberID: addAccountID
          },
          {
            cName: T.STRINGS.DIVIDEND,
            cAccountNumberID: addAccountID
          }
        ]
        for (let i = 0; i < 3; i++) {
          const addBookingTypeID: number = await addBookingType(bookingTypes[i])
          if (addBookingTypeID > -1) {
            const completeBookingType: IBookingType_Store = {cID: i + 1, ...bookingTypes[i]}
            records.bookingTypes.add(completeBookingType)
            reset()
          }
        }
      }
      await notice([T.MESSAGES.SUCCESS_ADD])
    }
  } catch (e) {
    if (e instanceof Error) {
      log(T.MESSAGES.ERROR_ONCLICK_OK, {error: e.message})
      await notice([T.MESSAGES.ERROR_ONCLICK_OK, e.message])
    } else {
      throw new Error(`${T.MESSAGES.ERROR_ONCLICK_OK}: unknown`)
    }
  }
}
const title = T.STRINGS.TITLE
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
