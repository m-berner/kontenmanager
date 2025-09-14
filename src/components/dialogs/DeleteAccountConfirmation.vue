<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {deleteAccountDatabase} = useIndexedDB()
const settings = useSettingsStore()
const records = useRecordsStore()

const onClickOk = async (): Promise<void> => {
  log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')
  try {
    const activeId = settings.activeAccountId
    records.clean(false)
    records.accounts.remove(activeId)
    await deleteAccountDatabase(activeId)

    if (records.accounts.items.length > 0) {
      settings.activeAccountId = records.accounts.items[0].cID
      await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, records.accounts.items[0].cID)
      await records.init()
    } else {
      settings.activeAccountId = -1
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
