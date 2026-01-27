<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {AppError, ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import {useStorage} from '@/composables/useStorage'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {databaseService} from '@/services/database'
import {BROWSER_STORAGE} from '@/config/storage'

const {t} = useI18n()
const {notice} = useBrowser()
const {setStorage} = useStorage()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const records = useRecordsStore()
const {items: accountItems} = storeToRefs(records.accounts)
const {isLoading, ensureConnected, withLoading} = useDialogGuards()

const switchToNextAccount = async (): Promise<void> => {
    if (accountItems.value.length === 0) {
        activeAccountId.value = -1
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, -1)
        return
    }

    const newActiveId = accountItems.value[0].cID
    activeAccountId.value = newActiveId!
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, newActiveId!)

    const storesDB = await databaseService.getAccountRecords(newActiveId!)
    await records.init(storesDB, {title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('DELETE_ACCOUNT_CONFIRMATION: onClickOk')

    if (!await ensureConnected(databaseService.isConnected(), notice, t('components.dialogs.deleteAccountConfirmation.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const accountToDelete = activeAccountId.value
            await databaseService.deleteAccountRecords(accountToDelete)
            records.accounts.remove(accountToDelete)

            await switchToNextAccount()

            resetTeleport()
            await notice([t('components.dialogs.deleteAccountConfirmation.messages.success')])
        } catch (err) {
            const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
            throw new AppError(
                ERROR_CODES.DELETE_ACCOUNT_CONFIRMATION,
                ERROR_CATEGORY.VALIDATION,
                {input: errorMessage, entity: 'DeleteAccountConfirmation'},
                true
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.deleteAccountConfirmation.title')})

UtilsService.log('--- DeleteAccountConfirmation.vue setup ---')
</script>

<template>
    <v-alert v-if="records.accounts.items.length === 0">{{ t('views.headerBar.messages.noAccount') }}</v-alert>
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
