/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types/domain";

/**
 * Basic company identification data.
 */
export interface CompanyData {
    /** Full company name. */
    company: string;
    /** Stock ticker symbol. */
    symbol: string;
}

/**
 * Data associated with a specific date or year.
 */
export interface DateData {
    /** Year or date identifier. */
    key: number | undefined;
    /** Calculated values for that date. */
    value: {
        /** Quarter factor. */
        qf: number;
        /** General margin or multiplier. */
        gm: number;
    };
}

/**
 * Single exchange rate mapping.
 */
export interface ExchangeData {
    /** Currency code. */
    key: string;
    /** Rate to base currency. */
    value: number;
}

/**
 * Data structure used for exporting user data.
 */
export interface ExportData {
    /** App metadata for the export. */
    sm: {
        cVersion: number;
        cDBVersion: number;
        cEngine: string;
    };
    /** Exported bank accounts. */
    accounts: AccountDb[];
    /** Exported transactions. */
    bookings: BookingDb[];
    /** Exported transaction categories. */
    bookingTypes: BookingTypeDb[];
    /** Exported stocks. */
    stocks: StockDb[];
}

/**
 * Configuration for the online data fetching service.
 */
export interface FetchConfigType {
    /** Available data providers. */
    PROVIDERS: {
        [key: string]: {
            NAME: string;
            HOME: string;
            QUOTE: string;
        };
    };
    /** Finance Net specific endpoints. */
    FNET: {
        INDEXES: string;
        DATES: string;
        MATERIALS: string;
        ONLINE_TEST: string;
        SEARCH: string;
    };
    /** Exchange rate service endpoints. */
    FX: {
        NAME: string;
        HOME: string;
        QUOTE: string;
    };
    /** Time-to-live for cached data in milliseconds. */
    DEFAULT_TTL: number;
    /** Default value for missing data. */
    DEFAULT_VALUE: string;
    /** Default currency code. */
    DEFAULT_CURRENCY: string;
    /** Target analysis period. */
    TARGET_PERIOD: string;
    /** Default currency symbol. */
    DEFAULT_CURRENCY_SYMBOL: string;
}

/**
 * Standardized result from an online stock quote fetch.
 */
export interface FetchResult {
    /** Current price/rate. */
    rate: string;
    /** Daily low price. */
    min: string;
    /** Daily high price. */
    max: string;
    /** Currency of the quote. */
    currency: string;
}

/**
 * A simple key-value pair with a numeric key and string value.
 */
export interface NumberStringPair {
    key: number;
    value: string;
}

/**
 * Data structure for stock information received from online sources.
 */
export interface OnlineStorageData {
    /** Internal stock ID. */
    id: number | undefined;
    /** ISIN. */
    isin: string;
    /** Daily low price. */
    min: string;
    /** Current rate. */
    rate: string;
    /** Daily high price. */
    max: string;
    /** Currency code. */
    cur: string;
}

/**
 * Function type for fetching data from a service.
 */
export interface ServiceFetcherType {
    /** Fetches market data for a list of stocks. */
    (
        _urls: NumberStringPair[],
        _options?: { signal?: AbortSignal }
    ): Promise<StockMarketData[]>;
}

/**
 * Permitted service provider names.
 */
export type ServiceName = "goyax" | "fnet" | "wstreet" | "acheck" | "ard" | "tgate";

/**
 * Represents a stock item that combines database fields with calculated RAM-only values.
 */
export interface StockItem extends StockRamData, StockDb {
    //
}

/**
 * Real-time market data for a stock.
 */
export interface StockMarketData {
    /** Associated stock ID. */
    id: number;
    /** International Securities Identification Number. */
    isin: string;
    /** Current market rate/price. */
    rate: string;
    /** Daily low price. */
    min: string;
    /** Daily high price. */
    max: string;
    /** Currency code. */
    cur: string;
}

/**
 * Calculated properties for stocks used during runtime (not stored in DB).
 */
export interface StockRamData {
    /** Current portfolio weight or value. */
    mPortfolio?: number;
    /** Total invested amount. */
    mInvest?: number;
    /** Percentage change. */
    mChange?: number;
    /** Original buy value. */
    mBuyValue?: number;
    /** Change in Euro. */
    mEuroChange?: number;
    /** Lowest recorded value. */
    mMin?: number;
    /** Current calculated value. */
    mValue?: number;
    /** Highest recorded value. */
    mMax?: number;
    /** Current dividend yield (estimated). */
    mDividendYielda?: number;
    /** Current dividend amount for the year (estimated). */
    mDividendYeara?: number;
    /** Secondary dividend yield (fallback). */
    mDividendYieldb?: number;
    /** Secondary dividend amount (fallback). */
    mDividendYearb?: number;
    /** Total actual dividend received. */
    mRealDividend?: number;
    /** Adjusted buy value (net). */
    mRealBuyValue?: number;
    /** Whether the stock can safely be deleted. */
    mDeleteable?: boolean;
}

/**
 * A simple key-value pair with a string key and number value.
 */
export interface StringNumberPair {
    key: string;
    value: number;
}
