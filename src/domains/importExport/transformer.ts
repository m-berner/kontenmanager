/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    BookingDb,
    DateConfigType,
    IndexedDbConfigType,
    LegacyBookingDb,
    LegacyStockDb,
    StockDb
} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";

/**
 * Domain-level transformer for database records.
 * Handles conversion between different data formats (e.g., legacy to modern).
 */
export class ImportExportTransformer {
    constructor(
        private readonly indexedDb: IndexedDbConfigType,
        private readonly dateConfig: DateConfigType,
        private readonly isoDate: (_date: number) => string
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
            cMeetingDay: this.isoDate(rec.cMeetingDay),
            cQuarterDay: this.isoDate(rec.cQuarterDay),
            cCompany: rec.cCompany,
            cISIN: rec.cISIN,
            cFadeOut: rec.cFadeOut,
            cFirstPage: rec.cFirstPage,
            cURL: rec.cURL,
            cAskDates: this.dateConfig.ISO
        };
    }

    private splitSignedAmount(value: number): { credit: number; debit: number } {
        return {
            credit: value > 0 ? value : 0,
            debit: value < 0 ? -value : 0
        };
    }

    private getLegacyTaxFeeTotal(legacyTransfer: LegacyBookingDb): number {
        return (
            legacyTransfer.cFees +
            legacyTransfer.cSTax +
            legacyTransfer.cFTax +
            legacyTransfer.cTax +
            legacyTransfer.cSoli
        );
    }

    private inferLegacyCreditDebitType(legacyTransfer: LegacyBookingDb): number {
        const BOOKING_TYPES = this.indexedDb.STORE.BOOKING_TYPES;

        if (legacyTransfer.cAmount !== 0) {
            return BOOKING_TYPES.OTHER;
        }
        if (legacyTransfer.cFees !== 0) {
            return BOOKING_TYPES.FEE;
        }
        if (this.getLegacyTaxFeeTotal(legacyTransfer) !== 0) {
            return BOOKING_TYPES.TAX;
        }

        return -1;
    }

    /**
     * Transforms a legacy booking record to the modern format.
     */
    transformLegacyBooking(
        legacyTransfer: LegacyBookingDb,
        index: number,
        activeId: number
    ): BookingDb {
        const BOOKING_TYPES = this.indexedDb.STORE.BOOKING_TYPES;
        const transactionTax = this.splitSignedAmount(legacyTransfer.cFTax);
        const sourceTax = this.splitSignedAmount(legacyTransfer.cSTax);
        const fee = this.splitSignedAmount(legacyTransfer.cFees);
        const tax = this.splitSignedAmount(legacyTransfer.cTax);
        const soli = this.splitSignedAmount(legacyTransfer.cSoli);
        const amount = this.splitSignedAmount(legacyTransfer.cAmount);

        const booking: BookingDb = {
            cID: index + 1,
            cAccountNumberID: activeId,
            cStockID: legacyTransfer.cStockID,
            cBookDate: this.isoDate(legacyTransfer.cDate),
            cBookingTypeID: legacyTransfer.cType,
            cExDate: this.isoDate(legacyTransfer.cExDay),
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

        const creditDebit = this.transformLegacyOtherFee(legacyTransfer);

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
                this.resetTaxesAndFees(booking);
                booking.cBookingTypeID = creditDebit.type;
                booking.cCredit = creditDebit.value;
                booking.cDebit = 0;
                break;
            case BOOKING_TYPES.DEBIT:
                this.resetTaxesAndFees(booking);
                booking.cBookingTypeID = creditDebit.type;
                booking.cCredit = 0;
                booking.cDebit = creditDebit.value;
                break;
            default:
                throw new AppError(
                    ERROR_CODES.IMPORT_EXPORT_SERVICE.F,
                    ERROR_CATEGORY.VALIDATION,
                    false
                );
        }

        return booking;
    }

    private transformLegacyOtherFee(legacyTransfer: LegacyBookingDb): {
        value: number;
        type: number;
    } {
        const BOOKING_TYPES = this.indexedDb.STORE.BOOKING_TYPES;
        const result = {
            value: 0,
            type: this.inferLegacyCreditDebitType(legacyTransfer)
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
                    this.getLegacyTaxFeeTotal(legacyTransfer);
                return result;
            case BOOKING_TYPES.DEBIT:
                result.value =
                    -(legacyTransfer.cAmount +
                        this.getLegacyTaxFeeTotal(legacyTransfer));
                return result;
            default:
                throw new AppError(
                    ERROR_CODES.IMPORT_EXPORT_SERVICE.F,
                    ERROR_CATEGORY.VALIDATION,
                    false
                );
        }
    }

    private resetTaxesAndFees(booking: Partial<BookingDb>): void {
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
}
