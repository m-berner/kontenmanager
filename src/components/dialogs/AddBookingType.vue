<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_Type_Store} from '@/types'
import {defineExpose, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useBookingTypesDB()
const {nameRules, validateForm} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()

const formName = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_ADD: t('messages.addBookingType.success'),
            ERROR_DUPLICATE: t('messages.addBookingType.error'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.addBookingType.title'),
            BOOKING_TYPE_LABEL: t('components.dialogs.addBookingType.bookingTypeLabel'),
            PLACEHOLDER: t('components.dialogs.addBookingType.placeholder')
        },
        NAME_RULES: [
            t('validators.nameRules.required'),
            t('validators.nameRules.length'),
            t('validators.nameRules.begin')
        ]
    }
)

const reset = () => {
    formName.value = ''
}

const onClickOk = async (): Promise<void> => {
    log('ADD_BOOKING_TYPE: onClickOk')
    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return
    await withLoading(async () => {
        try {
            const trimmedName = formName.value.trim()
            if (records.bookingTypes.isDuplicate(trimmedName)) {
                await notice([T.MESSAGES.ERROR_DUPLICATE])
                return
            }

            const bookingType = {
                cName: trimmedName,
                cAccountNumberID: activeAccountId.value
            }

            const addBookingTypeID = await add(bookingType)

            if (addBookingTypeID === -1) {
                log('ADD_BOOKING_TYPE: Failed to create booking type')
                await notice([T.MESSAGES.ERROR_DUPLICATE])
                return
            }

            const dbBookingType: I_Booking_Type_Store = {
                cID: addBookingTypeID,
                ...bookingType
            }

            records.bookingTypes.add(dbBookingType)
            reset()
            await notice([T.MESSAGES.SUCCESS_ADD])

        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'ADD_BOOKING_TYPE',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
    log('ADD_BOOKING_TYPE: onBeforeMount')
    reset()
})

log('--- AddBookingType.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <v-text-field
            v-model="formName"
            :counter="32"
            :disabled="activeAccountId === -1"
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
            :placeholder="T.STRINGS.PLACEHOLDER"
            :rules="nameRules(T.NAME_RULES)"
            autofocus
            density="compact"
            variant="outlined"
            @focus="formRef?.resetValidation?.()"/>
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
