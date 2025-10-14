/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {reactive, ref} from 'vue'
import type {IBookingFormularData} from '@/types'

const bookingFormularData: IBookingFormularData = reactive({
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
    sourceTax: 0,
    transactionTax: 0,
    tax: 0,
    fee: 0,
    soli: 0,
    marketPlace: ''
})
const formRef: Ref<HTMLFormElement | null> = ref(null)

export const useBookingFormular = () => {
    return {
        formRef,
        bookingFormularData
    }
}
