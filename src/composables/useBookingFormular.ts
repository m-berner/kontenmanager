/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'

interface IBooking_Formular {
    id: number
    bookDate: string
    exDate: string
    credit: number
    debit: number
    description: string
    count: number
    bookingTypeId: number
    accountTypeId: number
    stockId: number
    soliCredit: number
    soliDebit: number
    taxCredit: number
    taxDebit: number
    feeCredit: number
    feeDebit: number
    sourceTaxCredit: number
    sourceTaxDebit: number
    transactionTaxCredit: number
    transactionTaxDebit: number
    marketPlace: string
}

export function useBookingFormular() {
    const bookingFormularData = reactive<IBooking_Formular>({
        id: 0,
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
    const formRef = ref<HTMLFormElement | null>(null)

    return {
        formRef,
        bookingFormularData
    }
}
