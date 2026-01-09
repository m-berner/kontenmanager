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
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {BROWSER_STORAGE} = useAppConfig()
const {notice, setStorage} = useBrowser()
const {deleteDatabaseWithAccount, getDatabaseStores, isConnected} = useIndexedDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()
const {items: accountItems} = storeToRefs(records.accounts)
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()

const smImportOnly = {
    title: t('mixed.smImportOnly.title'),
    message: t('mixed.smImportOnly.message')
}

const switchToNextAccount = async (): Promise<void> => {
    if (accountItems.value.length === 0) {
        activeAccountId.value = -1
        await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, -1)
        return
    }

    const newActiveId = accountItems.value[0].cID
    activeAccountId.value = newActiveId!
    await setStorage(BROWSER_STORAGE.LOCAL.ACTIVE_ACCOUNT_ID.key, newActiveId!)

    const storesDB = await getDatabaseStores(newActiveId!)
    await records.init(storesDB, smImportOnly)
}

const onClickOk = async (): Promise<void> => {
    log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')

    if (!await ensureConnected(isConnected, notice, t('components.dialogs.deleteAccountConfirmation.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const accountToDelete = activeAccountId.value
            await deleteDatabaseWithAccount(accountToDelete)
            records.accounts.remove(accountToDelete)

            await switchToNextAccount()

            resetTeleport()
            await notice([t('components.dialogs.deleteAccountConfirmation.messages.success')])
        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.deleteAccountConfirmation.title')})

log('--- DeleteAccountConfirmation.vue setup ---')
</script>

<template>
    <v-alert v-if="records.accounts.items.length === 0">{{ t('screens.headerBar.messages.noAccount') }}</v-alert>
    <v-alert v-else type="warning">{{ t('components.dialogs.deleteAccountConfirmation.messages.confirm') }}</v-alert>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
        <v-progress-circular
            color="primary"
            indeterminate
            size="64"
        />
    </v-overlay>
</template>
