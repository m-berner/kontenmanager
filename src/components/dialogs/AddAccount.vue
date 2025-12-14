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
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice, setStorage} = useBrowser()
const {add, isConnected} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {validateForm} = useValidation()
const {accountFormularData, formRef, reset} = useAccountFormular()
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

    const bookingTypes = [
        {cName: T.STRINGS.BUY, cAccountNumberID: accountId},
        {cName: T.STRINGS.SELL, cAccountNumberID: accountId},
        {cName: T.STRINGS.DIVIDEND, cAccountNumberID: accountId}
    ]
    const addedTypes: I_Booking_Type_Store[] = []

    try {
        for (const bookingType of bookingTypes) {
            const addBookingTypeID = await addBookingType(bookingType)

            if (addBookingTypeID === -1) {
                log('ADD_ACCOUNT: Failed to add booking type', {error: bookingType})
                // Rollback: remove previously added types
                for (const added of addedTypes) {
                    records.bookingTypes.remove(added.cID)
                }
                return false
            }

            const dbBookingType: I_Booking_Type_Store = {
                cID: addBookingTypeID,
                ...bookingType
            }
            records.bookingTypes.add(dbBookingType)
            addedTypes.push(dbBookingType)
        }
        return true
    } catch (error) {
        // Rollback on error
        for (const added of addedTypes) {
            records.bookingTypes.remove(added.cID)
        }
        throw error
    }
}

const onClickOk = async (): Promise<void> => {
    log('ADD_ACCOUNT: onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
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
                return
            }

            const completeAccount: I_Account_Store = {cID: addAccountID, ...account}
            records.accounts.add(completeAccount)

            activeAccountId.value = addAccountID
            await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.ACTIVE_ACCOUNT_ID, addAccountID)

            // Add booking types with rollback support
            const bookingTypesAdded = await addBookingTypesForAccount(addAccountID)

            if (!bookingTypesAdded) {
                // If booking types failed, we should ideally roll back the account too
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
            contained
            class="align-center justify-center">
            <v-progress-circular
                color="primary"
                indeterminate
                size="64"
            />
        </v-overlay>
    </v-form>
</template>
