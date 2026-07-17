/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {inject, type InjectionKey, provide, reactive, type UnwrapNestedRefs} from "vue";

import {DATE} from "@/domain/constants";
import {formMapper} from "@/domain/mapping/formMapper";
import type {AccountFormData, BookingFormData, BookingTypeFormData, FormsManager, StockFormData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

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
): FormsManager<TForm, TDB, TArgs> {
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
 * Creates a form manager for Stocks.
 *
 * @returns Stock-specific form state and mapping methods.
 */
export function createStockFormManager() {
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

    const manager = createFormManager(initialData, formMapper().mapStockForm);

    return {
        ...manager,
        stockFormData: manager.formData,
        mapStockFormToDb: (accountId: number) =>
            manager.mapFormToDb(manager.formData, accountId)
    };
}

/**
 * Creates a form manager for Accounts.
 *
 * @returns Account-specific form state and mapping methods.
 */
export function createAccountFormManager() {
    const initialData: AccountFormData = {
        id: -1,
        swift: "",
        iban: "",
        logoUrl: "",
        withDepot: false
    };

    const manager = createFormManager(initialData, formMapper().mapAccountForm);

    return {
        ...manager,
        accountFormData: manager.formData,
        mapAccountFormToDb: () =>
            manager.mapFormToDb(manager.formData)
    };
}

/**
 * Creates and returns a manager object for handling booking form operations, including form data management
 * and mapping booking form data to a database representation.
 *
 * @returns An object containing methods and properties for managing booking form data:
 * - `bookingFormData`: Contains the current state of the booking form data.
 * - `mapBookingFormToDb(accountId: number, defaultISODate: string)`: Maps the booking form data
 *   to a format suitable for database operations, using the specified account ID and default ISO date.
 */
export function createBookingFormManager() {

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

    const manager = createFormManager(initialData, formMapper().mapBookingForm);

    return {
        ...manager,
        bookingFormData: manager.formData,
        mapBookingFormToDb: (accountId: number, defaultISODate: string) =>
            manager.mapFormToDb(manager.formData, accountId, defaultISODate)
    };
}

/**
 * Creates a form manager specifically configured for handling booking type form data.
 *
 * This method initializes the form manager with default booking type form data and
 * integrates a form mapper to handle transformations between form data and database formats.
 *
 * @returns An object containing:
 * - All properties and methods from the base form manager.
 * - `bookingTypeFormData`: The current booking type form data managed by the form manager.
 * - `mapBookingTypeFormToDb`: A method to transform the form data into a database format, using the specified account ID.
 */
export function createBookingTypeFormManager() {
    const initialData: BookingTypeFormData = {
        id: null,
        name: ""
    };

    const manager = createFormManager(initialData, formMapper().mapBookingTypeForm);

    return {
        ...manager,
        bookingTypeFormData: manager.formData,
        mapBookingTypeFormToDb: (accountId: number) =>
            manager.mapFormToDb(manager.formData, accountId)
    };
}

export type StockFormManager = ReturnType<typeof createStockFormManager>;
export type AccountFormManager = ReturnType<typeof createAccountFormManager>;
export type BookingFormManager = ReturnType<typeof createBookingFormManager>;
export type BookingTypeFormManager = ReturnType<typeof createBookingTypeFormManager>;

const StockFormKey: InjectionKey<StockFormManager> = Symbol("StockFormManager");
const AccountFormKey: InjectionKey<AccountFormManager> = Symbol("AccountFormManager");
const BookingFormKey: InjectionKey<BookingFormManager> = Symbol("BookingFormManager");
const BookingTypeFormKey: InjectionKey<BookingTypeFormManager> = Symbol("BookingTypeFormManager");

export function provideStockFormManager(manager: StockFormManager): void {
    provide(StockFormKey, manager);
}

export function provideAccountFormManager(manager: AccountFormManager): void {
    provide(AccountFormKey, manager);
}

export function provideBookingFormManager(manager: BookingFormManager): void {
    provide(BookingFormKey, manager);
}

export function provideBookingTypeFormManager(manager: BookingTypeFormManager): void {
    provide(BookingTypeFormKey, manager);
}

function requireInjected<T>(value: T | undefined, name: string): T {
    if (!value) {
        throw new Error(
            `Missing ${name}. Create it in the dialog component and call provide*FormManager().`
        );
    }
    return value;
}

export function useStockForm(): StockFormManager {
    return requireInjected(inject(StockFormKey), "StockFormManager");
}

export function useAccountForm(): AccountFormManager {
    return requireInjected(inject(AccountFormKey), "AccountFormManager");
}

export function useBookingForm(): BookingFormManager {
    return requireInjected(inject(BookingFormKey), "BookingFormManager");
}

export function useBookingTypeForm(): BookingTypeFormManager {
    return requireInjected(inject(BookingTypeFormKey), "BookingTypeFormManager");
}

log("COMPOSABLES useForms");
