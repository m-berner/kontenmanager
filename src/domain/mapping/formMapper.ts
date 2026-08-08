/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {BOOKING_TYPE_ROLE} from "@/domain/constants";
import type {
    AccountDb,
    AccountFormData,
    BookingDb,
    BookingFormData,
    BookingTypeDb,
    BookingTypeFormData,
    StockDb,
    StockFormData
} from "@/domain/types";
import {toNumber} from "@/domain/utils/utils";
import {normalizeBookingTypeName} from "@/domain/validation/validators";

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
     * @param bookingTypes - The account's own booking types, to resolve a selected type's role.
     * @returns A database-compatible representation of the booking data.
     */
    function mapBookingFormToDb(
        data: BookingFormData,
        accountId: number,
        defaultISODate: string,
        bookingTypes: Pick<BookingTypeDb, "cID" | "cRole">[]
    ): BookingDb | Omit<BookingDb, "cID"> {
        const roleOf = (typeId: number): BookingTypeDb["cRole"] | undefined =>
            bookingTypes.find((t) => t.cID === typeId)?.cRole;

        const isStockRelated = (typeId: number): boolean => {
            const role = roleOf(typeId);
            return (
                role === BOOKING_TYPE_ROLE.BUY ||
                role === BOOKING_TYPE_ROLE.SELL ||
                role === BOOKING_TYPE_ROLE.DIVIDEND
            );
        };

        const isDividend = (typeId: number): boolean => {
            return roleOf(typeId) === BOOKING_TYPE_ROLE.DIVIDEND;
        };

        // Mirrors BookingForm.vue's field-visibility gates exactly (isDividendSellType/
        // isBuySellType/isBuyType) so a field hidden by a role change is also cleared,
        // not just hidden. Otherwise, a stale value from a previously-selected type's
        // now-invisible field would still be saved and counted in fee/tax totals.
        const isDividendOrSellRelated = (typeId: number): boolean => {
            const role = roleOf(typeId);
            return role === BOOKING_TYPE_ROLE.SELL || role === BOOKING_TYPE_ROLE.DIVIDEND;
        };

        const isBuyOrSellRelated = (typeId: number): boolean => {
            const role = roleOf(typeId);
            return role === BOOKING_TYPE_ROLE.BUY || role === BOOKING_TYPE_ROLE.SELL;
        };

        const isBuyRelated = (typeId: number): boolean => {
            return roleOf(typeId) === BOOKING_TYPE_ROLE.BUY;
        };

        const booking: Omit<BookingDb, "cID"> = {
            cAccountNumberID: accountId,
            cBookDate: data.bookDate,
            cCredit: data.credit,
            cDebit: data.debit,
            cDescription: data.description.trim(),
            cBookingTypeID: data.selected,
            cSoliCredit: isDividendOrSellRelated(data.selected) ? data.soliCredit : 0,
            cSoliDebit: isDividendOrSellRelated(data.selected) ? data.soliDebit : 0,
            cTaxCredit: isDividendOrSellRelated(data.selected) ? data.taxCredit : 0,
            cTaxDebit: isDividendOrSellRelated(data.selected) ? data.taxDebit : 0,
            cFeeCredit: isBuyOrSellRelated(data.selected) ? data.feeCredit : 0,
            cFeeDebit: isBuyOrSellRelated(data.selected) ? data.feeDebit : 0,
            cSourceTaxCredit: isDividendOrSellRelated(data.selected) ? data.sourceTaxCredit : 0,
            cSourceTaxDebit: isDividendOrSellRelated(data.selected) ? data.sourceTaxDebit : 0,
            cTransactionTaxCredit: isBuyRelated(data.selected) ? data.transactionTaxCredit : 0,
            cTransactionTaxDebit: isBuyRelated(data.selected) ? data.transactionTaxDebit : 0,
            cStockID: isStockRelated(data.selected) ? data.stockId : 0,
            // `data.count` is typed `number` but holds a *string* at runtime:
            // BookingForm.vue binds it to a Vuetify `v-text-field type="number"`,
            // and VTextField's `onInput` assigns `el.value` verbatim (no numeric
            // cast, unlike Vue's own `vModelText` on a native input — and Vue's
            // `.number` modifier is inert here because VTextField only honors
            // `modelModifiers.trim`). TS cannot catch it: the v-model prop is `any`.
            // The DB itself stayed correct because bookingRepository.save() runs
            // validateBooking() (normalizeAmount -> toNumber), but add/updateBookingUsecase
            // push *this* object straight into the Pinia store unvalidated, so the
            // in-memory cCount stayed a string until the next full reload. That made
            // calculatePortfolioByStockId's `acc + entry.cCount` a string concatenation
            // (100 + "10" -> "10010"), corrupting holdings, invest value and total
            // depot value. Coerce with the same toNumber() the DB path uses so the
            // store and the DB can never disagree.
            cCount: isStockRelated(data.selected) ? toNumber(data.count) : 0,
            cExDate: isDividend(data.selected) ? data.exDate : defaultISODate,
            cMarketPlace: isBuyOrSellRelated(data.selected)
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
            cAccountNumberID: accountId,
            cRole: data.role
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


