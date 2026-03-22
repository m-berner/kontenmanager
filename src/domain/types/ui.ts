/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Data structure used in account creation/update forms.
 */
export interface AccountFormData {
    id: number;
    swift: string;
    iban: string;
    logoUrl: string;
    withDepot: boolean;
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
    bookingTypeId: number;
    accountTypeId: number;
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
}

/**
 * Data structure used in stock creation/update forms.
 */
export interface StockFormData {
    id: number;
    isin: string;
    company: string;
    symbol: string;
    meetingDay: string;
    quarterDay: string;
    fadeOut: 1 | 0;
    firstPage: 1 | 0;
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
