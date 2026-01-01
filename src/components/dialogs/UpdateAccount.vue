<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB} from '@/composables/useIndexedDB'
import {useAccountFormular} from '@/composables/useAccountFormular'
import AccountFormular from '@/components/dialogs/forms/AccountFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useAccountsDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {resetTeleport} = useRuntimeStore()
const {accountFormularData, formRef, mapAccountFormToDb} = useAccountFormular()
const records = useRecordsStore()
const {items: accountItems} = storeToRefs(records.accounts)
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_UPDATE: t('messages.updateAccount.success'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.updateAccount.title')
        }
    }
)

const loadCurrentAccount = (): void => {
    const accountIndex = records.accounts.getIndexById(activeAccountId.value)
    if (accountIndex === -1) {
        log('UPDATE_ACCOUNT: Account not found', {error: activeAccountId.value})
        return
    }
    const currentAccount = accountItems.value[accountIndex]
    Object.assign(accountFormularData, {
        id: currentAccount.cID,
        swift: currentAccount.cSwift,
        iban: currentAccount.cIban,
        logoUrl: currentAccount.cLogoUrl,
        withDepot: currentAccount.cWithDepot
    })
}

const onClickOk = async (): Promise<void> => {
    log('UPDATE_ACCOUNT: onClickOk')
    if (!validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const account = mapAccountFormToDb(activeAccountId.value)
            records.accounts.update(account)
            await update(account)
            await notice([T.MESSAGES.SUCCESS_UPDATE])
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'UPDATE_ACCOUNT',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
    resetTeleport()
}
const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
    log('UPDATE_ACCOUNT: onBeforeMount')
    loadCurrentAccount()
})

log('--- UpdateAccount.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <AccountFormular :isUpdate="true"/>
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
    </v-form>
</template>
