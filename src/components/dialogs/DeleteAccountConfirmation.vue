<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {deleteDatabaseWithAccount, getDatabaseStores} = useIndexedDB()
const {activeAccountId} = useSettings()
const records = useRecordsStore()

const onClickOk = async (): Promise<void> => {
  log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')
  try {
    records.clean(false)
    records.accounts.remove(activeAccountId.value)
    await deleteDatabaseWithAccount(activeAccountId.value)

    if (records.accounts.items.length > 0) {
      const storesDB = await getDatabaseStores()
      await records.init(storesDB)
    } else {
      activeAccountId.value = -1
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, -1)
    }
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
  <v-alert>{{ t('dialogs.deleteAccount.confirm') }}</v-alert>
</template>
