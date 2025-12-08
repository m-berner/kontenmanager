/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'
import type {I_Booking_Formular, I_Booking_Formular_Return} from '@/types'

const bookingFormularData = reactive<I_Booking_Formular>({
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
const selected = ref<number>(-1)
const formRef = ref<HTMLFormElement | null>(null)

const reset = (): void => {
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

export function useBookingFormular(): I_Booking_Formular_Return {
    return {
        formRef,
        bookingFormularData,
        selected,
        reset
    }
}
