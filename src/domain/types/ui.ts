/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingTypeRoleType} from "@/domain/constants";

/**
 * Data structure used in account creation/update forms.
 */
export interface AccountFormData {
    id: number;
    swift: string;
    iban: string;
    logoUrl: string;
    withDepot: boolean;
    /** ISO code from `CURRENCIES.SUPPORTED`; seeded from `settings.currency` on add. */
    currency: string;
}

/**
 * Data structure used in booking creation/update forms.
 */
export interface BookingFormData {
    id: number;
    selected: number;
    bookDate: string;
    exDate: string;
    credit: number;
    debit: number;
    description: string;
    count: number;
    // `bookingTypeId` and `accountTypeId` were declared here and never read.
    // `createBookingFormManager` seeded them to 0 and `UpdateBooking` populated
    // them when pre-filling an edit, but `mapBookingFormToDb` takes the booking
    // type from `selected` and the account from its `accountId` parameter. Both
    // were redundant copies of state that lives elsewhere, and the naming
    // inverted the truth — `bookingTypeId` read as the canonical field while
    // `selected` read like transient UI state — so a future edit that set
    // `bookingTypeId` and expected it to persist would have silently lost the
    // change. Only a separate `bookingFormData.selected = …` line in
    // `UpdateBooking`, one line above the `Object.assign` that set the dead
    // field, kept the two from being confused.
    stockId: number;
    soliCredit: number;
    soliDebit: number;
    taxCredit: number;
    taxDebit: number;
    feeCredit: number;
    feeDebit: number;
    sourceTaxCredit: number;
    sourceTaxDebit: number;
    transactionTaxCredit: number;
    transactionTaxDebit: number;
    marketPlace: string;
}

/**
 * Data structure used in booking type creation/update forms.
 */
export interface BookingTypeFormData {
    id: number | null;
    name: string;
    role: BookingTypeRoleType;
}

/**
 * Data structure used in stock creation/update forms.
 *
 * `fadeOut` and `firstPage` are `boolean`, matching the `v-checkbox` controls
 * that write them (`StockForm.vue`) rather than the `1 | 0` the database column
 * uses. They were declared `1 | 0` — the most precise declaration in this
 * interface and the only one nothing upheld: Vuetify's `v-model` prop is typed
 * `any`, so a click assigned `true`/`false` unchecked, and `UpdateStock`'s
 * `Object.assign` copied a widened `number` off `StockDb` (`Object.assign<T, U>`
 * returns `T & U`; it does not check assignability into `T`). The field
 * therefore held the declared type only by coincidence at initialisation.
 *
 * `mapStockFormToDb` converts with `data.fadeOut ? 1 : 0`, so the mapper is
 * where the database's numeric representation is produced — which is what made
 * the mismatch harmless, and what makes `boolean` the honest declaration here.
 * Same blind spot as round 42's `count` (declared `number`, held a string) and
 * round 43's `countRules`: `*FormData` describing what the author intends rather
 * than what Vuetify delivers.
 */
export interface StockFormData {
    id: number;
    isin: string;
    company: string;
    symbol: string;
    meetingDay: string;
    quarterDay: string;
    fadeOut: boolean;
    firstPage: boolean;
    url: string;
    askDates: string;
}

/**
 * Options for handling user alerts and feedback.
 */
export interface HandleUserAlertOptions {
    data?: unknown;
    logLevel?: LogLevelType;
    delay?: number | null;
    duration?: number | null;
    confirm?: {
        confirmText?: string;
        cancelText?: string;
        type?: "error" | "success" | "warning" | "info";
    };
    rateLimitMs?: number;
    correlationId?: string;
}

/**
 * Severity levels for logging.
 */
export type LogLevelType = "info" | "warn" | "error" | "log";
