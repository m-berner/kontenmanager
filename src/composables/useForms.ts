/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {reactive, type UnwrapNestedRefs} from "vue";
import type {
    AccountDb,
    AccountFormData,
    BookingDb,
    BookingFormData,
    BookingTypeDb,
    BookingTypeFormData,
    FormsManager,
    StockDb,
    StockFormData
} from "@/types";
import {INDEXED_DB} from "@/configs/database";
import {DATE} from "@/domains/configs/date";
import {DomainUtils} from "@/domains/utils";

let stockFormManagerInstance: ReturnType<typeof createStockFormManager> | null =
    null;
let accountFormManagerInstance: ReturnType<
    typeof createAccountFormManager
> | null = null;
let bookingFormManagerInstance: ReturnType<
    typeof createBookingFormManager
> | null = null;
let bookingTypeFormManagerInstance: ReturnType<
    typeof createBookingTypeFormManager
> | null = null;

/**
 * Base generic form manager that handles reactive data and validation references.
 *
 * @param initialData - Initial state of the form.
 * @param mapFn - Function to map form data to a database-ready object.
 * @returns Form state, refs, and utility methods.
 */
function createFormManager<
    TForm extends object,
    TArgs extends unknown[],
    TDB
>(
    initialData: TForm,
    mapFn: (_data: UnwrapNestedRefs<TForm>, ..._args: TArgs) => TDB
): FormsManager<TForm, TDB> {
    const formData = reactive<TForm>({...initialData});

    /**
     * Resets form data to its initial state and clears validation references.
     */
    function reset(): void {
        Object.assign(formData, {...initialData});
    }

    return {
        formData,
        reset,
        mapFormToDb: mapFn
    };
}

/**
 * Creates or retrieves the singleton form manager for Stocks.
 *
 * @returns Stock-specific form state and mapping methods.
 */
function createStockFormManager() {
    const initialData: StockFormData = {
        id: -1,
        isin: "",
        company: "",
        symbol: "",
        meetingDay: "",
        quarterDay: "",
        fadeOut: 0,
        firstPage: 0,
        url: "",
        askDates: DATE.ISO
    };

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

    const manager = createFormManager(initialData, mapStockFormToDb);

    return {
        ...manager,
        stockFormData: manager.formData,
        mapStockFormToDb: (accountId: number) =>
            manager.mapFormToDb(manager.formData, accountId)
    };
}

/**
 * Creates or retrieves the singleton form manager for Accounts.
 */
function createAccountFormManager() {
    const initialData: AccountFormData = {
        id: -1,
        swift: "",
        iban: "",
        logoUrl: "",
        withDepot: false
    };

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

    const manager = createFormManager(initialData, mapAccountFormToDb);

    return {
        ...manager,
        accountFormData: manager.formData,
        mapAccountFormToDb: (id?: number) =>
            manager.mapFormToDb(manager.formData, id)
    };
}

function createBookingFormManager() {
    const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

    const initialData: BookingFormData = {
        id: -1,
        selected: -1,
        bookDate: "",
        exDate: "",
        credit: 0,
        debit: 0,
        description: "",
        count: 0,
        bookingTypeId: 0,
        accountTypeId: 0,
        stockId: 0,
        sourceTaxCredit: 0,
        sourceTaxDebit: 0,
        transactionTaxCredit: 0,
        transactionTaxDebit: 0,
        taxCredit: 0,
        taxDebit: 0,
        feeCredit: 0,
        feeDebit: 0,
        soliCredit: 0,
        soliDebit: 0,
        marketPlace: ""
    };

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

    const manager = createFormManager(initialData, mapBookingFormToDb);

    return {
        ...manager,
        bookingFormData: manager.formData,
        mapBookingFormToDb: (accountId: number, defaultISODate: string) =>
            manager.mapFormToDb(manager.formData, accountId, defaultISODate)
    };
}

function createBookingTypeFormManager() {
    const initialData: BookingTypeFormData = {
        id: null,
        name: ""
    };

    function mapBookingTypeFormToDb(
        data: BookingTypeFormData,
        accountId: number
    ): BookingTypeDb | Omit<BookingTypeDb, "cID"> {
        const bookingType = {
            cName: DomainUtils.normalizeBookingTypeName(data.name),
            cAccountNumberID: accountId
        };
        if (!data.id) return bookingType;
        if (data.id > 0) return {cID: data.id, ...bookingType};
        return bookingType;
    }

    const manager = createFormManager(initialData, mapBookingTypeFormToDb);

    return {
        ...manager,
        bookingTypeFormData: manager.formData,
        mapBookingTypeFormToDb: (id?: number) =>
            manager.mapFormToDb(manager.formData, id)
    };
}

export function useAccountForm() {
    if (!accountFormManagerInstance) {
        accountFormManagerInstance = createAccountFormManager();
    }
    return accountFormManagerInstance;
}

export function useStockForm() {
    if (!stockFormManagerInstance) {
        stockFormManagerInstance = createStockFormManager();
    }
    return stockFormManagerInstance;
}

export function useBookingForm() {
    if (!bookingFormManagerInstance) {
        bookingFormManagerInstance = createBookingFormManager();
    }
    return bookingFormManagerInstance;
}

export function useBookingTypeForm() {
    if (!bookingTypeFormManagerInstance) {
        bookingTypeFormManagerInstance = createBookingTypeFormManager();
    }
    return bookingTypeFormManagerInstance;
}

DomainUtils.log("COMPOSABLES useForms");
