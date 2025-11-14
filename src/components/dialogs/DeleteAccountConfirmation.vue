<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {deleteDatabaseWithAccount, getDatabaseStores} = useIndexedDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()

const MESSAGES = Object.freeze({
  INFO_TITLE: t('homePage.messages.infoTitle'),
  RESTRICTED_IMPORT: t('homePage.messages.restrictedImport')
})

const onClickOk = async (): Promise<void> => {
  log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')
  const {items: accountItems} = storeToRefs(records.accounts)
  try {
    await deleteDatabaseWithAccount(activeAccountId.value)
    records.accounts.remove(activeAccountId.value)
    if (accountItems.value.length > 0) {
      activeAccountId.value = accountItems.value[0].cID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, activeAccountId.value)
      const storesDB = await getDatabaseStores(activeAccountId.value)
      await records.init(storesDB, MESSAGES)
    } else {
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, -1)
    }
    resetTeleport()
    await notice([t('dialogs.deleteAccount.success')])
  } catch (e) {
    log('HEADER_BAR: onIconClick', {error: e})
    await notice([t('dialogs.deleteAccount.error')])
  }
}
const title = computed(() => t('dialogs.deleteAccount.title'))
defineExpose({onClickOk, title})

log('--- DeleteAccountConfirmation.vue setup ---')
</script>

<template>
  <v-alert v-if="records.accounts.items.length === 0">{{ t('dialogs.deleteAccount.message') }}</v-alert>
  <v-alert v-else type="warning">{{ t('dialogs.deleteAccount.confirm') }}</v-alert>
</template>
