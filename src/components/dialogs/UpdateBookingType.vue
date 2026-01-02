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
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {INDEXED_DB} = useAppConfig()
const {notice} = useBrowser()
const {update, isConnected} = useBookingTypesDB()
const {nameRules} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const {items: bookingTypeItems} = storeToRefs(records.bookingTypes)
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_UPDATE: t('messages.updateBookingType.success'),
            ERROR_DUPLICATE: t('messages.updateBookingType.error'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.updateBookingType.title'),
            BOOKING_TYPE_LABEL: t('components.dialogs.updateBookingType.bookingTypeLabel')
        },
        NAME_RULES: [
            t('validators.nameRules.required'),
            t('validators.nameRules.length'),
            t('validators.nameRules.begin')
        ]
    }
)

const formSelectedIndex = ref<number | undefined>()
const formName = ref<string>('')
const formVisible = ref<boolean>(true)
const formRef = ref<HTMLFormElement | null>(null)

const onSelect = () => {
    if (!formSelectedIndex.value) return
    const index = records.bookingTypes.getIndexById(formSelectedIndex.value)
    if (index === -1) return
    formName.value = bookingTypeItems.value[index].cName
    formVisible.value = false
}

const isDuplicateName = (name: string, currentId: number): boolean => {
    const trimmedName = name.trim()
    return records.bookingTypes.items.some(
        item => item.cName === trimmedName && item.cID !== currentId
    )
}

const buildBookingTypeFromForm = (index: number): I_Booking_Type_Store => ({
    cID: bookingTypeItems.value[index].cID,
    cName: formName.value.trim(),
    cAccountNumberID: bookingTypeItems.value[index].cAccountNumberID
})

const onClickOk = async (): Promise<void> => {
    log('UPDATE_BOOKING_TYPE: onClickOk')
    if (!await validateForm(formRef)) return
    if (!formSelectedIndex.value) {
        await notice(['No booking type selected'])
        return
    }
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const index = records.bookingTypes.getIndexById(formSelectedIndex.value!)
            if (index === -1) {
                await notice(['Booking type not found'])
                return
            }

            if (isDuplicateName(formName.value, formSelectedIndex.value!)) {
                await notice([T.MESSAGES.ERROR_DUPLICATE])
                return
            }

            const bookingType = buildBookingTypeFromForm(index)

            records.bookingTypes.update(bookingType)
            await update(bookingType)
            runtime.resetTeleport()
            await notice([T.MESSAGES.SUCCESS_UPDATE])

        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'UPDATE_BOOKING_TYPE',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
    log('UPDATE_BOOKING_TYPE: onBeforeMount')
    formSelectedIndex.value = undefined
    formName.value = ''
    formVisible.value = true
})

log('--- UpdateBookingType.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <v-text-field
            v-if="!formVisible"
            v-model="formName"
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
            :rules="nameRules(T.NAME_RULES)"
            density="compact"
            variant="outlined"
            @focus="formRef?.resetValidation?.()"
            @update:model-value="(mValue) => {if (mValue === null) { formSelectedIndex = 0 }}"
        />
        <v-select
            v-if="formVisible"
            v-model="formSelectedIndex"
            :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
            :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
            :items="records.bookingTypes.items"
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
            :menu="true"
            :menu-props="{ maxHeight: '200px' }"
            density="compact"
            placeholder=""
            variant="outlined"
            @focus="formRef?.resetValidation?.()"
            @update:model-value="onSelect"/>
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
