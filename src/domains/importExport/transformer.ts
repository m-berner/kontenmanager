/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingDb, DateConfigType, IndexedDbConfigType, LegacyBookingDb, LegacyStockDb, StockDb} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";

/**
 * Domain-level transformer for database records.
 * Handles conversion between different data formats (e.g., legacy to modern).
 */

function splitSignedAmount(value: number): { credit: number; debit: number } {
    return {
        credit: value > 0 ? value : 0,
        debit: value < 0 ? -value : 0
    };
}

function getLegacyTaxFeeTotal(legacyTransfer: LegacyBookingDb): number {
    return (
        legacyTransfer.cFees +
        legacyTransfer.cSTax +
        legacyTransfer.cFTax +
        legacyTransfer.cTax +
        legacyTransfer.cSoli
    );
}

function resetTaxesAndFees(booking: Partial<BookingDb>): void {
    booking.cFeeCredit = 0;
    booking.cFeeDebit = 0;
    booking.cTransactionTaxCredit = 0;
    booking.cTransactionTaxDebit = 0;
    booking.cSourceTaxCredit = 0;
    booking.cSourceTaxDebit = 0;
    booking.cTaxCredit = 0;
    booking.cTaxDebit = 0;
    booking.cSoliCredit = 0;
    booking.cSoliDebit = 0;
}

function inferLegacyCreditDebitType(
    legacyTransfer: LegacyBookingDb,
    indexedDb: IndexedDbConfigType
): number {
    const BOOKING_TYPES = indexedDb.STORE.BOOKING_TYPES;

    if (legacyTransfer.cAmount !== 0) {
        return BOOKING_TYPES.OTHER;
    }
    if (legacyTransfer.cFees !== 0) {
        return BOOKING_TYPES.FEE;
    }
    if (getLegacyTaxFeeTotal(legacyTransfer) !== 0) {
        return BOOKING_TYPES.TAX;
    }

    return -1;
}

function transformLegacyOtherFee(
    legacyTransfer: LegacyBookingDb,
    indexedDb: IndexedDbConfigType
): {
    value: number;
    type: number;
} {
    const BOOKING_TYPES = indexedDb.STORE.BOOKING_TYPES;
    const result = {
        value: 0,
        type: inferLegacyCreditDebitType(legacyTransfer, indexedDb)
    };

    switch (legacyTransfer.cType) {
        case BOOKING_TYPES.BUY:
            return {
                value: legacyTransfer.cUnitQuotation * legacyTransfer.cCount,
                type: BOOKING_TYPES.BUY
            };
        case BOOKING_TYPES.SELL:
            return {
                value: legacyTransfer.cUnitQuotation * -legacyTransfer.cCount,
                type: BOOKING_TYPES.SELL
            };
        case BOOKING_TYPES.DIVIDEND:
            return {
                value: legacyTransfer.cUnitQuotation * legacyTransfer.cCount,
                type: BOOKING_TYPES.DIVIDEND
            };
        case BOOKING_TYPES.CREDIT:
            result.value =
                legacyTransfer.cAmount +
                getLegacyTaxFeeTotal(legacyTransfer);
            return result;
        case BOOKING_TYPES.DEBIT:
            result.value =
                -(legacyTransfer.cAmount +
                    getLegacyTaxFeeTotal(legacyTransfer));
            return result;
        default:
            throw AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.F,
                ERROR_CATEGORY.VALIDATION,
                false
            );
    }
}

/**
 * Transforms a legacy stock record to the modern format.
 */
export function transformLegacyStock(
    rec: LegacyStockDb,
    activeId: number,
    dateConfig: DateConfigType,
    isoDate: (_date: number) => string
): StockDb {
    return {
        cID: rec.cID,
        cAccountNumberID: activeId,
        cSymbol: rec.cSym,
        cMeetingDay: isoDate(rec.cMeetingDay),
        cQuarterDay: isoDate(rec.cQuarterDay),
        cCompany: rec.cCompany,
        cISIN: rec.cISIN,
        cFadeOut: rec.cFadeOut,
        cFirstPage: rec.cFirstPage,
        cURL: rec.cURL,
        cAskDates: dateConfig.ISO
    };
}

/**
 * Transforms a legacy booking record to the modern format.
 */
export function transformLegacyBooking(
    legacyTransfer: LegacyBookingDb,
    index: number,
    activeId: number,
    indexedDb: IndexedDbConfigType,
    isoDate: (_date: number) => string
): BookingDb {
    const BOOKING_TYPES = indexedDb.STORE.BOOKING_TYPES;
    const transactionTax = splitSignedAmount(legacyTransfer.cFTax);
    const sourceTax = splitSignedAmount(legacyTransfer.cSTax);
    const fee = splitSignedAmount(legacyTransfer.cFees);
    const tax = splitSignedAmount(legacyTransfer.cTax);
    const soli = splitSignedAmount(legacyTransfer.cSoli);
    const amount = splitSignedAmount(legacyTransfer.cAmount);

    const booking: BookingDb = {
        cID: index + 1,
        cAccountNumberID: activeId,
        cStockID: legacyTransfer.cStockID,
        cBookDate: isoDate(legacyTransfer.cDate),
        cBookingTypeID: legacyTransfer.cType,
        cExDate: isoDate(legacyTransfer.cExDay),
        cCount: Math.abs(legacyTransfer.cCount),
        cDescription: legacyTransfer.cDescription,
        cMarketPlace: legacyTransfer.cMarketPlace,
        cTransactionTaxCredit: transactionTax.credit,
        cTransactionTaxDebit: transactionTax.debit,
        cSourceTaxCredit: sourceTax.credit,
        cSourceTaxDebit: sourceTax.debit,
        cFeeCredit: fee.credit,
        cFeeDebit: fee.debit,
        cTaxCredit: tax.credit,
        cTaxDebit: tax.debit,
        cSoliCredit: soli.credit,
        cSoliDebit: soli.debit,
        cCredit: amount.credit,
        cDebit: amount.debit
    };

    const creditDebit = transformLegacyOtherFee(legacyTransfer, indexedDb);

    switch (legacyTransfer.cType) {
        case BOOKING_TYPES.BUY:
            booking.cDebit = creditDebit.value;
            booking.cCredit = 0;
            break;
        case BOOKING_TYPES.SELL:
        case BOOKING_TYPES.DIVIDEND:
            booking.cCredit = creditDebit.value;
            booking.cDebit = 0;
            break;
        case BOOKING_TYPES.CREDIT:
            resetTaxesAndFees(booking);
            booking.cBookingTypeID = creditDebit.type;
            booking.cCredit = creditDebit.value;
            booking.cDebit = 0;
            break;
        case BOOKING_TYPES.DEBIT:
            resetTaxesAndFees(booking);
            booking.cBookingTypeID = creditDebit.type;
            booking.cCredit = 0;
            booking.cDebit = creditDebit.value;
            break;
        default:
            throw AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.F,
                ERROR_CATEGORY.VALIDATION,
                false
            );
    }

    return booking;
}
