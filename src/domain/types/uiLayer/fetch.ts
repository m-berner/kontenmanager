/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountDb, BookingDb, BookingTypeDb, StockDb, StockRecord} from "@/domain/types/domain";

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
    /** App metadata for the export. See `AppMetadata`/`BackupMetadata`. */
    sm: {
        cVersion: string;
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
export type ServiceName = "none" | "goyax" | "fnet" | "wstreet" | "acheck" | "ard" | "tgate";

/**
 * Permitted data sources for commodity/material prices.
 *
 * Deliberately a separate, narrower type from {@link ServiceName}: the
 * materials feature (`fetchMaterialData`) is independent of the stock-quote
 * `service` setting and only ever supported finanzen.net. `wstreet` was added
 * as a second source scraping wallstreet-online.de's per-commodity pages
 * (`https://www.wallstreet-online.de/rohstoffe/<slug>`) — see
 * `WSTREET_MATERIAL_SLUGS`. Every other `ServiceName` (goyax, acheck, ard,
 * tgate) only ever provided stock quotes, never commodities.
 */
export type MaterialsServiceName = "fnet" | "wstreet";

/**
 * Permitted data sources for market index levels.
 *
 * Deliberately a separate type from both {@link ServiceName} and
 * {@link MaterialsServiceName}: `fetchIndexData` is its own independent
 * feature (its own `settings.indexesService`), scraping
 * wallstreet-online.de's per-index pages
 * (`https://www.wallstreet-online.de/indizes/<slug>`) when `"wstreet"` is
 * selected — see `WSTREET_INDEX_SLUGS`.
 */
export type IndexesServiceName = "fnet" | "wstreet";

/**
 * Represents a stock item that combines database fields with calculated RAM-only values.
 *
 * Built on {@link StockRecord} rather than `StockDb`, so `cISIN` and `cSymbol`
 * are known to be present. The persisted row may legitimately omit a blank
 * identifier (see `StockDb`'s comment); the store row never does, because
 * `initializeRecords` writes `cISIN: s.cISIN ?? ""` and `toRecordsPort` routes
 * every store write through `validateStock`, whose `normalizeString` always
 * yields a string. This is the invariant `UpdateStock`'s unguarded
 * `currentStock.cISIN.toUpperCase()` has always relied on; declaring it here
 * makes it checked rather than assumed.
 */
export interface StockItem extends StockRamData, StockRecord {
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
    /** Holdings for the stock, derived from its Buy/Sell bookings. */
    mPortfolio?: number;
    /** Cost basis still bound to the position (FIFO). */
    mInvest?: number;
    /**
     * Unrealized gain/loss: `mValue * mPortfolio - mInvest`.
     *
     * Named `mChange`, not `mEuroChange`: both operands are in the **active
     * account's** `cCurrency`, which may be USD, so the old name asserted a
     * currency the value does not carry. (It was also the one place the two
     * sides could disagree, back when `mValue` was converted to the browser
     * locale's currency while `mInvest` stayed as the raw booking amount.)
     */
    mChange?: number;
    /** 52-week low, as fetched. `0` means the provider reported no range. */
    mMin?: number;
    /** Current quote, converted into the active account's `cCurrency`. */
    mValue?: number;
    /** 52-week high, as fetched. `0` means the provider reported no range. */
    mMax?: number;
    /** Whether the stock has no bookings and can safely be deleted. */
    mDeleteable?: boolean;
}

/**
 * A simple key-value pair with a string key and number value.
 */
export interface StringNumberPair {
    key: string;
    value: number;
}
