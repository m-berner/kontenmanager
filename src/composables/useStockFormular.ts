/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'
import {useApp} from '@/composables/useApp'
import type {I_Stock_DB, I_Stock_Formular} from '@/types'

const {CONS} = useApp()
const stockFormularData = reactive<I_Stock_Formular>(
    {
        id: -1,
        isin: '',
        company: '',
        symbol: '',
        meetingDay: '',
        quarterDay: '',
        fadeOut: false,
        firstPage: false,
        url: '',
        askDates: CONS.DATE.DEFAULT_ISO
    }
)
const formRef = ref<HTMLFormElement | null>(null)

const mapStockFormToDb = (aAId: number): I_Stock_DB => ({
    cID: stockFormularData.id,
    cISIN: stockFormularData.isin.replace(/\s/g, '').toUpperCase(),
    cCompany: stockFormularData.company,
    cSymbol: stockFormularData.symbol,
    cMeetingDay: stockFormularData.meetingDay,
    cQuarterDay: stockFormularData.quarterDay,
    cFadeOut: stockFormularData.fadeOut ? 1 : 0,
    cFirstPage: stockFormularData.firstPage ? 1 : 0,
    cURL: stockFormularData.url,
    cAccountNumberID: aAId,
    cAskDates: stockFormularData.askDates
})

const reset = (): void => {
    Object.assign(stockFormularData, {
        id: -1,
        isin: '',
        company: '',
        symbol: '',
        meetingDay: '',
        quarterDay: '',
        fadeOut: false,
        firstPage: false,
        url: '',
        askDates: CONS.DATE.DEFAULT_ISO
    })
    formRef.value = null
}

export function useStockFormular() {
    return {
        formRef,
        stockFormularData,
        mapStockFormToDb,
        reset
    }
}
