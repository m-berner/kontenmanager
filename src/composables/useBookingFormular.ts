/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'
import type {I_Booking_DB, I_Booking_Formular} from '@/types'
import {useApp} from '@/composables/useApp'

const {CONS} = useApp()
const BOOKING_TYPES = CONS.INDEXED_DB.STORES.BOOKING_TYPES
const bookingFormularData = reactive<I_Booking_Formular>(
    {
        id: -1,
        bookDate: '',
        exDate: '',
        credit: 0,
        debit: 0,
        description: '',
        count: 0,
        bookingTypeId: 0,
        accountTypeId: 0,
        stockId: 0,
        sourceTaxCredit: 0,
        sourceTaxDebit: 0,
        transactionTaxCredit: 0,
        transactionTaxDebit: 0,
        taxCredit: 0,
        taxDebit: 0,
        feeCredit: 0,
        feeDebit: 0,
        soliCredit: 0,
        soliDebit: 0,
        marketPlace: ''
    }
)
const selected = ref<number>(-1)
const formRef = ref<HTMLFormElement | null>(null)

function reset (): void {
    Object.assign(bookingFormularData, {
        id: -1,
        bookDate: '',
        exDate: '',
        credit: 0,
        debit: 0,
        description: '',
        count: 0,
        bookingTypeId: 0,
        accountTypeId: 0,
        stockId: 0,
        sourceTaxCredit: 0,
        sourceTaxDebit: 0,
        transactionTaxCredit: 0,
        transactionTaxDebit: 0,
        taxCredit: 0,
        taxDebit: 0,
        feeCredit: 0,
        feeDebit: 0,
        soliCredit: 0,
        soliDebit: 0,
        marketPlace: ''
    })
    selected.value = -1
    formRef.value = null
}

const isStockRelated = (bookingTypeId: number): boolean => {
    return bookingTypeId === BOOKING_TYPES.BUY || bookingTypeId === BOOKING_TYPES.SELL || bookingTypeId === BOOKING_TYPES.DIVIDEND
}

const isDividendBooking = (bookingTypeId: number): boolean => {
    return bookingTypeId === BOOKING_TYPES.DIVIDEND
}

const hasMarketplace = (bookingTypeId: number): boolean => {
    return bookingTypeId === BOOKING_TYPES.BUY || bookingTypeId === BOOKING_TYPES.SELL || bookingTypeId === BOOKING_TYPES.DIVIDEND
}

function mapBookingFormToDb (
    accountId: number,
    defaultISODate: string
): I_Booking_DB {
    const base = {
        cID: bookingFormularData.id,
        cAccountNumberID: accountId,
        cBookDate: bookingFormularData.bookDate,
        cCredit: bookingFormularData.credit,
        cDebit: bookingFormularData.debit,
        cDescription: bookingFormularData.description,
        cBookingTypeID: selected.value,
        cSoliCredit: bookingFormularData.soliCredit,
        cSoliDebit: bookingFormularData.soliDebit,
        cTaxCredit: bookingFormularData.taxCredit,
        cTaxDebit: bookingFormularData.taxDebit,
        cFeeCredit: bookingFormularData.feeCredit,
        cFeeDebit: bookingFormularData.feeDebit,
        cSourceTaxCredit: bookingFormularData.sourceTaxCredit,
        cSourceTaxDebit: bookingFormularData.sourceTaxDebit,
        cTransactionTaxCredit: bookingFormularData.transactionTaxCredit,
        cTransactionTaxDebit: bookingFormularData.transactionTaxDebit
    }

    const stockRelated = isStockRelated(bookingFormularData.bookingTypeId)
    const isDividend = isDividendBooking(bookingFormularData.bookingTypeId)
    const hasMP = hasMarketplace(bookingFormularData.bookingTypeId)

    return {
        ...base,
        cStockID: stockRelated ? bookingFormularData.stockId : 0,
        cCount: stockRelated ? bookingFormularData.count : 0,
        cExDate: isDividend ? bookingFormularData.exDate : defaultISODate,
        cMarketPlace: hasMP ? bookingFormularData.marketPlace : ''
    }
}

export function useBookingFormular() {
    return {
        formRef,
        bookingFormularData,
        selected,
        mapBookingFormToDb,
        reset
    }
}
