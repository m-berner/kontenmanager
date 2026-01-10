/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import { type Reactive, reactive, type Ref, ref } from 'vue'
import type {
    I_Account_DB,
    I_Account_Formular,
    I_Booking_DB,
    I_Booking_Formular,
    I_Stock_DB,
    I_Stock_Formular
} from '@/types'
import { useAppConfig } from '@/composables/useAppConfig'

const { INDEXED_DB, DATE } = useAppConfig()

// ============================================================
// Generic form manager
// ============================================================

interface FormManager<TFormular, TDB> {
    formularData: TFormular
    formRef: Ref<HTMLFormElement | null>
    reset: () => void
    mapFormToDb: (..._args: any[]) => TDB
    isDirty: Ref<boolean>
    isValid: Ref<boolean>
}

function createFormManager<TFormular extends Record<string, any>, TDB>(
    initialData: TFormular,
    mapFn: (_data: TFormular, ..._args: any[]) => TDB
): Omit<FormManager<Reactive<TFormular>, TDB>, 'mapFormToDb'> & {
    mapFormToDb: typeof mapFn
} {
    const formularData = reactive<TFormular>({ ...initialData })
    const formRef = ref<HTMLFormElement | null>(null)
    const isDirty = ref(false)
    const isValid = ref(false)

    const initialDataCopy = { ...initialData }

    function reset(): void {
        Object.assign(formularData, initialDataCopy)
        formRef.value = null
        isDirty.value = false
        isValid.value = false
    }

    // Watch for changes to set dirty flag
    //const watchData = () => {
    //    isDirty.value = JSON.stringify(formularData.value) !== JSON.stringify(initialDataCopy)
    //}

    return {
        formularData,
        formRef,
        reset,
        mapFormToDb: mapFn,
        isDirty,
        isValid
    }
}

// ============================================================
// Account form
// ============================================================

export function useAccountFormular() {
    const initialData: I_Account_Formular = {
        id: -1,
        swift: '',
        iban: '',
        logoUrl: '',
        withDepot: false
    }

    function mapAccountFormToDb(data: I_Account_Formular, id?: number): I_Account_DB {
        return {
            cID: id,
            cSwift: data.swift.trim().toUpperCase(),
            cIban: data.iban.replace(/\s/g, '').toUpperCase(),
            cLogoUrl: data.logoUrl.trim(),
            cWithDepot: data.withDepot
        }
    }

    const manager = createFormManager(initialData, mapAccountFormToDb)

    return {
        ...manager,
        accountFormularData: manager.formularData,
        mapAccountFormToDb: (id?: number) => manager.mapFormToDb(manager.formularData, id)
    }
}

// ============================================================
// Stock form
// ============================================================

export function useStockFormular() {
    const initialData: I_Stock_Formular = {
        id: -1,
        isin: '',
        company: '',
        symbol: '',
        meetingDay: '',
        quarterDay: '',
        fadeOut: 0,
        firstPage: 0,
        url: '',
        askDates: DATE.ISO
    }

    function mapStockFormToDb(data: I_Stock_Formular, accountId: number): I_Stock_DB {
        return {
            cID: data.id,
            cISIN: data.isin.replace(/\s/g, '').toUpperCase(),
            cCompany: data.company.trim(),
            cSymbol: data.symbol.trim().toUpperCase(),
            cMeetingDay: data.meetingDay,
            cQuarterDay: data.quarterDay,
            cFadeOut: data.fadeOut ? 1 : 0,
            cFirstPage: data.firstPage ? 1 : 0,
            cURL: data.url.trim(),
            cAccountNumberID: accountId,
            cAskDates: data.askDates
        }
    }

    const manager = createFormManager(initialData, mapStockFormToDb)

    return {
        ...manager,
        stockFormularData: manager.formularData,
        mapStockFormToDb: (accountId: number) => manager.mapFormToDb(manager.formularData, accountId)
    }
}

// ============================================================
// Booking form (complex with validation)
// ============================================================

export function useBookingFormular() {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES

    const initialData: I_Booking_Formular = {
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

    const selected = ref<number>(-1)
    const cdRef = ref<HTMLFormElement | null>(null)

    function mapBookingFormToDb(
        data: I_Booking_Formular,
        accountId: number,
        defaultISODate: string
    ): I_Booking_DB {
        const isStockRelated = (typeId: number): boolean => {
            return [BOOKING_TYPES.BUY, BOOKING_TYPES.SELL, BOOKING_TYPES.DIVIDEND].includes(typeId)
        }

        const isDividend = (typeId: number): boolean => {
            return typeId === BOOKING_TYPES.DIVIDEND
        }

        const hasMarketplace = (typeId: number): boolean => {
            return [BOOKING_TYPES.BUY, BOOKING_TYPES.SELL, BOOKING_TYPES.DIVIDEND].includes(typeId)
        }

        return {
            cID: data.id,
            cAccountNumberID: accountId,
            cBookDate: data.bookDate,
            cCredit: data.credit,
            cDebit: data.debit,
            cDescription: data.description.trim(),
            cBookingTypeID: selected.value,
            cSoliCredit: data.soliCredit,
            cSoliDebit: data.soliDebit,
            cTaxCredit: data.taxCredit,
            cTaxDebit: data.taxDebit,
            cFeeCredit: data.feeCredit,
            cFeeDebit: data.feeDebit,
            cSourceTaxCredit: data.sourceTaxCredit,
            cSourceTaxDebit: data.sourceTaxDebit,
            cTransactionTaxCredit: data.transactionTaxCredit,
            cTransactionTaxDebit: data.transactionTaxDebit,
            cStockID: isStockRelated(data.bookingTypeId) ? data.stockId : 0,
            cCount: isStockRelated(data.bookingTypeId) ? data.count : 0,
            cExDate: isDividend(data.bookingTypeId) ? data.exDate : defaultISODate,
            cMarketPlace: hasMarketplace(data.bookingTypeId) ? data.marketPlace.trim() : ''
        }
    }

    const manager = createFormManager(initialData, mapBookingFormToDb)

    const extendedReset = () => {
        manager.reset()
        selected.value = -1
        cdRef.value = null
    }

    return {
        ...manager,
        bookingFormularData: manager.formularData,
        selected,
        cdRef,
        reset: extendedReset,
        mapBookingFormToDb: (accountId: number, defaultISODate: string) =>
            manager.mapFormToDb(manager.formularData, accountId, defaultISODate)
    }
}
