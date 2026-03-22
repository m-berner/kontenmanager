/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {
    BookingDb,
    DateConfigType,
    IndexedDbConfigType,
    LegacyBookingDb,
    LegacyStockDb,
    StockDb
} from "@/domain/types";

/**
 * Transforms a legacy booking object into a new booking object format.
 *
 * @param legacyTransfer - The legacy booking database object containing the booking details.
 * @param index - The current index of the booking being processed.
 * @param activeId - The active account ID associated with the booking.
 * @param indexedDb - The database configuration object that contains store and booking type definitions.
 * @param isoDate - A function to convert a numerical date to an ISO date string.
 * @returns The transformed booking object in the new format.
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
            throw appError(
                ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.F.CODE,
                ERROR_CATEGORY.VALIDATION,
                false
            );
    }

    return booking;
}

/**
 * Transforms a legacy stock database record into a new stock database record format.
 *
 * @param rec - The legacy stock database record to transform.
 * @param activeId - The active identifier to associate with the transformed stock record.
 * @param dateConfig - Configuration for date formatting.
 * @param isoDate - A function that converts a numeric date to an ISO string format.
 * @returns The transformed stock database record.
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
 * Calculates the total legacy tax and fee amount from a given LegacyBookingDb object.
 *
 * @param legacyTransfer - The legacy booking database record containing tax and fee details.
 * @returns The sum of all legacy taxes and fees.
 */
function getLegacyTaxFeeTotal(legacyTransfer: LegacyBookingDb): number {
    return (
        legacyTransfer.cFees +
        legacyTransfer.cSTax +
        legacyTransfer.cFTax +
        legacyTransfer.cTax +
        legacyTransfer.cSoli
    );
}

/**
 * Infers the legacy credit or debit type based on the values of the legacy transfer.
 *
 * @param legacyTransfer - The legacy transfer object containing credit, fee, and tax details.
 * @param indexedDb - The indexed database configuration object containing booking type mappings.
 * @returns The inferred booking type identifier, or -1 if no valid type is found.
 */
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

/**
 * Resets all tax and fee-related fields in the given booking object to zero.
 *
 * @param booking - The booking object whose tax and fee fields will be reset.
 * @returns This method does not return a value.
 */
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

/**
 * Splits a signed amount into credit and debit values.
 *
 * @param value The signed numeric value to be split. Positive values represent credit, and negative values represent debit.
 * @returns} An object containing the credit and debit values. The `credit` field will be the positive amount, or 0 if the input value is negative. The `debit` field will be the absolute value of the negative amount, or 0 if the input value is positive.
 */
function splitSignedAmount(value: number): { credit: number; debit: number } {
    return {
        credit: value > 0 ? value : 0,
        debit: value < 0 ? -value : 0
    };
}

/**
 * Transforms a legacy transfer record into a standardized fee representation.
 *
 * @param legacyTransfer - The legacy transfer data that needs to be transformed.
 * @param indexedDb - The IndexedDB configuration containing constants and store information.
 * @returns} Returns an object containing the calculated value and its associated type.
 */
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
            throw appError(
                ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.F.CODE,
                ERROR_CATEGORY.VALIDATION,
                false
            );
    }
}