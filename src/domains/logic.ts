/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountStoreContract,
    BookingDb,
    BookingStoreContract,
    BookingTypeStoreContract,
    NumberStringPair,
    RecordsDbData,
    SettingsStoreContract,
    StockItem,
    StockStoreContract
} from "@/types";
import {DATE} from "@/constants";
import {INDEXED_DB} from "@/constants";
import {log, round2, utcDate, utcMs} from "@/domains/utils/utils";

let hideImportAlert = false;
const BOOKING_TYPES = INDEXED_DB.STORE.BOOKING_TYPES;

/**
 * Calculates the total sum of bookings considering all taxes and fees.
 *
 * @param bookings - Array of bookings to sum.
 * @returns The total balance rounded to 2 decimal places.
 */
export function calculateTotalSum(bookings: BookingDb[]): number {
    if (bookings.length === 0) return 0;
    const sum = bookings.reduce((acc, entry) => {
        const fees = calculateEntryFees(entry);
        const taxes = calculateEntryTaxes(entry);
        return acc + (entry.cCredit - entry.cDebit) - (fees + taxes);
    }, 0);
    return round2(sum);
}

/**
 * Calculates the sum of fees for a specific year.
 *
 * @param bookings - Array of bookings to filter and sum.
 * @param year - The target year.
 * @returns Total fees for the year.
 */
export function calculateSumFees(bookings: BookingDb[], year: number): number {
    return sumByYear(bookings, year, (entry) => -calculateEntryFees(entry));
}

/**
 * Calculates the sum of taxes for a specific year.
 *
 * @param bookings - Array of bookings to filter and sum.
 * @param year - The target year.
 * @returns Total taxes for the year.
 */
export function calculateSumTaxes(bookings: BookingDb[], year: number): number {
    return sumByYear(bookings, year, (entry) => -calculateEntryTaxes(entry));
}

/**
 * Aggregates booking sums per type for a specific year.
 *
 * @param bookings - Array of bookings to aggregate.
 * @param bookingTypes - List of available booking types.
 * @param year - Optional target year for filtering.
 * @returns Array of objects containing sum (key) and type name (value).
 */
export function aggregateBookingsPerType(
    bookings: BookingDb[],
    bookingTypes: {
        cID: number;
        cName: string;
    }[],
    year?: number
): NumberStringPair[] {
    return bookingTypes.map((type) => {
        const sum = bookings
            .filter((entry) => {
                const matchType = entry.cBookingTypeID === type.cID;
                const matchYear = year
                    ? getBookingYear(entry) === year
                    : true;
                return matchType && matchYear;
            })
            .reduce((acc, entry) => acc + (entry.cCredit - entry.cDebit), 0);
        return {key: round2(sum), value: type.cName};
    });
}

/**
 * Total sum of all fees across all years.
 *
 * @param bookings - Array of bookings.
 * @returns Total fees.
 */
export function calculateSumAllFees(bookings: BookingDb[]): number {
    return sumAll(bookings, (entry) => -calculateEntryFees(entry));
}

/**
 * Total sum of all taxes across all years.
 *
 * @param bookings - Array of bookings.
 * @returns Total taxes.
 */
export function calculateSumAllTaxes(bookings: BookingDb[]): number {
    return sumAll(bookings, (entry) => -calculateEntryTaxes(entry));
}

/**
 * Calculates the current portfolio quantity for a stock.
 *
 * @param bookings - Array of bookings.
 * @param stockId - ID of the stock.
 * @returns Portfolio quantity.
 */
export function calculatePortfolioByStockId(
    bookings: BookingDb[],
    stockId: number
): number {
    return bookings.reduce((acc, entry) => {
        if (entry.cStockID === stockId) {
            if (entry.cBookingTypeID === BOOKING_TYPES.BUY)
                return acc + entry.cCount;
            if (entry.cBookingTypeID === BOOKING_TYPES.SELL)
                return acc - entry.cCount;
        }
        return acc;
    }, 0);
}

/**
 * Calculates the total investment value still held in a stock (FIFO principle).
 *
 * @param bookings - Array of bookings.
 * @param stockId - ID of the stock.
 * @returns Total investment value.
 */
export function calculateInvestByStockId(
    bookings: BookingDb[],
    stockId: number
): number {
    const totalPortfolio = calculatePortfolioByStockId(bookings, stockId);
    let runningCount = 0;

    return bookings
        .filter(
            (entry) =>
                entry.cStockID === stockId &&
                entry.cBookingTypeID === BOOKING_TYPES.BUY
        )
        .reduce((acc, entry) => {
            runningCount += entry.cCount;
            return runningCount <= totalPortfolio ? acc + entry.cDebit : acc;
        }, 0);
}

/**
 * Calculates the total depot value for a list of stocks.
 *
 * @param stocks - Array of stocks.
 * @returns Total depot value.
 */
export function calculateTotalDepotValue(stocks: StockItem[]): number {
    const sum = stocks.reduce((acc, rec) => {
        if (rec.mPortfolio !== undefined && rec.mPortfolio >= 0.1) {
            return acc + rec.mPortfolio * (rec.mValue ?? 0);
        }
        return acc;
    }, 0);
    return round2(sum);
}


