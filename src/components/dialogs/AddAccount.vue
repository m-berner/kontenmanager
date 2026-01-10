<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_Type_DB} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingTypesDB} from '@/composables/useIndexedDB'
import {useAccountFormular} from '@/composables/useForms'
import AccountFormular from '@/components/dialogs/forms/AccountFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {BROWSER_STORAGE} = useAppConfig()
const {notice, setStorage} = useBrowser()
const {add, isConnected, remove} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {accountFormularData, formRef, mapAccountFormToDb, reset} = useAccountFormular()
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const addBookingTypesForAccount = async (accountId: number): Promise<boolean> => {
    if (!accountFormularData.withDepot) return true

    const bookingTypes: I_Booking_Type_DB[] = [
        {cID: -1, cName: t('components.dialogs.addAccount.bookingTypes.buy'), cAccountNumberID: accountId},
        {cID: -1, cName: t('components.dialog.addAccount.bookingTypes.sell'), cAccountNumberID: accountId},
        {cID: -1, cName: t('components.dialog.addAccount.bookingTypes.dividend'), cAccountNumberID: accountId}
    ]
    const addedTypes: I_Booking_Type_DB[] = []

    try {
        for (const bookingType of bookingTypes) {
            delete bookingType.cID
            const addBookingTypeID = await addBookingType(bookingType)

            if (addBookingTypeID === -1) {
                log('ADD_ACCOUNT: Failed to add booking type', bookingType)
                // Rollback: remove previously added types
                for (const added of addedTypes) {
                    records.bookingTypes.remove(added.cID!)
                }
                return false
            }

            bookingType.cID = addBookingTypeID
            records.bookingTypes.add(bookingType)
            addedTypes.push(bookingType)
        }
        return true
    } catch (error) {
        // Rollback on error
        for (const added of addedTypes) {
            records.bookingTypes.remove(added.cID!)
        }
        throw error
    }
}

const onClickOk = async (): Promise<void> => {
    log('ADD_ACCOUNT: onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, t('components.dialogs.addAccount.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const {activeAccountId} = storeToRefs(settings)

            const account = mapAccountFormToDb()
            delete account.cID
            const addAccountID = await add(account)

            if (addAccountID === -1) {
                log('ADD_ACCOUNT: onClickOk', t('components.dialogs.addAccount.messages.error'))
                await notice([t('components.dialogs.addAccount.messages.error')])
                return
            }

            account.cID = addAccountID
            records.accounts.add(account)

            activeAccountId.value = addAccountID
            await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, addAccountID)

            // Add booking types with rollback support
            const bookingTypesAdded = await addBookingTypesForAccount(addAccountID)

            if (!bookingTypesAdded) {
                // If booking types failed, we should ideally roll back the account too
                await remove(addAccountID)
                records.accounts.remove(addAccountID)
                await notice([t('components.dialogs.addAccount.messages.error')])
                return
            }

            records.clean(false)
            resetTeleport()
            reset()
            await notice([t('components.dialogs.addAccount.messages.success')])
        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.addAccount.title')})

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
        <AccountFormular :isUpdate="false"/>
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
