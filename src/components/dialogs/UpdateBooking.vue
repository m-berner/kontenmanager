<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type {BookingDb, FormInterface} from '@/types'
import {onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useRecordsStore} from '@/stores/records'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {UtilsService} from '@/domains/utils'
import {useBookingsDB} from '@/composables/useIndexedDB'
import {useBrowser} from '@/composables/useBrowser'
import {useBookingForm} from '@/composables/useForms'
import BookingForm from '@/components/dialogs/forms/BookingForm.vue'
import {useDialogGuards} from '@/composables/useDialogGuards'
import {DATE} from '@/domains/config/date'
import {databaseService} from '@/services/database'

const {t} = useI18n()
const {notice} = useBrowser()
const {update} = useBookingsDB()
const {activeAccountId} = useSettingsStore()
const runtime = useRuntimeStore()
const {activeId} = storeToRefs(runtime)
const {bookingFormData, mapBookingFormToDb, reset: resetForm} = useBookingForm()
const records = useRecordsStore()
const {isLoading, submitGuard} = useDialogGuards()
const formRef = ref<FormInterface | null>(null)

const loadCurrentBooking = (): void => {
    UtilsService.log('UPDATE_BOOKING: loadCurrentBooking')
    resetForm()
    const currentBooking = records.bookings.getById(activeId.value)

    bookingFormData.selected = currentBooking?.cBookingTypeID || -1

    Object.assign(bookingFormData, {
        id: currentBooking?.cID,
        bookingTypeId: currentBooking?.cBookingTypeID,
        bookDate: currentBooking?.cBookDate,
        debit: currentBooking?.cDebit,
        credit: currentBooking?.cCredit,
        description: currentBooking?.cDescription,
        exDate: currentBooking?.cExDate,
        count: currentBooking?.cCount,
        accountTypeId: currentBooking?.cAccountNumberID,
        stockId: currentBooking?.cStockID,
        sourceTaxCredit: currentBooking?.cSourceTaxCredit,
        sourceTaxDebit: currentBooking?.cSourceTaxDebit,
        transactionTaxCredit: currentBooking?.cTransactionTaxCredit,
        transactionTaxDebit: currentBooking?.cTransactionTaxDebit,
        taxCredit: currentBooking?.cTaxCredit,
        taxDebit: currentBooking?.cTaxDebit,
        feeCredit: currentBooking?.cFeeCredit,
        feeDebit: currentBooking?.cFeeDebit,
        soliCredit: currentBooking?.cSoliCredit,
        soliDebit: currentBooking?.cSoliDebit,
        marketPlace: currentBooking?.cMarketPlace
    })
}

const onClickOk = async (): Promise<void> => {
    UtilsService.log('UPDATE_BOOKING : onClickOk')

    await submitGuard(
        {
            formRef,
            isConnected: databaseService.isConnected(),
            connectionErrorMessage: t('components.dialogs.updateBooking.messages.dbNotConnected'),
            notice,
            errorContext: 'UPDATE_BOOKING',
            errorTitle: t('components.dialogs.onClickOk'),
            operation: async () => {
                const booking = mapBookingFormToDb(activeAccountId, DATE.ISO) as BookingDb
                records.bookings.update(booking)
                await update(booking)
                runtime.resetTeleport()
                await notice([t('components.dialogs.updateBooking.messages.success')])
                runtime.resetOptionsMenuColors()
            }
        }
    )
}

defineExpose({onClickOk, title: t('components.dialogs.updateBooking.title')})

onBeforeMount(() => {
    UtilsService.log('UPDATE_BOOKING: onMounted')
    loadCurrentBooking()
})

UtilsService.log('--- components/dialogs/UpdateBooking.vue setup ---')
</script>

<template>
    <v-form
        ref="formRef"
        validate-on="submit"
        @submit.prevent>
        <BookingForm :isUpdate="true"/>
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
