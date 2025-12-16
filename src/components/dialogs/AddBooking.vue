<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/forms/BookingFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useBookingsDB()
const {validateForm} = useValidation()
const {formRef, mapBookingFormToDb, reset} = useBookingFormular()
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()
const records = useRecordsStore()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)

const T = Object.freeze(
    {
        MESSAGES: {
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            SUCCESS_ADD: t('messages.addBooking.success'),
            ERROR_ADD: t('messages.addBooking.error'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.addBooking.title')
        }
    }
)

const onClickOk = async (): Promise<void> => {
    log('ADD_BOOKING : onClickOk')
    if (!validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            // Simplified: no switch statement needed since all cases do the same
            const booking = mapBookingFormToDb(
                activeAccountId.value,
                CONS.DATE.DEFAULT_ISO
            )

            const addBookingID = await add(booking)

            if (addBookingID === -1) {
                log('ADD_BOOKING: onClickOk', {error: T.MESSAGES.ERROR_ADD})
                await notice([T.MESSAGES.ERROR_ADD])
                return
            }
            booking.cID = addBookingID
            // const dbBooking: I_Booking_Store = {cID: addBookingID, ...booking}
            records.bookings.add(booking, true)
            reset()
            await notice([T.MESSAGES.SUCCESS_ADD])
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'ADD_BOOKING',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

onBeforeMount(() => {
    log('ADD_BOOKING: onMounted')
    reset()
})

log('--- AddBooking.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <BookingFormular/>
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
