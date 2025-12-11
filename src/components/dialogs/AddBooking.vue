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
import {useSettingsStore} from '@/stores/settings'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useValidation} from '@/composables/useValidation'
import {useBookingFormular} from '@/composables/useBookingFormular'
import BookingFormular from '@/components/dialogs/formulars/BookingFormular.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'

const {t} = useI18n()
const {CONS, log} = useApp()
const {notice} = useBrowser()
const {add, isConnected} = useBookingsDB()
const {validateForm} = useValidation()
const {bookingFormularData, formRef, reset, selected} = useBookingFormular()
const {ensureConnected, handleError, withLoading} = useDialogGuards()
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
const BOOKING_TYPES = CONS.INDEXED_DB.STORES.BOOKING_TYPES
const isStockRelated = (bookingTypeId: number): boolean => {
    return bookingTypeId >= BOOKING_TYPES.BUY && bookingTypeId <= BOOKING_TYPES.DIVIDEND
}

const isDividendBooking = (bookingTypeId: number): boolean => {
    return bookingTypeId === BOOKING_TYPES.DIVIDEND
}

const hasMarketplace = (bookingTypeId: number): boolean => {
    return bookingTypeId >= BOOKING_TYPES.BUY && bookingTypeId <= BOOKING_TYPES.SELL
}

const createBooking = (
    baseData: typeof bookingFormularData,
    accountId: number,
    defaultISODate: string
): Omit<I_Booking_DB, 'cID'> => {
    const base = {
        cBookDate: baseData.bookDate,
        cCredit: baseData.credit,
        cDebit: baseData.debit,
        cDescription: baseData.description,
        cBookingTypeID: selected.value,
        cAccountNumberID: accountId,
        cSoliCredit: baseData.soliCredit,
        cSoliDebit: baseData.soliDebit,
        cTaxCredit: baseData.taxCredit,
        cTaxDebit: baseData.taxDebit,
        cFeeCredit: baseData.feeCredit,
        cFeeDebit: baseData.feeDebit,
        cSourceTaxCredit: baseData.sourceTaxCredit,
        cSourceTaxDebit: baseData.sourceTaxDebit,
        cTransactionTaxCredit: baseData.transactionTaxCredit,
        cTransactionTaxDebit: baseData.transactionTaxDebit
    }

    const stockRelated = isStockRelated(baseData.bookingTypeId)
    const isDividend = isDividendBooking(baseData.bookingTypeId)
    const hasMP = hasMarketplace(baseData.bookingTypeId)

    return {
        ...base,
        cStockID: stockRelated ? baseData.stockId : 0,
        cCount: stockRelated ? baseData.count : 0,
        cExDate: isDividend ? baseData.exDate : defaultISODate,
        cMarketPlace: hasMP ? baseData.marketPlace : ''
    }
}

const onClickOk = async (): Promise<void> => {
    log('ADD_BOOKING : onClickOk')
    if (!await validateForm(formRef)) return
    if (!await ensureConnected(isConnected, notice, T.MESSAGES.DB_NOT_CONNECTED)) return

    await withLoading(async () => {
        try {
            // Simplified: no switch statement needed since all cases do the same
            const booking = createBooking(
                bookingFormularData,
                activeAccountId.value,
                CONS.DATE.DEFAULT_ISO
            )

            const addBookingID = await add(booking)

            if (addBookingID === -1) {
                log('ADD_BOOKING: onClickOk', {error: T.MESSAGES.ERROR_ADD})
                await notice([T.MESSAGES.ERROR_ADD])
                return
            }

            const completeBooking: I_Booking_Store = {cID: addBookingID, ...booking}
            records.bookings.add(completeBooking, true)
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
    </v-form>
</template>
