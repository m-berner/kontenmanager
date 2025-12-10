<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Account_Store, I_Booking_Type_Store} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
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
const {add, isConnected} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {validateForm} = useValidation()
const {resetTeleport} = useRuntimeStore()
const {accountFormularData, formRef, reset} = useAccountFormular()
const settings = useSettingsStore()
const records = useRecordsStore()

const T = Object.freeze({
  MESSAGES: {
    SUCCESS_ADD: t('messages.addAccount.success'),
    ERROR_ADD: t('messages.addAccount.error'),
    ERROR_ONCLICK_OK: t('messages.onClickOk')
  },
  STRINGS: {
    TITLE: t('components.dialogs.addAccount.title'),
    BUY: t('components.dialogs.importDatabase.shareBuy'),
    SELL: t('components.dialogs.importDatabase.shareSell'),
    DIVIDEND: t('components.dialogs.importDatabase.dividend')
  }
})

const onClickOk = async (): Promise<void> => {
  log('ADD_ACCOUNT: onClickOk')
  if (!await validateForm(formRef)) return
  if (!isConnected.value) {
    await notice(['Database not connected'])
    return
  }
  try {
    const {activeAccountId} = storeToRefs(settings)
    const account = {
      cSwift: accountFormularData.swift.trim().toUpperCase(),
      cIban: accountFormularData.iban.replace(/\s/g, ''),
      cLogoUrl: accountFormularData.logoUrl,
      cWithDepot: accountFormularData.withDepot
    }
    const addAccountID = await add(account)
    if (addAccountID === -1) {
      log('ADD_ACCOUNT: onClickOk', {error: T.MESSAGES.ERROR_ADD})
      await notice([T.MESSAGES.ERROR_ADD])
    }
    const completeAccount: I_Account_Store = {cID: addAccountID, ...account}
    records.accounts.add(completeAccount)
    activeAccountId.value = addAccountID
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)
    records.clean(false)
    resetTeleport()
    const bookingTypes = []
    if (accountFormularData.withDepot) {
      bookingTypes.push({
        cName: T.STRINGS.BUY,
        cAccountNumberID: addAccountID
      })
      bookingTypes.push({
        cName: T.STRINGS.SELL,
        cAccountNumberID: addAccountID
      })
      bookingTypes.push({
        cName: T.STRINGS.DIVIDEND,
        cAccountNumberID: addAccountID
      })
    }
    for (let i = 0; i < bookingTypes.length; i++) {
      const addBookingTypeID: number = await addBookingType(bookingTypes[i])
      if (addBookingTypeID > -1) {
        const completeBookingType: I_Booking_Type_Store = {cID: addBookingTypeID, ...bookingTypes[i]}
        records.bookingTypes.add(completeBookingType)
        reset()
      }
    }
    await notice([T.MESSAGES.SUCCESS_ADD])
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    log(T.MESSAGES.ERROR_ONCLICK_OK, {error: errorMessage})
    await notice([T.MESSAGES.ERROR_ONCLICK_OK, errorMessage])
  }
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
  log('ADD_ACCOUNT: onBeforeMount')
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
