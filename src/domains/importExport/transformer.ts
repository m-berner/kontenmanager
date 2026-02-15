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
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";

/**
 * Domain-level transformer for database records.
 * Handles conversion between different data formats (e.g., legacy to modern).
 */
export class ImportExportTransformer {
  constructor(
    private readonly _INDEXED_DB: IndexedDbConfigType,
    private readonly _DATE: DateConfigType,
    private readonly _isoDate: (_date: number) => string
  ) {}

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
    } as StockDb;
  }

  /**
   * Transforms a legacy booking record to the modern format.
   */
  transformLegacyBooking(
    legacyTransfer: LegacyBookingDb,
    index: number,
    activeId: number
  ): BookingDb {
    const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES;
    const booking: BookingDb = {
      cID: index + 1,
      cAccountNumberID: activeId,
      cStockID: legacyTransfer.cStockID,
      cBookDate: this._isoDate(legacyTransfer.cDate),
      cBookingTypeID: legacyTransfer.cType,
      cExDate: this._isoDate(legacyTransfer.cExDay),
      cCount: Math.abs(legacyTransfer.cCount),
      cDescription: legacyTransfer.cDescription,
      cMarketPlace: legacyTransfer.cMarketPlace,
      cTransactionTaxCredit: legacyTransfer.cFTax > 0 ? legacyTransfer.cFTax : 0,
      cTransactionTaxDebit: legacyTransfer.cFTax < 0 ? -legacyTransfer.cFTax : 0,
      cSourceTaxCredit: legacyTransfer.cSTax > 0 ? legacyTransfer.cSTax : 0,
      cSourceTaxDebit: legacyTransfer.cSTax < 0 ? -legacyTransfer.cSTax : 0,
      cFeeCredit: legacyTransfer.cFees > 0 ? legacyTransfer.cFees : 0,
      cFeeDebit: legacyTransfer.cFees < 0 ? -legacyTransfer.cFees : 0,
      cTaxCredit: legacyTransfer.cTax > 0 ? legacyTransfer.cTax : 0,
      cTaxDebit: legacyTransfer.cTax < 0 ? -legacyTransfer.cTax : 0,
      cSoliCredit: legacyTransfer.cSoli > 0 ? legacyTransfer.cSoli : 0,
      cSoliDebit: legacyTransfer.cSoli < 0 ? -legacyTransfer.cSoli : 0,
      cCredit: legacyTransfer.cAmount > 0 ? legacyTransfer.cAmount : 0,
      cDebit: legacyTransfer.cAmount < 0 ? -legacyTransfer.cAmount : 0
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
    const BOOKING_TYPES = this._INDEXED_DB.STORE.BOOKING_TYPES;
    const result = { value: 0, type: -1 };

    if (legacyTransfer.cAmount !== 0) {
      result.type = BOOKING_TYPES.OTHER;
    } else if (legacyTransfer.cFees !== 0) {
      result.type = BOOKING_TYPES.FEE;
    } else if (
      legacyTransfer.cTax !== 0 ||
      legacyTransfer.cSoli !== 0 ||
      legacyTransfer.cSTax !== 0 ||
      legacyTransfer.cFTax !== 0
    ) {
      result.type = BOOKING_TYPES.TAX;
    }

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
          legacyTransfer.cFees +
          legacyTransfer.cSTax +
          legacyTransfer.cFTax +
          legacyTransfer.cTax +
          legacyTransfer.cSoli;
        return result;
      case BOOKING_TYPES.DEBIT:
        result.value =
          -legacyTransfer.cAmount -
          legacyTransfer.cFees -
          legacyTransfer.cSTax -
          legacyTransfer.cFTax -
          legacyTransfer.cTax -
          legacyTransfer.cSoli;
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
