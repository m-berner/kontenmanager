<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {I_Booking_DB, I_Booking_Store} from '@/types'
import {defineExpose, onBeforeMount} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {log} = useApp()
const {notice} = useBrowser()
const {update, isConnected} = useBookingsDB()
const {validateForm} = useValidation()
const settings = useSettingsStore()
const {activeAccountId} = storeToRefs(settings)
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {bookingFormularData, formRef, selected} = useBookingFormular()
const records = useRecordsStore()
const {items: bookingItems} = storeToRefs(records.bookings)
const {isLoading, ensureConnected, handleError, withLoading} = useDialogGuards()

const T = Object.freeze(
    {
        MESSAGES: {
            ERROR_ONCLICK_OK: t('messages.onClickOk'),
            SUCCESS_UPDATE: t('messages.updateBooking.success'),
            DB_NOT_CONNECTED: t('messages.dbNotConnected')
        },
        STRINGS: {
            TITLE: t('components.dialogs.updateBooking.title')
        }
    }
)

const loadCurrentBooking = (): void => {
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

const buildBookingFromFormData = (): I_Booking_Store & I_Booking_DB => ({
    cID: bookingFormularData.id,
    cAccountNumberID: activeAccountId.value,
    cStockID: bookingFormularData.stockId,
    cBookingTypeID: selected.value,
    cBookDate: bookingFormularData.bookDate,
    cExDate: bookingFormularData.exDate,
    cCount: bookingFormularData.count,
    cDescription: bookingFormularData.description,
    cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
    cTransactionTaxDebit: bookingFormularData.transactionTaxDebit,
    cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
    cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
    cFeeCredit: bookingFormularData.feeCredit,
    cFeeDebit: bookingFormularData.feeDebit,
    cTaxCredit: bookingFormularData.taxCredit,
    cTaxDebit: bookingFormularData.taxDebit,
    cMarketPlace: bookingFormularData.marketPlace,
    cSoliCredit: bookingFormularData.soliCredit,
    cSoliDebit: bookingFormularData.soliDebit,
    cDebit: bookingFormularData.debit,
    cCredit: bookingFormularData.credit
})

const onClickOk = async (): Promise<void> => {
    log('UPDATE_BOOKING : onClickOk')
    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            const booking: I_Booking_Store & I_Booking_DB = buildBookingFromFormData()

            records.bookings.update(booking)
            await update(booking)
            await notice([T.MESSAGES.SUCCESS_UPDATE])
            runtime.resetOptionsMenuColors()
            runtime.resetTeleport()
        } catch (error) {
            await handleError(
                error,
                log,
                notice,
                'UPDATE_BOOKING',
                T.MESSAGES.ERROR_ONCLICK_OK
            )
        }
    })
}

const title = T.STRINGS.TITLE
defineExpose({onClickOk, title})

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
