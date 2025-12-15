/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {I_Account_DB, I_Booking_DB, I_Booking_SM, I_Booking_Type_DB, I_Stock_DB} from '@/types'

export function useImportExport() {

    class ImportExportService {
        constructor(
            private readonly _CONS: any,
            private readonly _isoDate: (_date: number) => string
        ) {
        }

        transformLegacyStock(rec: any, activeId: number): I_Stock_DB {
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
                cAskDates: this._CONS.DATE.DEFAULT_ISO
            } as I_Stock_DB
        }

        transformLegacyBooking(
            smTransfer: I_Booking_SM,
            index: number,
            activeId: number
        ): I_Booking_DB {
            const BOOKING_TYPES = this._CONS.INDEXED_DB.STORES.BOOKING_TYPES
            const booking: I_Booking_DB = {
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

            // Apply type-specific transformations
            const creditDebit = this.createCreditDebitObject(smTransfer)

            if (smTransfer.cType === BOOKING_TYPES.BUY) {
                booking.cDebit = creditDebit.value
                booking.cCredit = 0
            } else if (smTransfer.cType === BOOKING_TYPES.SELL || smTransfer.cType === BOOKING_TYPES.DIVIDEND) {
                booking.cCredit = creditDebit.value
                booking.cDebit = 0
            } else if (smTransfer.cType === 4) {
                this.resetTaxesAndFees(booking)
                booking.cBookingTypeID = creditDebit.type
                booking.cCredit = creditDebit.value
                booking.cDebit = 0
            } else if (smTransfer.cType === 5) {
                this.resetTaxesAndFees(booking)
                booking.cBookingTypeID = creditDebit.type
                booking.cCredit = 0
                booking.cDebit = creditDebit.value
            }

            return booking as I_Booking_DB
        }

        stringifyDatabase(
            accounts: I_Account_DB[],
            stocks: I_Stock_DB[],
            bookingTypes: I_Booking_Type_DB[],
            bookings: I_Booking_DB[]
        ): string {
            const stringifyArray = (arrayName: string, array: any[], isLast = false): string => {
                let buffer = `"${arrayName}":[\n`

                for (let i = 0; i < array.length; i++) {
                    buffer += JSON.stringify(array[i])
                    buffer += i === array.length - 1 ? '\n]' : ',\n'
                }

                if (array.length === 0) {
                    buffer += ']'
                }

                return buffer + (isLast ? '\n' : ',\n')
            }

            return (
                stringifyArray('accounts', accounts) +
                stringifyArray('stocks', stocks) +
                stringifyArray('bookingTypes', bookingTypes) +
                stringifyArray('bookings', bookings, true)
            )
        }

        private createCreditDebitObject(rec: I_Booking_SM): { value: number; type: number } {
            const BOOKING_TYPES = this._CONS.INDEXED_DB.STORES.BOOKING_TYPES
            let result = {value: 0, type: -1}

            // Determine non-zero fields (types 4, 5) and recreate type
            // Types 1-3 will be overwritten in the next step
            if (rec.cAmount !== 0) {
                result.type = BOOKING_TYPES.OTHER
            } else if (rec.cFees !== 0) {
                result.type = BOOKING_TYPES.FEE
            } else if (rec.cTax !== 0 || rec.cSoli !== 0 || rec.cSTax !== 0 || rec.cFTax !== 0) {
                result.type = BOOKING_TYPES.TAX
            }

            // Select by type and create value
            switch (rec.cType) {
                case BOOKING_TYPES.BUY:
                    result = {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.BUY}
                    break
                case BOOKING_TYPES.SELL:
                    result = {value: rec.cUnitQuotation * -rec.cCount, type: BOOKING_TYPES.SELL}
                    break
                case BOOKING_TYPES.DIVIDEND:
                    result = {value: rec.cUnitQuotation * rec.cCount, type: BOOKING_TYPES.DIVIDEND}
                    break
                case BOOKING_TYPES.CREDIT:
                    result.value = rec.cAmount + rec.cFees + rec.cSTax + rec.cFTax + rec.cTax + rec.cSoli
                    break
                case BOOKING_TYPES.DEBIT:
                    result.value = -rec.cAmount - rec.cFees - rec.cSTax - rec.cFTax - rec.cTax - rec.cSoli
                    break
                default:
                    throw new Error('ImportExportService: unknown booking type')
            }

            return result
        }

        private resetTaxesAndFees(booking: Partial<I_Booking_DB>): void {
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

    return {
        ImportExportService
    }
}
