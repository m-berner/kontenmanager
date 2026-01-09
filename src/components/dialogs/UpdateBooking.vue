<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_DB} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/forms/BookingFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {DATE} = useAppConfig()
const {notice} = useBrowser()
const {update, isConnected} = useBookingsDB()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {bookingFormularData, formRef, mapBookingFormToDb, selected} = useBookingFormular()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)
const {isLoading, ensureConnected, handleError, validateForm, withLoading} = useDialogGuards()

const loadCurrentBooking = (): void => {
    log('UPDATE_BOOKING: loadCurrentBooking')
    const bookingIndex = records.bookings.getIndexById(activeId.value)

    if (bookingIndex === -1) {
        log('UPDATE_BOOKING: Booking not found', {error: activeId.value})
        return
    }

    const currentBooking = bookingItems.value[bookingIndex]
    selected.value = currentBooking.cBookingTypeID

    Object.assign(bookingFormularData, {
        id: currentBooking.cID,
        bookingTypeId: currentBooking.cBookingTypeID,
        bookDate: currentBooking.cBookDate,
        debit: currentBooking.cDebit,
        credit: currentBooking.cCredit,
        description: currentBooking.cDescription,
        exDate: currentBooking.cExDate,
        count: currentBooking.cCount,
        accountTypeId: currentBooking.cAccountNumberID,
        stockId: currentBooking.cStockID,
        sourceTaxCredit: currentBooking.cSourceTaxCredit,
        sourceTaxDebit: currentBooking.cSourceTaxDebit,
        transactionTaxCredit: currentBooking.cTransactionTaxCredit,
        transactionTaxDebit: currentBooking.cTransactionTaxDebit,
        taxCredit: currentBooking.cTaxCredit,
        taxDebit: currentBooking.cTaxDebit,
        feeCredit: currentBooking.cFeeCredit,
        feeDebit: currentBooking.cFeeDebit,
        soliCredit: currentBooking.cSoliCredit,
        soliDebit: currentBooking.cSoliDebit,
        marketPlace: currentBooking.cMarketPlace
    })
}

const onClickOk = async (): Promise<void> => {
    log('UPDATE_BOOKING : onClickOk')

    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, t('components.dialogs.updateBooking.messages.dbNotConnected'))) return

    await withLoading(async () => {
        try {
            const booking: I_Booking_DB = mapBookingFormToDb(activeAccountId.value, DATE.ISO)

            records.bookings.update(booking)
            await update(booking)
            await notice([t('components.dialogs.updateBooking.messages.success')])
            runtime.resetOptionsMenuColors()
            runtime.resetTeleport()
        } catch (err) {
            throw handleError(
                t('mixed.onClickOk'),
                err
            )
        }
    })
}

defineExpose({onClickOk, title: t('components.dialogs.updateBooking.title')})

onBeforeMount(() => {
    log('UPDATE_BOOKING: onMounted')
    loadCurrentBooking()
})

log('--- UpdateBooking.vue setup ---')
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
