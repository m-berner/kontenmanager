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
import {INDEXED_DB} from "@/domains/configs/database";
import {normalizeBookingTypeName} from "@/domains/utils/utils";

const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

export function formMapper() {

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

