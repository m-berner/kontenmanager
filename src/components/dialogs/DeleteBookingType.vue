<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {AppError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingTypesDB} from '@/composables/useIndexedDB'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {databaseService} from '@/services/database'
import {SYSTEM} from '@/domains/config/system'
import BookingTypeForm from '@/components/dialogs/forms/BookingTypeForm.vue'
import {useBookingTypeForm} from '@/composables/useForms'

const {bookingTypeFormData, reset} = useBookingTypeForm()
const {t} = useI18n()
const {notice} = useBrowser()
const {remove} = useBookingTypesDB()
const {isLoading, ensureConnected, withLoading} = useDialogGuards()
const records = useRecordsStore()
const runtime = useRuntimeStore()

const canDeleteBookingType = (bookingTypeId: number): boolean => {
    return !records.bookings.hasBookingType(bookingTypeId)
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('DELETE_BOOKING_TYPE : onClickOk')

    if (!await ensureConnected(databaseService.isConnected(), notice, t('components.dialogs.deleteBookingType.messages.dbNotConnected'))) return

    if (!bookingTypeFormData.id) {
        UtilsService.log('DELETE_BOOKING_TYPE: No booking type selected')
        return
    }

    await withLoading(async () => {
        try {
            if (!canDeleteBookingType(bookingTypeFormData.id!)) {
                await notice([t('components.dialogs.deleteBookingType.messages.error')])
                return
            }

            records.bookingTypes.remove(bookingTypeFormData.id!)
            await remove(bookingTypeFormData.id!)
            runtime.resetTeleport()
            await notice([t('components.dialogs.deleteBookingType.messages.success')])
        } catch (err) {
            const errorMessage = err instanceof AppError ? err.message : (err instanceof Error ? err.message : 'Unknown error')
            throw new AppError(
                errorMessage,
                'DELETE_BOOKING_TYPE',
                SYSTEM.ERROR_CATEGORY.VALIDATION,
                {a: err},
                true
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.deleteBookingType.title')})

onBeforeMount(() => {
    UtilsService.log('DELETE_BOOKING_TYPE: onBeforeMount')
    reset()
})

UtilsService.log('--- DeleteBookingType.vue setup ---')
</script>

<template>
    <v-form
        validate-on="submit"
        @submit.prevent>
        <BookingTypeForm :mode="'delete'"/>
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