/**
 * Checks if a stock has any associated bookings.
 *
 * @param stockId - The ID of the stock to check.
 * @param bookings - The list of bookings to search through.
 * @returns True if at least one booking is associated with the stock.
 */
export function hasBookings(stockId: number, bookings: { cStockID: number }[]): boolean {
    return bookings.some((booking) => booking.cStockID === stockId);
}

/**
 * Orchestrates the initialization of all records stores with data from the database.
 *
 * @param storesDB - The raw data fetched from IndexedDB.
 * @param stores - The Pinia store instances to initialize.
 * @param messages - Localization messages for alerts.
 * @param removeAccounts - Whether to clear accounts before initialization.
 */
export async function initializeRecords(
    storesDB: RecordsDbData,
    stores: {
        accounts: AccountStoreContract;
        bookings: BookingStoreContract;
        bookingTypes: BookingTypeStoreContract;
        stocks: StockStoreContract;
        settings: SettingsStoreContract;
    },
    messages: Record<string, string>,
    removeAccounts = true
): Promise<void> {
    // Clean stores
    if (removeAccounts) stores.accounts.clean();
    stores.bookings.clean();
    stores.bookingTypes.clean();
    stores.stocks.clean();

    // Bulk add to stores
    storesDB.accountsDB.forEach((a) => stores.accounts.add(a));
    storesDB.bookingTypesDB.forEach((bt) => stores.bookingTypes.add(bt));
    storesDB.stocksDB.forEach((s) =>
        stores.stocks.add({...s, ...INDEXED_DB.STORE.STOCK_MEMORY})
    );
    storesDB.bookingsDB.forEach((b) => stores.bookings.add(b));

    // Sort bookings
    stores.bookings.items.sort(
        (a: BookingDb, b: BookingDb) =>
            utcMs(b.cBookDate) - utcMs(a.cBookDate)
    );

    // Add default stock entry
    stores.stocks.add(
        {
            cID: 0,
            cISIN: "XX0000000000",
            cSymbol: "XXXOO0",
            cFadeOut: 1,
            cFirstPage: 0,
            cURL: "",
            cCompany: "",
            cMeetingDay: "",
            cQuarterDay: "",
            cAccountNumberID: stores.settings.activeAccountId,
            cAskDates: DATE.ISO
        },
        true
    );

    // Check for empty accounts and show alert if necessary
    if (stores.accounts.items.length === 0 && !hideImportAlert) {
        log(
            "DOMAINS DomainLogic: initializeRecords",
            messages,
            "info"
        );
        hideImportAlert = true;
    }
}

/**
 * Extracts the year from the booking date of a given booking entry.
 *
 * @param entry - An object containing the `cBookDate` property,
 *                which represents the booking date in string format.
 * @returns The year extracted from the `cBookDate` property as a number.
 */
function getBookingYear(entry: Pick<BookingDb, "cBookDate">): number {
    return utcDate(entry.cBookDate).getUTCFullYear();
}

/**
 * Calculates the total sum of a specified property for bookings in a given year.
 *
 * @param bookings - An array of booking entries to process.
 * @param year - The year for which bookings should be considered.
 * @param sumFn - A function that takes a booking entry as input and returns the numeric value to sum.
 * @returns The total sum of the specified property for bookings in the given year.
 */
function sumByYear(
    bookings: BookingDb[],
    year: number,
    sumFn: (_entry: BookingDb) => number
): number {
    const sum = bookings
        .filter((entry) => getBookingYear(entry) === year)
        .reduce((acc, entry) => acc + sumFn(entry), 0);
    return round2(sum);
}


/**
 * Calculates the sum of a specified numeric value derived from each element
 * in an array of booking entries.
 *
 * @param bookings - An array of booking entries to be processed.
 * @param sumFn - A function that extracts or computes the numeric value
 *                           from each booking entry to be included in the sum.
 * @returns The total sum of all extracted numeric values, rounded to two decimal places.
 */
function sumAll(
    bookings: BookingDb[],
    sumFn: (_entry: BookingDb) => number
): number {
    const sum = bookings.reduce((acc, entry) => acc + sumFn(entry), 0);
    return round2(sum);
}

/**
 * Calculates the net entry fees by subtracting the credited fee from the debited fee.
 *
 * @param entry - The booking database entry containing debit and credit fee information.
 * @returns The calculated net entry fees.
 */
function calculateEntryFees(entry: BookingDb): number {
    return entry.cFeeDebit - entry.cFeeCredit;
}

/**
 * Calculates the total entry taxes for a given booking database record.
 *
 * @param entry - The booking database record containing tax-related debit and credit properties.
 * @returns The total calculated tax value based on the provided entry data.
 */
function calculateEntryTaxes(entry: BookingDb): number {
    return (
        entry.cTaxDebit -
        entry.cTaxCredit +
        (entry.cSourceTaxDebit - entry.cSourceTaxCredit) +
        (entry.cTransactionTaxDebit - entry.cTransactionTaxCredit) +
        (entry.cSoliDebit - entry.cSoliCredit)
    );
}
