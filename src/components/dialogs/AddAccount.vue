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
import {useValidation} from '@/composables/useValidation'
import {useAccountFormular} from '@/composables/useAccountFormular'
import AccountFormular from '@/components/dialogs/forms/AccountFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {add, isConnected, remove} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {validateForm} = useValidation()
const {accountFormularData, formRef, mapAccountFormToDb, reset} = useAccountFormular()
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()
const {resetTeleport} = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_ADD: t('messages.addAccount.success'),
            ERROR_ADD: t('messages.addAccount.error'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.addAccount.title'),
            BUY: t('names.bookingTypes.buy'),
            SELL: t('names.bookingTypes.sell'),
            DIVIDEND: t('names.bookingTypes.dividend')
        }
    }
)

const addBookingTypesForAccount = async (accountId: number): Promise<boolean> => {
    if (!accountFormularData.withDepot) return true

    const bookingTypes: I_Booking_Type_DB[] = [
        {cID: -1, cName: T.STRINGS.BUY, cAccountNumberID: accountId},
        {cID: -1, cName: T.STRINGS.SELL, cAccountNumberID: accountId},
        {cID: -1, cName: T.STRINGS.DIVIDEND, cAccountNumberID: accountId}
    ]
    const addedTypes: I_Booking_Type_DB[] = []

    try {
        for (const bookingType of bookingTypes) {
            delete bookingType.cID
            const addBookingTypeID = await addBookingType(bookingType)

            if (addBookingTypeID === -1) {
                log('ADD_ACCOUNT: Failed to add booking type', {error: bookingType})
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

    if (!validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const {activeAccountId} = storeToRefs(settings)

            const account = mapAccountFormToDb()
            delete account.cID
            const addAccountID = await add(account)

            if (addAccountID === -1) {
                log('ADD_ACCOUNT: onClickOk', {error: T.MESSAGES.ERROR_ADD})
                await notice([T.MESSAGES.ERROR_ADD])
                return
            }

            account.cID = addAccountID
            records.accounts.add(account)

            activeAccountId.value = addAccountID
            await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)

            // Add booking types with rollback support
            const bookingTypesAdded = await addBookingTypesForAccount(addAccountID)

            if (!bookingTypesAdded) {
                // If booking types failed, we should ideally roll back the account too
                await remove(addAccountID)
                records.accounts.remove(addAccountID)
                await notice([T.MESSAGES.ERROR_ADD])
                return
            }

            records.clean(false)
            resetTeleport()
            reset()
            await notice([T.MESSAGES.SUCCESS_ADD])
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'ADD_ACCOUNT',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
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
