/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {reactive, type UnwrapNestedRefs} from "vue";
import type {
    AccountFormData,
    BookingFormData,
    BookingTypeFormData,
    FormsManager,
    StockFormData
} from "@/types";
import {DATE} from "@/domains/configs/date";
import {log} from "@/domains/utils/utils";
import {formMapper} from "@/domains/mapping/formMapper";

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

log("COMPOSABLES useForms");

