<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useValidation} from '@/composables/useValidation'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {remove, isConnected} = useBookingTypesDB()
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()
const {validateForm} = useValidation()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const T = Object.freeze(
    {
        MESSAGES: {
            SUCCESS_DELETE: t('messages.deleteBookingType.success'),
            ERROR_IN_USE: t('messages.deleteBookingType.error'),
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.deleteBookingType.title'),
            BOOKING_TYPE_LABEL: t('components.dialogs.deleteBookingType.bookingTypeLabel'),
            PLACEHOLDER: t('components.dialogs.deleteBookingType.placeholder')
        }
    }
)

const selected = ref<number | undefined>()
const formRef = ref<HTMLFormElement | null>(null)

const canDeleteBookingType = (bookingTypeId: number): boolean => {
    return !records.bookings.hasBookingType(bookingTypeId)
}

const onClickOk = async (): Promise<void> => {
    log('DELETE_BOOKING_TYPE : onClickOk')

    if (!validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    if (!selected.value) {
        log('DELETE_BOOKING_TYPE: No booking type selected')
        return
    }

    await withLoading(async () => {
        try {
            if (!canDeleteBookingType(selected.value!)) {
                await notice([T.MESSAGES.ERROR_IN_USE])
                return
            }

            records.bookingTypes.remove(selected.value!)
            await remove(selected.value!)
            await notice([T.MESSAGES.SUCCESS_DELETE])
            runtime.resetTeleport()
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'DELETE_BOOKING_TYPE',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({title, onClickOk})

onBeforeMount(() => {
    log('DELETE_BOOKING_TYPE: onBeforeMount')
    selected.value = undefined
})

log('--- DeleteBookingType.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <v-select
            v-model="selected"
            :item-title="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.NAME"
            :item-value="CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID"
            :items="records.bookingTypes.items"
            :label="T.STRINGS.BOOKING_TYPE_LABEL"
            :placeholder="T.STRINGS.PLACEHOLDER"
            autocomplete
            autofocus
            clearable
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
