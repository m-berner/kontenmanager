/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {reactive, ref} from 'vue'
import {useApp} from '@/composables/useApp'

interface IStock_Formular {
    id: number
    isin: string
    company: string
    symbol: string
    meetingDay: string
    quarterDay: string
    fadeOut: boolean
    firstPage: boolean
    url: string
    askDates: string
}

const {CONS} = useApp()
const stockFormularData = reactive<IStock_Formular>({
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
const formRef = ref<HTMLFormElement | null>(null)

export function useStockFormular() {
    return {
        formRef,
        stockFormularData
    }
}
