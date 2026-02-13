/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {
  AccountStoreInterface,
  BookingDb,
  BookingStoreInterface,
  BookingTypeStoreInterface,
  NumberStringPair,
  RecordsDbData,
  SettingsStoreInterface,
  StockItem,
  StockStoreInterface
} from "@/types";
import { DATE } from "@/domains/configs/date";
import { DomainUtils } from "@/domains/utils";

export const STOCK_STORE_MEMORY = {
  mPortfolio: 0,
  mInvest: 0,
  mChange: 0,
  mBuyValue: 0,
  mEuroChange: 0,
  mMin: 0,
  mValue: 0,
  mMax: 0,
  mDividendYielda: 0,
  mDividendYeara: 0,
  mDividendYieldb: 0,
  mDividendYearb: 0,
  mRealDividend: 0,
  mRealBuyValue: 0,
  mDeleteable: false
} as const;

let hideImportAlert = false;

/**
 * Service for encapsulating complex domain logic and calculations.
 */
export class DomainLogic {
  /**
   * Calculates the total sum of bookings considering all taxes and fees.
   *
   * @param bookings - Array of bookings to sum.
   * @returns The total balance rounded to 2 decimal places.
   */
  static calculateTotalSum(bookings: BookingDb[]): number {
    if (bookings.length === 0) return 0;
    return bookings.reduce((acc, entry) => {
      const fees =
        entry.cTaxDebit -
        entry.cTaxCredit +
        (entry.cSourceTaxDebit - entry.cSourceTaxCredit) +
        (entry.cTransactionTaxDebit - entry.cTransactionTaxCredit) +
        (entry.cSoliDebit - entry.cSoliCredit) +
        (entry.cFeeDebit - entry.cFeeCredit);
      const result = acc + (entry.cCredit - entry.cDebit) - fees;
      return Math.round(result * 100) / 100;
    }, 0);
  }

  /**
   * Calculates the sum of fees for a specific year.
   *
   * @param bookings - Array of bookings to filter and sum.
   * @param year - The target year.
   * @returns Total fees for the year.
   */
  static calculateSumFees(bookings: BookingDb[], year: number): number {
    const sum = bookings
      .filter((entry) => new Date(entry.cBookDate).getFullYear() === year)
      .reduce((acc, entry) => acc + (entry.cFeeCredit - entry.cFeeDebit), 0);
    return Math.round(sum * 100) / 100;
  }

  /**
   * Calculates the sum of taxes for a specific year.
   *
   * @param bookings - Array of bookings to filter and sum.
   * @param year - The target year.
   * @returns Total taxes for the year.
   */
  static calculateSumTaxes(bookings: BookingDb[], year: number): number {
    const sum = bookings
      .filter((entry) => new Date(entry.cBookDate).getFullYear() === year)
      .reduce((acc, entry) => {
        return (
          acc +
          (entry.cTaxCredit -
            entry.cTaxDebit +
            entry.cSoliCredit -
            entry.cSoliDebit +
            entry.cSourceTaxCredit -
            entry.cSourceTaxDebit +
            entry.cTransactionTaxCredit -
            entry.cTransactionTaxDebit)
        );
      }, 0);
    return Math.round(sum * 100) / 100;
  }

  /**
   * Aggregates booking sums per type for a specific year.
   *
   * @param bookings - Array of bookings to aggregate.
   * @param bookingTypes - List of available booking types.
   * @param year - Optional target year for filtering.
   * @returns Array of objects containing sum (key) and type name (value).
   */
  static aggregateBookingsPerType(
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
            ? new Date(entry.cBookDate).getFullYear() === year
            : true;
          return matchType && matchYear;
        })
        .reduce((acc, entry) => acc + (entry.cCredit - entry.cDebit), 0);
      return { key: Math.round(sum * 100) / 100, value: type.cName };
    });
  }

  /**
   * Total sum of all fees across all years.
   *
   * @param bookings - Array of bookings.
   * @returns Total fees.
   */
  static calculateSumAllFees(bookings: BookingDb[]): number {
    const sum = bookings.reduce(
      (acc, entry) => acc + (entry.cFeeCredit - entry.cFeeDebit),
      0
    );
    return Math.round(sum * 100) / 100;
  }

  /**
   * Total sum of all taxes across all years.
   *
   * @param bookings - Array of bookings.
   * @returns Total taxes.
   */
  static calculateSumAllTaxes(bookings: BookingDb[]): number {
    const sum = bookings.reduce((acc, entry) => {
      return (
        acc +
        (entry.cTaxCredit -
          entry.cTaxDebit +
          entry.cSoliCredit -
          entry.cSoliDebit +
          entry.cSourceTaxCredit -
          entry.cSourceTaxDebit +
          entry.cTransactionTaxCredit -
          entry.cTransactionTaxDebit)
      );
    }, 0);
    return Math.round(sum * 100) / 100;
  }

  /**
   * Calculates the current portfolio quantity for a stock.
   *
   * @param bookings - Array of bookings.
   * @param stockId - ID of the stock.
   * @returns Portfolio quantity.
   */
  static calculatePortfolioByStockId(
    bookings: BookingDb[],
    stockId: number
  ): number {
    return bookings.reduce((acc, entry) => {
      if (entry.cStockID === stockId) {
        if (entry.cBookingTypeID === 1) return acc + entry.cCount;
        if (entry.cBookingTypeID === 2) return acc - entry.cCount;
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
  static calculateInvestByStockId(
    bookings: BookingDb[],
    stockId: number
  ): number {
    const totalPortfolio = this.calculatePortfolioByStockId(bookings, stockId);
    let runningCount = 0;

    return bookings
      .filter(
        (entry) => entry.cStockID === stockId && entry.cBookingTypeID === 1
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
  static calculateTotalDepotValue(stocks: StockItem[]): number {
    const sum = stocks.reduce((acc, rec) => {
      if (rec.mPortfolio !== undefined && rec.mPortfolio >= 0.1) {
        return acc + rec.mPortfolio * (rec.mValue ?? 0);
      }
      return acc;
    }, 0);
    return Math.round(sum * 100) / 100;
  }

  /**
   * Orchestrates the initialization of all records stores with data from the database.
   *
   * @param storesDB - The raw data fetched from IndexedDB.
   * @param stores - The Pinia store instances to initialize.
   * @param messages - Localization messages for alerts.
   * @param removeAccounts - Whether to clear accounts before initialization.
   */
  static async initializeRecords(
    storesDB: RecordsDbData,
    stores: {
      accounts: AccountStoreInterface;
      bookings: BookingStoreInterface;
      bookingTypes: BookingTypeStoreInterface;
      stocks: StockStoreInterface;
      settings: SettingsStoreInterface;
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
      stores.stocks.add({ ...s, ...STOCK_STORE_MEMORY })
    );
    storesDB.bookingsDB.forEach((b) => stores.bookings.add(b));

    // Sort bookings
    stores.bookings.items.sort(
      (a: BookingDb, b: BookingDb) =>
        new Date(b.cBookDate).getTime() - new Date(a.cBookDate).getTime()
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
      DomainUtils.log(
        "DOMAINS DomainLogic: initializeRecords",
        messages,
        "info"
      );
      hideImportAlert = true;
    }
  }
}
