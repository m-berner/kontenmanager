<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type {BookingTypeDb, FormInterface} from '@/types'
import {onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {AppError, serializeError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import {useStorage} from '@/composables/useStorage'
import {useAccountsDB, useBookingTypesDB} from '@/composables/useIndexedDB'
import {useAccountForm} from '@/composables/useForms'
import AccountForm from '@/components/dialogs/forms/AccountForm.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {databaseService} from '@/services/database'
import {BROWSER_STORAGE} from '@/config/storage'
import {ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'

const {t} = useI18n()
const {notice} = useBrowser()
const {setStorage} = useStorage()
const {add, remove} = useAccountsDB()
const {add: addBookingType} = useBookingTypesDB()
const {accountFormData, mapAccountFormToDb, reset} = useAccountForm()
const {isLoading, submitGuard} = useDialogGuards()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()
const formRef = ref<FormInterface | null>(null)

const addBookingTypesForAccount = async (accountId: number): Promise<boolean> => {
    if (!accountFormData.withDepot) return true

    const bookingTypes: Omit<BookingTypeDb, 'cID'>[] = [
        {
            cName: UtilsService.normalizeBookingTypeName(t('components.dialogs.addAccount.bookingTypes.buy')),
            cAccountNumberID: accountId
        },
        {
            cName: UtilsService.normalizeBookingTypeName(t('components.dialog.addAccount.bookingTypes.sell')),
            cAccountNumberID: accountId
        },
        {
            cName: UtilsService.normalizeBookingTypeName(t('components.dialog.addAccount.bookingTypes.dividend')),
            cAccountNumberID: accountId
        }
    ]
    const addedTypes: BookingTypeDb[] = []

    try {
        for (const bookingType of bookingTypes) {
            delete (bookingType as Partial<BookingTypeDb>).cID
            const addBookingTypeID = await addBookingType(bookingType as Omit<BookingTypeDb, 'cID'>)

            if (addBookingTypeID === -1) {
                UtilsService.log('ADD_ACCOUNT: Failed to add booking type', bookingType)
                // Rollback: remove previously added types
                for (const added of addedTypes) {
                    records.bookingTypes.remove(added.cID)
                }
                return false
            }

            const bookingTypeWithId = {cID: addBookingTypeID, ...bookingType}
            records.bookingTypes.add(bookingTypeWithId)
            addedTypes.push(bookingTypeWithId)
        }
        return true
    } catch (err) {
        for (const added of addedTypes) {
            records.bookingTypes.remove(added.cID)
        }
        throw new AppError(
            ERROR_CODES.ADD_ACCOUNT,
            ERROR_CATEGORY.VALIDATION,
            {input: serializeError(err), entity: 'AddAccount'},
            true
        )
    }
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('ADD_ACCOUNT: onClickOk')

    await submitGuard(
        {
            formRef,
            isConnected: databaseService.isConnected(),
            connectionErrorMessage: t('components.dialogs.addAccount.messages.dbNotConnected'),
            notice,
            errorContext: 'ADD_ACCOUNT',
            errorTitle: t('components.dialogs.onClickOk'),
            operation: async () => {
                const {activeAccountId} = storeToRefs(settings)

                const accountData = mapAccountFormToDb()
                const addAccountID = await add(accountData)

                if (addAccountID === -1) {
                    UtilsService.log('ADD_ACCOUNT: onClickOk', t('components.dialogs.addAccount.messages.error'))
                    await notice([t('components.dialogs.addAccount.messages.error')])
                    return
                }

                records.accounts.add({...accountData, cID: addAccountID})

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
                runtime.resetTeleport()
                await notice([t('components.dialogs.addAccount.messages.success')])
            }
        }
    )
}

defineExpose({onClickOk, title: t('components.dialogs.addAccount.title')})

onBeforeMount(() => {
    UtilsService.log('ADD_ACCOUNT: onBeforeMount')
    reset()
})

UtilsService.log('--- AddAccount.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <AccountForm :isUpdate="false"/>
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
