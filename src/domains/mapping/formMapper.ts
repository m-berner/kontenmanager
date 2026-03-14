/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountDb,
    AccountFormData,
    BookingDb,
    BookingFormData,
    BookingTypeDb,
    BookingTypeFormData,
    StockDb,
    StockFormData
} from "@/types";
import {INDEXED_DB} from "@/constants";
import {normalizeBookingTypeName} from "@/domains/validation/validators";

const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

/**
 * Provides mapping functions to transform form data to their respective database representations.
 * This utility is useful for consistent and efficient form-to-DB conversions.
 *
 * @returns An object containing the following mapping functions:
 * - mapStockForm: Maps stock-related form data (`StockFormData`) into a `StockDb` object or an object omitting `cID`.
 * - mapAccountForm: Maps account-related form data (`AccountFormData`) into an `AccountDb` object or an object omitting `cID`.
 * - mapBookingForm: Maps booking-related form data (`BookingFormData`) into a `BookingDb` object or an object omitting `cID`.
 * - mapBookingTypeForm: Maps booking type form data (`BookingTypeFormData`) into a `BookingTypeDb` object or an object omitting `cID`.
 */
export function formMapper() {

    /**
     * Maps the stock form data to the database representation of a stock object.
     *
     * @param data - The stock form data containing input fields such as ISIN, company name, symbol, dates, etc.
     * @param accountId - The account ID associated with the stock record.
     * @returns The database representation of the stock object. If the form data contains a valid ID,
     * it includes the "cID" field; otherwise, it omits it.
     */
    function mapStockFormToDb(
        data: StockFormData,
        accountId: number
    ): StockDb | Omit<StockDb, "cID"> {
        const stock: Omit<StockDb, "cID"> = {
            cISIN: data.isin.replace(/\s/g, "").toUpperCase(),
            cCompany: data.company.trim(),
            cSymbol: data.symbol.trim().toUpperCase(),
            cMeetingDay: data.meetingDay,
            cQuarterDay: data.quarterDay,
            cFadeOut: data.fadeOut ? 1 : 0,
            cFirstPage: data.firstPage ? 1 : 0,
            cURL: data.url.trim(),
            cAccountNumberID: accountId,
            cAskDates: data.askDates
        };
        if (data.id > 0) {
            return {cID: data.id, ...stock};
        }
        return stock;
    }

    /**
     * Account form data mapped to the corresponding database object structure.
     *
     * @param data - The account form data containing details such as Swift, IBAN, logo URL, and whether it includes a depot.
     * @returns The mapped database object. If the `id` is greater than 0, includes the `cID` field; otherwise, excludes the `cID` field.
     */
    function mapAccountFormToDb(
        data: AccountFormData
    ): AccountDb | Omit<AccountDb, "cID"> {
        const account: Omit<AccountDb, "cID"> = {
            cSwift: data.swift.trim().toUpperCase(),
            cIban: data.iban.replace(/\s/g, "").toUpperCase(),
            cLogoUrl: data.logoUrl.trim(),
            cWithDepot: data.withDepot
        };
        if (data.id > 0) {
            return {cID: data.id, ...account};
        }
        return account;
    }

    /**
     * Maps booking form data to a database-compatible object structure.
     *
     * @param data - The booking form data provided by the user.
     * @param accountId - The ID of the account associated with the booking.
     * @param defaultISODate - The default ISO date to use if no specific date is provided.
     * @returns A database-compatible representation of the booking data.
     */
    function mapBookingFormToDb(
        data: BookingFormData,
        accountId: number,
        defaultISODate: string
    ): BookingDb | Omit<BookingDb, "cID"> {
        const isStockRelated = (typeId: number): boolean => {
            return (
                [
                    BOOKING_TYPES.BUY,
                    BOOKING_TYPES.SELL,
                    BOOKING_TYPES.DIVIDEND
                ] as number[]
            ).includes(typeId);
        };

        const isDividend = (typeId: number): boolean => {
            return typeId === BOOKING_TYPES.DIVIDEND;
        };

        const hasMarketplace = (typeId: number): boolean => {
            return (
                [
                    BOOKING_TYPES.BUY,
                    BOOKING_TYPES.SELL,
                    BOOKING_TYPES.DIVIDEND
                ] as number[]
            ).includes(typeId);
        };

        const booking: Omit<BookingDb, "cID"> = {
            cAccountNumberID: accountId,
            cBookDate: data.bookDate,
            cCredit: data.credit,
            cDebit: data.debit,
            cDescription: data.description.trim(),
            cBookingTypeID: data.selected,
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
            cStockID: isStockRelated(data.selected) ? data.stockId : 0,
            cCount: isStockRelated(data.selected) ? data.count : 0,
            cExDate: isDividend(data.selected) ? data.exDate : defaultISODate,
            cMarketPlace: hasMarketplace(data.selected)
                ? data.marketPlace.trim()
                : ""
        };
        if (data.id > 0) {
            return {cID: data.id, ...booking};
        }
        return booking;
    }

    /**
     * Maps the booking type form data to a database-compatible format.
     *
     * @param data - The booking type form data to be transformed.
     * @param accountId - The account ID associated with the booking type.
     * @returns The transformed database-compatible booking type object.
     */
    function mapBookingTypeFormToDb(
        data: BookingTypeFormData,
        accountId: number
    ): BookingTypeDb | Omit<BookingTypeDb, "cID"> {
        const bookingType = {
            cName: normalizeBookingTypeName(data.name),
            cAccountNumberID: accountId
        };
        if (!data.id) return bookingType;
        if (data.id > 0) return {cID: data.id, ...bookingType};
        return bookingType;
    }

    return {
        mapStockForm: mapStockFormToDb,
        mapAccountForm: mapAccountFormToDb,
        mapBookingForm: mapBookingFormToDb,
        mapBookingTypeForm: mapBookingTypeFormToDb
    }
}


