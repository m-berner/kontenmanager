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
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {INDEXED_DB} = useAppConfig()
const {notice} = useBrowser()
const {remove, isConnected} = useBookingTypesDB()
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const selected = ref<number | undefined>()
const formRef = ref<HTMLFormElement | null>(null)

const canDeleteBookingType = (bookingTypeId: number): boolean => {
    return !records.bookings.hasBookingType(bookingTypeId)
}

const onClickOk = async (): Promise<void> => {
    log('DELETE_BOOKING_TYPE : onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, t('components.dialogs.deleteBookingType.messages.dbNotConnected'))) return

    if (!selected.value) {
        log('DELETE_BOOKING_TYPE: No booking type selected')
        return
    }

    await withLoading(async () => {
        try {
            if (!canDeleteBookingType(selected.value!)) {
                await notice([t('components.dialogs.deleteBookingType.messages.error')])
                return
            }

            records.bookingTypes.remove(selected.value!)
            await remove(selected.value!)
            await notice([t('components.dialogs.deleteBookingType.messages.success')])
            runtime.resetTeleport()
        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.deleteBookingType.title')})

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
            :item-title="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.NAME"
            :item-value="INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID"
            :items="records.bookingTypes.items"
            :label="t('components.dialogs.deleteBookingType.bookingTypeLabel')"
            :placeholder="t('components.dialogs.deleteBookingType.placeholder')"
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
