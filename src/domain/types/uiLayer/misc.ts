/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ValidationRuleType} from "@/domain/types/uiLayer/forms";

/**
 * Props for the CheckboxGrid component.
 */
export interface CheckboxGridProps {
    /** Type of items to display in the grid (e.g., markets, indexes). */
    type: string;
}

/**
 * Props for the ContentCard component.
 */
export interface ContentCardProps {
    /** Title of the card. */
    title: string;
    /** List of items to display within the card. */
    data: ContentItem[];
}

/**
 * Represents a single piece of information in a content card.
 */
export interface ContentItem {
    /** Subtitle or label for the item. */
    readonly subTitle: string;
    /** Main content text or list of strings. */
    readonly content: string | string[];
    /** Optional additional details. */
    readonly details?: string | string[];
    /** Icon name to display alongside the item. */
    readonly icon: string;
}

/**
 * Props for the CreditDebitFieldset component.
 */
export interface CreditDebitFieldsetProps {
    /** Two-way bound model value. */
    modelValue: { credit: number; debit: number };
    /** Whether the fieldset is interactive. */
    disabled?: boolean;
    /** Label/Legend for the fieldset. */
    legend: string;
    /** Validation rules for credit and debit respectively. */
    rules: [
        (_v: number) => ValidationRuleType[],
        (_v: number) => ValidationRuleType[]
    ];
}

/**
 * Props for the CurrencyInput component.
 */
export interface CurrencyInputProps {
    /** Bound numeric value. */
    modelValue: number;
    /** Whether the input is disabled. */
    disabled?: boolean;
    /** Input label. */
    label: string;
    /** Validation rules. */
    rules?: Array<(_v: number) => boolean | string>;
}

/**
 * Extended EventTarget for handling file input changes.
 */
export interface CustomEventTarget extends HTMLInputElement {
    target: { files: Blob[] };
}

/**
 * Interface for managing a connection to the IndexedDB database.
 */
export interface DatabaseConnection {
    /** Establishes a connection to the database. */
    connect(): Promise<void>;

    /** Closes the active database connection. */
    disconnect(): Promise<void>;

    /** Whether the database is currently connected. */
    isConnected(): boolean;

    /** Returns the native IDBDatabase instance. */
    getDatabase(): IDBDatabase;

    /** Registers a handler for the 'versionchange' event. */
    onVersionChange(_handler: () => void): void;
}

/**
 * Interface for the database migrator responsible for schema setup.
 */
export interface DatabaseMigratorContract {
    /** Sets up the database schema during version changes. */
    setupDatabase(_db: IDBDatabase, _ev: IDBVersionChangeEvent): void;
}

/**
 * Type representing the date configuration object.
 */
export type DateConfigType = typeof import("@/domain/constants").DATE;

/**
 * Props for the DynamicList component.
 */
export interface DynamicListProps {
    /** Key for the data source. */
    type: string;
    /** Hint text for the list. */
    hint?: string;
    /** Placeholder for empty lists. */
    placeholder?: string;
}

/**
 * Supported UI event types.
 */
export type EventTypes =
    "abort"
    | "blur"
    | "change"
    | "click"
    | "close"
    | "complete"
    | "error"
    | "interrupted"
    | "focus"
    | "input"
    | "keydown"
    | "load"
    | "submit"
    | "success"
    | "upgradeneeded"
    | "DOMContentLoaded";

/**
 * Descriptor for a table header item.
 */
export interface HeaderItem {
    /** Display title. */
    title: string;
    /** Text alignment. */
    align: "start";
    /** Whether the column can be sorted. */
    sortable: boolean;
    /** Data key to bind to. */
    key: string;
}

/**
 * Result of a database health check.
 */
export interface HealthCheckResult {
    /** Whether the database is consistent. */
    healthy: boolean;
    /** List of identified integrity issues. */
    issues: HealthIssue[];
    /** Statistical overview of the database. */
    stats: HealthStats;
}

/**
 * Description of a single database integrity issue.
 */
export interface HealthIssue {
    /** Type of integrity violation. */
    type: "orphaned_records" | "invalid_references" | "missing_data";
    /** Severity of the issue. */
    severity: "warning" | "error";
    /** Name of the affected object store. */
    store: string;
    /** Number of affected records. */
    count: number;
    /** Human-readable details. */
    details?: string;
}

/**
 * Statistical summary of database records.
 */
export interface HealthStats {
    totalAccounts: number;
    totalBookings: number;
    totalStocks: number;
    totalBookingTypes: number;
    orphanedBookings: number;
    orphanedStocks: number;
    orphanedBookingTypes: number;
}

/**
 * Permitted colors for row highlighting.
 */
export type HighlightColor = "green" | "red" | "yellow" | "blue";

/**
 * Configuration for temporary row highlighting.
 */
export interface HighlightOptions {
    /** Highlight color. */
    color?: HighlightColor;
    /** Duration in milliseconds. */
    duration?: number;
}

/**
 * Type representing the IndexedDB configuration.
 */
export type IndexedDbConfigType = typeof import("@/domain/constants").INDEXED_DB;

/**
 * Represents an old booking format used in legacy imports.
 */
// Re-exported from "@/domain/types/domain".

/**
 * Represents an old stock format used in legacy imports.
 */

// Re-exported from "@/domain/types/domain".

/**
 * Data stored in the browser's local storage (preferences).
 */
export interface LocalStorageData {
    /** Active account ID. */
    sActiveAccountId: number;
    /** Selected UI skin/theme. */
    sSkin: string;
    /** Number of bookings per page. */
    sBookingsPerPage: number;
    /** Number of stocks per page. */
    sStocksPerPage: number;
    /** Number of dividends per page. */
    sDividendsPerPage: number;
    /** Number of summaries per page. */
    sSumsPerPage: number;
    /** Selected data service provider name. */
    sService: string;
    /** Enabled exchange rate pairs. */
    sExchanges: string[];
    /** Enabled stock indexes. */
    sIndexes: string[];
    /** Enabled marketplaces. */
    sMarkets: string[];
    /** Enabled commodities. */
    sMaterials: string[];
}

/**
 * Valid keys for commodity items.
 */
export type MaterialItemKeyType = "ag" | "al" | "au" | "brent" | "cu" | "ni" | "pb" | "pd" | "pt" | "sn" | "wti";

/**
 * Options for parsing localized numbers.
 */
export interface NumberParseOptions {
    /** Locale to use for decimal/thousand separators. */
    locale?: "de" | "en";
    /** Value to return if parsing fails. */
    fallback?: number;
    /** Whether to throw an error on invalid input. */
    throwOnError?: boolean;
}

/**
 * Validator function for numeric values.
 */
export type NumberValidatorType = (_v: number) => boolean | string;

/**
 * Validator function for string values.
 */
export type StringValidatorType = (_v: string) => boolean | string;

/**
 * Options for database transactions.
 */
export interface TransactionOptions {
    /** Timeout for the transaction in milliseconds. */
    timeout?: number;
    /** Progress callback. */
    onProgress?: (_progress: TransactionProgress) => void;
}

/**
 * Progress information for a long-running transaction.
 */
export interface TransactionProgress {
    /** Current phase of the transaction. */
    phase: "started" | "executing" | "completing" | "completed";
    /** Name of the store currently being processed. */
    store?: string;
}

/**
 * Static configuration for store identifiers.
 */
export interface StoresConfigType {
    /** Map of index keys to names. */
    INDEXES: { [key: string]: string };
    /** Map of material keys to names. */
    MATERIALS: { [key: string]: string };
}
