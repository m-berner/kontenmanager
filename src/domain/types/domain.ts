/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Domain-level persisted account record (IndexedDB).
 */
export interface AccountDb {
    cID: number;
    cSwift: string;
    cIban: string;
    cLogoUrl: string;
    cWithDepot: boolean;
}

/**
 * Domain-level persisted booking record (IndexedDB).
 */
export interface BookingDb {
    cID: number;
    cBookDate: string;
    cExDate: string;
    cDebit: number;
    cCredit: number;
    cDescription: string;
    cCount: number;
    cBookingTypeID: number;
    cAccountNumberID: number;
    cStockID: number;
    cSoliCredit: number;
    cSoliDebit: number;
    cTaxCredit: number;
    cTaxDebit: number;
    cFeeCredit: number;
    cFeeDebit: number;
    cSourceTaxCredit: number;
    cSourceTaxDebit: number;
    cTransactionTaxCredit: number;
    cTransactionTaxDebit: number;
    cMarketPlace: string;
}

/**
 * Domain-level persisted booking type record (IndexedDB).
 */
export interface BookingTypeDb {
    cID: number;
    cName: string;
    cAccountNumberID: number;
}

/**
 * Domain-level persisted stock record (IndexedDB).
 */
export interface StockDb {
    cID: number;
    cCompany: string;
    cISIN: string;
    cSymbol: string;
    cFirstPage: number;
    cFadeOut: number;
    cMeetingDay: string;
    cQuarterDay: string;
    cURL: string;
    cAccountNumberID: number;
    cAskDates: string;
}

/**
 * Legacy import: old booking format.
 */
export interface LegacyBookingDb {
    cDate: number;
    cExDay: number;
    cUnitQuotation: number;
    cAmount: number;
    cDescription: string;
    cCount: number;
    cType: number;
    cStockID: number;
    cSoli: number;
    cTax: number;
    cFees: number;
    cSTax: number;
    cFTax: number;
    cMarketPlace: string;
}

/**
 * Legacy import: old stock format.
 */
export interface LegacyStockDb {
    cID: number;
    cSym: string;
    cMeetingDay: number;
    cQuarterDay: number;
    cCompany: string;
    cISIN: string;
    cFadeOut: number;
    cFirstPage: number;
    cURL: string;
}

