/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {reactive, type UnwrapNestedRefs} from "vue";
import type {AccountFormData, BookingFormData, BookingTypeFormData, FormsManager, StockFormData} from "@/types";
import {DATE} from "@/constants";
import {log} from "@/domains/utils/utils";
import {formMapper} from "@/domains/mapping/formMapper";

let stockFormManagerInstance: ReturnType<typeof createStockFormManager> | null = null;
let accountFormManagerInstance: ReturnType<typeof createAccountFormManager> | null = null;
let bookingFormManagerInstance: ReturnType<typeof createBookingFormManager> | null = null;
let bookingTypeFormManagerInstance: ReturnType<typeof createBookingTypeFormManager> | null = null;

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

    const manager = createFormManager(initialData, formMapper().mapStockForm);

    return {
        ...manager,
        stockFormData: manager.formData,
        mapStockFormToDb: (accountId: number) =>
            manager.mapFormToDb(manager.formData, accountId)
    };
}

/**
 * Creates or retrieves the singleton form manager for Accounts.
 *
 * @returns Account-specific form state and mapping methods.
 */
function createAccountFormManager() {
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
        mapAccountFormToDb: (id?: number) =>
            manager.mapFormToDb(manager.formData, id)
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
function createBookingFormManager() {

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
 * - `mapBookingTypeFormToDb`: A method to transform the form data into a database format, with an optional ID parameter.
 */
function createBookingTypeFormManager() {
    const initialData: BookingTypeFormData = {
        id: null,
        name: ""
    };

    const manager = createFormManager(initialData, formMapper().mapBookingTypeForm);

    return {
        ...manager,
        bookingTypeFormData: manager.formData,
        mapBookingTypeFormToDb: (id?: number) =>
            manager.mapFormToDb(manager.formData, id)
    };
}

/**
 * Provides a singleton instance of the account form manager. Ensures that only one instance of the manager is created and reused throughout the application.
 *
 * @returns The singleton instance of the account form manager.
 */
export function useAccountForm() {
    if (!accountFormManagerInstance) {
        accountFormManagerInstance = createAccountFormManager();
    }
    return accountFormManagerInstance;
}

/**
 * Retrieves a singleton instance of the stock form manager. If the instance does not exist,
 * it creates and initializes a new stock form manager before returning it.
 *
 * @returns The single instance of the stock form manager.
 */
export function useStockForm() {
    if (!stockFormManagerInstance) {
        stockFormManagerInstance = createStockFormManager();
    }
    return stockFormManagerInstance;
}

/**
 * Provides a singleton instance of the booking form manager.
 * Ensures that only one instance of the booking form manager exists
 * and reuses the same instance across multiple invocations.
 *
 * @returns The singleton instance of the booking form manager.
 */
export function useBookingForm() {
    if (!bookingFormManagerInstance) {
        bookingFormManagerInstance = createBookingFormManager();
    }
    return bookingFormManagerInstance;
}

/**
 * Provides a singleton instance of the booking type form manager.
 * This ensures that the same instance is reused across the application
 * whenever booking type form functionalities are needed.
 *
 * @returns The singleton instance of the booking type form manager.
 */
export function useBookingTypeForm() {
    if (!bookingTypeFormManagerInstance) {
        bookingTypeFormManagerInstance = createBookingTypeFormManager();
    }
    return bookingTypeFormManagerInstance;
}

log("COMPOSABLES useForms");

