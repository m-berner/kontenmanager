<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {deleteDatabaseWithAccount, getDatabaseStores, isConnected} = useIndexedDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()
const {items: accountItems} = storeToRefs(records.accounts)
const {ensureConnected, handleError, withLoading} = useDialogGuards()

const T = Object.freeze(
    {
        MESSAGES: {
            INFO_TITLE: t('messages.infoTitle'),
            RESTRICTED_IMPORT: t('messages.restrictedImport'),
            SUCCESS_DELETE: t('messages.deleteAccountConfirmation.success'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            NO_ACCOUNT: t('messages.noAccount'),
            CONFIRM: t('messages.deleteAccountConfirmation.confirm'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.deleteAccountConfirmation.title')
        }
    }
)

const switchToNextAccount = async (): Promise<void> => {
    if (accountItems.value.length === 0) {
        activeAccountId.value = -1
        await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, -1)
        return
    }

    const newActiveId = accountItems.value[0].cID
    activeAccountId.value = newActiveId
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, newActiveId)

    const storesDB = await getDatabaseStores(newActiveId)
    await records.init(storesDB, T.MESSAGES)
}

const onClickOk = async (): Promise<void> => {
    log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')

    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const accountToDelete = activeAccountId.value

            await deleteDatabaseWithAccount(accountToDelete)
            records.accounts.remove(accountToDelete)

            await switchToNextAccount()

            resetTeleport()
            await notice([T.MESSAGES.SUCCESS_DELETE])
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'DELETE_ACCOUNT_CONFIRMATION',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

log('--- DeleteAccountConfirmation.vue setup ---')
</script>

<template>
    <v-alert v-if="records.accounts.items.length === 0">{{ T.MESSAGES.NO_ACCOUNT }}</v-alert>
    <v-alert v-else type="warning">{{ T.MESSAGES.CONFIRM }}</v-alert>
</template>
