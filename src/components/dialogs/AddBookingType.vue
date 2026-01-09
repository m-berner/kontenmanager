<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_Type_DB} from '@/types'
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
const {nameRules} = useValidation()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const formName = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

const NAME_RULES = [
    t('validators.nameRules.required'),
    t('validators.nameRules.length'),
    t('validators.nameRules.begin')
]

const reset = () => {
    formName.value = ''
}

const onClickOk = async (): Promise<void> => {
    log('ADD_BOOKING_TYPE: onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, t('components.dialogs.addBookingType.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const trimmedName = formName.value.trim()
            if (records.bookingTypes.isDuplicate(trimmedName)) {
                await notice([t('components.dialogs.addBookingType.messages.error')])
                return
            }

            const bookingType: I_Booking_Type_DB = {
                cID: -1,
                cName: trimmedName,
                cAccountNumberID: activeAccountId.value
            }
            delete bookingType.cID
            const addBookingTypeID = await add(bookingType)

            if (addBookingTypeID === -1) {
                log('ADD_BOOKING_TYPE: Failed to create booking type')
                await notice([t('components.dialogs.addBookingType.messages.error')])
                return
            }

            bookingType.cID = addBookingTypeID
            records.bookingTypes.add(bookingType)
            reset()
            await notice([t('components.dialogs.addBookingType.messages.success')])

        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.addBookingType.title')})

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
            :label="t('components.dialogs.addBookingType.bookingTypeLabel')"
            :placeholder="t('components.dialogs.addBookingType.placeholder')"
            :rules="nameRules(NAME_RULES)"
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
