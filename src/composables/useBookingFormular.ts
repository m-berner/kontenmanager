/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {reactive, ref} from 'vue'
import type {IBooking_Formular} from '@/types.d'

const bookingFormularData: IBooking_Formular = reactive({
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
const formRef: Ref<HTMLFormElement | null> = ref(null)

export const useBookingFormular = () => {
    return {
        formRef,
        bookingFormularData
    }
}
