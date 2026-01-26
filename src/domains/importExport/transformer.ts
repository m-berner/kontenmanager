/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {BookingDb, DateConfigType, IndexedDbConfigType, LegacyBookingDb, LegacyStockDb, StockDb} from '@/types'
import {AppError} from '@/domains/errors'
import {SYSTEM} from '@/domains/config/system'

/**
 * Domain-level transformer for database records.
 * Handles conversion between different data formats (e.g., legacy to modern).
 */
export class ImportExportTransformer {
    constructor(
        private readonly _INDEXED_DB: IndexedDbConfigType,
        private readonly _DATE: DateConfigType,
        private readonly _isoDate: (_date: number) => string
    ) {
    }

    /**
     * Transforms a legacy stock record to the modern format.
     */
    transformLegacyStock(rec: LegacyStockDb, activeId: number): StockDb {
        return {
            cID: rec.cID,
            cAccountNumberID: activeId,
            cSymbol: rec.cSym,
            cMeetingDay: this._isoDate(rec.cMeetingDay),
            cQuarterDay: this._isoDate(rec.cQuarterDay),
            cCompany: rec.cCompany,
            cISIN: rec.cISIN,
            cFadeOut: rec.cFadeOut,
            cFirstPage: rec.cFirstPage,
            cURL: rec.cURL,
            cAskDates: this._DATE.ISO
        } as StockDb
    }

    /**
     * Transforms a legacy booking record to the modern format.
     */
    transformLegacyBooking(
        smTransfer: LegacyBookingDb,
        index: number,
        activeId: number
    ): BookingDb {
        const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES
        const booking: BookingDb = {
            cID: index + 1,
            cAccountNumberID: activeId,
            cStockID: smTransfer.cStockID,
            cBookDate: this._isoDate(smTransfer.cDate),
            cBookingTypeID: smTransfer.cType,
            cExDate: this._isoDate(smTransfer.cExDay),
            cCount: Math.abs(smTransfer.cCount),
            cDescription: smTransfer.cDescription,
            cMarketPlace: smTransfer.cMarketPlace,
            cTransactionTaxCredit: smTransfer.cFTax > 0 ? smTransfer.cFTax : 0,
            cTransactionTaxDebit: smTransfer.cFTax < 0 ? -smTransfer.cFTax : 0,
            cSourceTaxCredit: smTransfer.cSTax > 0 ? smTransfer.cSTax : 0,
            cSourceTaxDebit: smTransfer.cSTax < 0 ? -smTransfer.cSTax : 0,
            cFeeCredit: smTransfer.cFees > 0 ? smTransfer.cFees : 0,
            cFeeDebit: smTransfer.cFees < 0 ? -smTransfer.cFees : 0,
            cTaxCredit: smTransfer.cTax > 0 ? smTransfer.cTax : 0,
            cTaxDebit: smTransfer.cTax < 0 ? -smTransfer.cTax : 0,
            cSoliCredit: smTransfer.cSoli > 0 ? smTransfer.cSoli : 0,
            cSoliDebit: smTransfer.cSoli < 0 ? -smTransfer.cSoli : 0,
            cCredit: smTransfer.cAmount > 0 ? smTransfer.cAmount : 0,
            cDebit: smTransfer.cAmount < 0 ? -smTransfer.cAmount : 0
        }

        const creditDebit = this.createCreditDebitObject(smTransfer)

        switch (smTransfer.cType) {
            case BOOKING_TYPES.BUY:
                booking.cDebit = creditDebit.value
                booking.cCredit = 0
                break
            case BOOKING_TYPES.SELL:
            case BOOKING_TYPES.DIVIDEND:
                booking.cCredit = creditDebit.value
                booking.cDebit = 0
                break
            case BOOKING_TYPES.CREDIT:
                this.resetTaxesAndFees(booking)
                booking.cBookingTypeID = creditDebit.type
                booking.cCredit = creditDebit.value
                booking.cDebit = 0
                break
            case BOOKING_TYPES.DEBIT:
                this.resetTaxesAndFees(booking)
                booking.cBookingTypeID = creditDebit.type
                booking.cCredit = 0
                booking.cDebit = creditDebit.value
                break
            default:
                throw new AppError(
                    `Unknown booking type: ${smTransfer.cType}`,
                    'TRANSFORM_LEGACY: UNKNOWN_TYPE',
                    SYSTEM.ERROR_CATEGORY.VALIDATION,
                    {type: smTransfer.cType},
                    false
                )
        }

        return booking
    }

    private createCreditDebitObject(rec: LegacyBookingDb): { value: number; type: number } {
        const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES
        const result = {value: 0, type: -1}

        if (rec.cAmount !== 0) {
            result.type = BOOKING_TYPES.OTHER
        } else if (rec.cFees !== 0) {
            result.type = BOOKING_TYPES.FEE
        } else if (rec.cTax !== 0 || rec.cSoli !== 0 || rec.cSTax !== 0 || rec.cFTax !== 0) {
            result.type = BOOKING_TYPES.TAX
        }

        switch (rec.cType) {
            case BOOKING_TYPES.BUY:
                return {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY}
            case BOOKING_TYPES.SELL:
                return {value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL}
            case BOOKING_TYPES.DIVIDEND:
                return {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND}
            case BOOKING_TYPES.CREDIT:
                result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli
                return result
            case BOOKING_TYPES.DEBIT:
                result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli
                return result
            default:
                throw new AppError(
                    'Unknown booking type',
                    'UNKNOWN_BOOKING_TYPE',
                    SYSTEM.ERROR_CATEGORY.VALIDATION,
                    {type: rec.cType},
                    false
                )
        }
    }

    private resetTaxesAndFees(booking: Partial<BookingDb>): void {
        booking.cFeeCredit = 0
        booking.cFeeDebit = 0
        booking.cTransactionTaxCredit = 0
        booking.cTransactionTaxDebit = 0
        booking.cSourceTaxCredit = 0
        booking.cSourceTaxDebit = 0
        booking.cTaxCredit = 0
        booking.cTaxDebit = 0
        booking.cSoliCredit = 0
        booking.cSoliDebit = 0
    }
}
