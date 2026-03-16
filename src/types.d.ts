/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppErrorCategoryType} from "@/types";
import type {Errors} from "@/domains/errors";
import deNotifications from "@/_locales/de/messages.json";

export interface AccountDb {
    /** Unique identifier for the account. */
    cID: number;
    /** SWIFT/BIC code of the bank. */
    cSwift: string;
    /** International Bank Account Number. */
    cIban: string;
    /** URL to the bank's logo. */
    cLogoUrl: string;
    /** Whether this account is associated with a depot. */
    cWithDepot: boolean;
}

/**
 * Account data for UI display in lists or summaries.
 */
export interface AccountEntry {
    /** Unique identifier. */
    id: number;
    /** Display name or IBAN. */
    name: string;
    /** Current balance or sum. */
    sum: number;
    /** CSS class for name styling. */
    nameClass: string;
    /** CSS class for sum styling (e.g., green/red). */
    sumClass: string;
}

/**
 * Data structure used in account creation/update forms.
 */
export interface AccountFormData {
    /** Unique identifier for the account. */
    id: number;
    /** SWIFT/BIC code of the bank. */
    swift: string;
    /** International Bank Account Number. */
    iban: string;
    /** URL to the bank's logo. */
    logoUrl: string;
    /** Whether this account is associated with a depot. */
    withDepot: boolean;
}

/**
 * Represents the properties for the AccountForm component.
 */
export interface AccountFormProps {
    /** Indicates whether the form is being used for updating an existing account.
     * If true, the form is rendered in update mode; otherwise, it is in creation mode.
     */
    isUpdate: boolean;
}

/**
 * Interface for the account data store.
 */
export type AccountStoreContract = {
    /** List of all accounts currently in the store. */
    items: AccountStoreItem[];
    /** Resets the account store. */
    clean: () => void;
    /** Adds an account to the store. */
    add: (_account: AccountStoreItem, _prepend?: boolean) => void;
};

/**
 * Represents an account store item that extends the functionalities of the {@link AccountDb} interface.
 * This interface is used to define the structure for items stored in the account data storage system.
 * It inherits all properties and methods from the {@link AccountDb} interface.
 */
export interface AccountStoreItem extends AccountDb {
}

/**
 * Handler function for menu or UI actions that take a record ID.
 */
export type ActionHandler = (_recordId: number) => Promise<void>;

/**
 * Kind of alert to display to the user.
 */
export type AlertKindType = "info" | "error" | "confirm";

/**
 * Mode of the alert (transient notice vs. persistent alert).
 */
export type AlertModeType = "notice" | "alert";

/**
 * Interface for the alert notification store.
 */
export type AlertStoreContract = {
    /** Triggers an information alert. */
    info: (_title: string, _message: string, _duration: number | null) => void;
};

/**
 * Represents a custom application error that extends the standard JavaScript Error object.
 * This interface provides additional properties to categorize and handle errors specific to the application.
 */
export interface AppError extends Error {
    code: keyof typeof deNotifications | Errors;
    category: AppErrorCategoryType;
    recoverable: boolean;
    context?: Record<string, unknown>;
}

/**
 * Category of application errors for classification.
 */
export type AppErrorCategoryType =
    | (typeof import("@/domains/errors").ERROR_CATEGORY)[keyof typeof import("@/domains/errors").ERROR_CATEGORY];

/**
 * Metadata about the application.
 */
export interface AppMetadata {
    /** Application version. */
    cVersion: number;
    /** Database schema version. */
    cDBVersion: number;
    /** Application engine identifier. */
    cEngine: string;
}

/**
 * Current initialization status of application subsystems.
 */
export interface AppStatus {
    /** Status of the browser storage. */
    storage: "ok" | "aborted" | "error";
    /** Status of the IndexedDB connection. */
    db: "ok" | "aborted" | "error";
    /** Status of various online data fetchers. */
    fetch: {
        /** Whether exchange rates were fetched successfully. */
        exchanges: boolean;
        /** Whether stock indexes were fetched successfully. */
        indexes: boolean;
        /** Whether commodity prices were fetched successfully. */
        materials: boolean;
    };
}

/**
 * Structure of a full database backup or import file.
 */
export interface BackupData {
    /** Application metadata at the time of backup. */
    sm: {
        cVersion: number;
        cDBVersion: number;
        cEngine: string;
    };
    /** List of bank accounts. */
    accounts: import("@/types").AccountDb[];
    /** List of transactions. */
    bookings: import("@/types").BookingDb[];
    /** List of transaction categories. */
    bookingTypes: import("@/types").BookingTypeDb[];
    /** List of stocks, including legacy formats. */
    stocks: import("@/types").StockDb[] & import("@/types").StockItem[] & import("@/types").LegacyStockDb[];
    /** Legacy transfers data. */
    transfers?: import("@/types").LegacyBookingDb[];
}

/**
 * Result of validating a backup file.
 */
export interface BackupValidationResult {
    /** Whether the backup file is valid and compatible. */
    isValid: boolean;
    /** Version of the backup file. */
    version: number;
    /** Error message if validation failed. */
    error?: string;
}

/**
 * Base interface for dialog forms that have a template reference and validation.
 */
export interface BaseDialogForm {
    /** Reference to the form component instance. */
    formRef: Ref<import("@/types").FormContract | null>;
    /** Validates the form fields. */
    validateForm: () => Promise<boolean>;
}

/**
 * Base interface for database entities.
 */
export interface BaseEntity {
    /** Unique database ID. */
    cID?: number;
}

/**
 * Descriptor for a set of operations to be performed in a batch transaction.
 */
export interface BatchOperationDescriptor {
    /** Name of the object store. */
    storeName: import("@/services/database/batch/service").ValidStoreNameType;
    /** List of operations (add, put, delete). */
    operations: import("@/types").RecordOperation[];
}

/**
 * Represents a financial transaction (booking) record in the database.
 */
export interface BookingDb {
    /** Unique identifier for the booking. */
    cID: number;
    /** Booking date (ISO format). */
    cBookDate: string;
    /** Execution date (ISO format). */
    cExDate: string;
    /** Debit amount. */
    cDebit: number;
    /** Credit amount. */
    cCredit: number;
    /** Description or note. */
    cDescription: string;
    /** Number of shares (for stock transactions). */
    cCount: number;
    /** ID of the associated booking type. */
    cBookingTypeID: number;
    /** ID of the associated account. */
    cAccountNumberID: number;
    /** ID of the associated stock. */
    cStockID: number;
    /** Solidarity surcharge credit. */
    cSoliCredit: number;
    /** Solidarity surcharge debit. */
    cSoliDebit: number;
    /** Capital gains tax credit. */
    cTaxCredit: number;
    /** Capital gains tax debit. */
    cTaxDebit: number;
    /** Transaction fees credit. */
    cFeeCredit: number;
    /** Transaction fees debit. */
    cFeeDebit: number;
    /** Source tax credit. */
    cSourceTaxCredit: number;
    /** Source tax debit. */
    cSourceTaxDebit: number;
    /** Financial transaction tax credit. */
    cTransactionTaxCredit: number;
    /** Financial transaction tax debit. */
    cTransactionTaxDebit: number;
    /** Marketplace where the transaction occurred. */
    cMarketPlace: string;
}

/**
 * Data structure used in booking creation/update forms.
 */
export interface BookingFormData {
    /** Unique identifier for the booking. */
    id: number;
    /** Whether the booking is currently selected in the UI. */
    selected: number;
    /** Booking date (ISO format). */
    bookDate: string;
    /** Execution date (ISO format). */
    exDate: string;
    /** Credit amount. */
    credit: number;
    /** Debit amount. */
    debit: number;
    /** Description or note. */
    description: string;
    /** Number of shares (for stock transactions). */
    count: number;
    /** ID of the associated booking type. */
    bookingTypeId: number;
    /** ID of the associated account type. */
    accountTypeId: number;
    /** ID of the associated stock. */
    stockId: number;
    /** Solidarity surcharge credit. */
    soliCredit: number;
    /** Solidarity surcharge debit. */
    soliDebit: number;
    /** Capital gains tax credit. */
    taxCredit: number;
    /** Capital gains tax debit. */
    taxDebit: number;
    /** Transaction fees credit. */
    feeCredit: number;
    /** Transaction fees debit. */
    feeDebit: number;
    /** Source tax credit. */
    sourceTaxCredit: number;
    /** Source tax debit. */
    sourceTaxDebit: number;
    /** Financial transaction tax credit. */
    transactionTaxCredit: number;
    /** Financial transaction tax debit. */
    transactionTaxDebit: number;
    /** Marketplace where the transaction occurred. */
    marketPlace: string;
}

/**
 * Interface for the booking data store.
 */
export type BookingStoreContract = {
    /** List of all bookings currently in the store. */
    items: BookingDb[];
    /** Resets the booking store. */
    clean: () => void;
    /** Adds a booking to the store. */
    add: (_booking: BookingDb, _prepend?: boolean) => void;
};

/**
 * Represents a category for transactions (e.g., Buy, Sell, Dividend).
 */
export interface BookingTypeDb {
    /** Unique identifier. */
    cID: number;
    /** Name of the booking type. */
    cName: string;
    /** ID of the associated account. */
    cAccountNumberID: number;
}

/**
 * Data structure used in booking type creation/update forms.
 */
export interface BookingTypeFormData {
    /** Unique identifier (null for new items). */
    id: number | null;
    /** Name of the booking type. */
    name: string;
}

/**
 * Properties for the BookingTypeForm component.
 */
export interface BookingTypeFormProps {
    /** The mode the form is operating in (e.g., add, update). */
    mode: import("@/types").FormModeType;
}

/**
 * Interface for the booking type data store.
 */
export type BookingTypeStoreContract = {
    /** List of all booking categories. */
    items: BookingTypeDb[];
    /** Resets the booking type store. */
    clean: () => void;
    /** Adds a booking type to the store. */
    add: (_bookingType: BookingTypeDb, _prepend?: boolean) => void;
};

/**
 * Props for the CheckboxGrid component.
 */
export interface CheckboxGridProps {
    /** Type of items to display in the grid (e.g., markets, indexes). */
    type: string;
}

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
 * State data for an active confirmation dialog.
 */
export interface ConfirmationDialogData {
    /** Unique ID of the confirmation request. */
    id: number;
    /** Title of the dialog. */
    title: string;
    /** Detailed message to display. */
    message: string;
    /** Text for the confirmation button. */
    confirmText: string;
    /** Text for the cancellation button. */
    cancelText: string;
    /** Visual style/severity of the dialog. */
    type: "error" | "success" | "warning" | "info";
    /** Callback to resolve the confirmation. */
    resolve: () => void;
    /** Callback to reject/cancel the confirmation. */
    reject: () => void;
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
        (_v: number) => import("@/types").ValidationRuleType[],
        (_v: number) => import("@/types").ValidationRuleType[]
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
    target: { files: UnwrapRef<Blob>[] };
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
export type DateConfigType = typeof import("@/constants").DATE;

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
 * Permitted dialog action identifiers.
 */
export type DialogActionType =
    | "fadeInStock"
    | "showDividend"
    | "addStock"
    | "updateStock"
    | "addAccount"
    | "updateAccount"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "updateBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "deleteAccountConfirmation";

/**
 * Interface for components that can be hosted inside a dialog.
 */
export interface DialogComponent {
    /** Callback triggered when the OK button is clicked. */
    onClickOk: () => Promise<void>;
    /** Header title for the dialog. */
    title: string;
}

/**
 * Names of dialogs that can be opened via the teleport hub.
 */
export type DialogNameType = Extract<
    MenuActionType,
    | "fadeInStock"
    | "showDividend"
    | "addStock"
    | "updateStock"
    | "addAccount"
    | "updateAccount"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "updateBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "deleteAccountConfirmation"
>;

/**
 * Result of a domain-level validation check.
 */
export interface DomainValidationResult {
    /** Whether the value passed validation. */
    isValid: boolean;
    /** Error code if validation failed. */
    error?: import("@/types").ValidationCodeType;
}

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
    | "focus"
    | "input"
    | "keydown"
    | "load"
    | "submit"
    | "success"
    | "upgradeneeded"
    | "DOMContentLoaded";

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
    accounts: import("@/types").AccountDb[];
    /** Exported transactions. */
    bookings: import("@/types").BookingDb[];
    /** Exported transaction categories. */
    bookingTypes: import("@/types").BookingTypeDb[];
    /** Exported stocks. */
    stocks: import("@/types").StockDb[];
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
 * Contract for form components that support programmatic validation.
 */
export type FormContract = {
    /** Triggers validation and returns the result. */
    validate: () => Promise<import("@/types").FormValidateResultType>;
    /** Resets the form's validation state. */
    resetValidation?: () => void;
};

/**
 * Permitted operation modes for forms.
 */
export type FormModeType = "add" | "update" | "delete";

/**
 * Interface for managing form state and mapping to database entities.
 *
 * @template TForm - The form data structure.
 * @template TDB - The database entity structure.
 */
export interface FormsManager<TForm, TDB, TArgs extends unknown[] = unknown[]> {
    /** Reactive form state. */
    formData: UnwrapNestedRefs<TForm>;
    /** Resets the form to the initial state. */
    reset: () => void;
    /** Maps form data to a database entity. */
    mapFormToDb: (_data: UnwrapNestedRefs<TForm>, ..._args: TArgs) => TDB;
}

/**
 * Result of a form validation call.
 */
export type FormValidateResultType = {
    /** Whether all fields are valid. */
    valid: boolean;
    /** List of error messages if invalid. */
    errors?: string[];
};

/**
 * Options for handling user alerts and feedback.
 */
export interface HandleUserAlertOptions {
    /** Optional data payload for the alert. */
    data?: unknown;
    /** Severity level of the log/alert. */
    logLevel?: import("@/types").LogLevelType;
    /** Delay before showing the alert (ms). */
    delay?: number | null;
    /** Lifetime of the alert (ms). */
    duration?: number | null;
    /** Configuration for a confirmation dialog. */
    confirm?: {
        confirmText?: string;
        cancelText?: string;
        type?: "error" | "success" | "warning" | "info";
    };
    /** Rate limiting for duplicate alerts. */
    rateLimitMs?: number;
    /** Unique ID to track related operations. */
    correlationId?: string;
}

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
export type IndexedDbConfigType = typeof import("@/constants").INDEXED_DB;

/**
 * Represents an old booking format used in legacy imports.
 */
export interface LegacyBookingDb {
    /** Unix timestamp (seconds). */
    cDate: number;
    /** Execution day of the month. */
    cExDay: number;
    /** Quotation unit. */
    cUnitQuotation: number;
    /** Total amount. */
    cAmount: number;
    /** Description or note. */
    cDescription: string;
    /** Number of shares. */
    cCount: number;
    /** Legacy type identifier. */
    cType: number;
    /** ID of the associated stock. */
    cStockID: number;
    /** Solidarity surcharge. */
    cSoli: number;
    /** Capital gains tax. */
    cTax: number;
    /** Transaction fees. */
    cFees: number;
    /** Source tax. */
    cSTax: number;
    /** Financial transaction tax. */
    cFTax: number;
    /** Marketplace identifier. */
    cMarketPlace: string;
}

/**
 * Represents an old stock format used in legacy imports.
 */
export interface LegacyStockDb {
    /** Unique identifier. */
    cID: number;
    /** Stock symbol. */
    cSym: string;
    /** Meeting day timestamp. */
    cMeetingDay: number;
    /** Quarter day timestamp. */
    cQuarterDay: number;
    /** Company name. */
    cCompany: string;
    /** International Securities Identification Number. */
    cISIN: string;
    /** Faded out flag (integer). */
    cFadeOut: number;
    /** First page flag (integer). */
    cFirstPage: number;
    /** External URL. */
    cURL: string;
}

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
 * Severity levels for logging.
 */
export type LogLevelType = "info" | "warn" | "error" | "log";

/**
 * Valid keys for commodity items.
 */
export type MaterialItemKeyType = "ag" | "al" | "au" | "brent" | "cu" | "ni" | "pb" | "pd" | "pt" | "sn" | "wti";

/**
 * List of all available menu actions.
 */
export type MenuActionType =
    | "updateBooking"
    | "deleteBooking"
    | "updateStock"
    | "deleteStock"
    | "showDividend"
    | "openLink"
    | "fadeInStock"
    | "addAccount"
    | "updateAccount"
    | "deleteAccount"
    | "addStock"
    | "addBookingType"
    | "deleteBookingType"
    | "updateBookingType"
    | "addBooking"
    | "exportDatabase"
    | "importDatabase"
    | "showAccounting"
    | "updateQuote"
    | "deleteAccountConfirmation"
    | "home"
    | "company"
    | "setting";

/**
 * Configuration for a record's context menu.
 */
export interface MenuConfigData {
    /** Target record identifier. */
    recordId: number;
    /** Available menu items. */
    items: readonly MenuItemData[];
}

/**
 * Descriptor for a single menu item.
 */
export interface MenuItemData {
    /** Unique ID for the item. */
    id: string;
    /** Display title. */
    title: string;
    /** Icon name. */
    icon: string;
    /** Action to execute. */
    action: MenuActionType;
    /** Visual variant (e.g., danger for delete). */
    variant?: "default" | "danger";
}

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
 * A simple key-value pair with a numeric key and string value.
 */
export interface NumberStringPair {
    key: number;
    value: string;
}

/**
 * Validator function for numeric values.
 */
export type NumberValidatorType = (_v: number) => boolean | string;

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
 * Descriptor for a tab in the options view.
 */
export interface OptionTab {
    /** Tab identifier. */
    id: string;
    /** Display title. */
    title: string;
}

/**
 * Structure of a paragraph in the privacy view.
 */
export interface PrivacyParagraph {
    SUBTITLE: string;
    CONTENT: string;
    ICON: string;
}

/**
 * Options for database query operations.
 */
export interface QueryOptions {
    /** Optional existing transaction to use for the query. */
    tx?: IDBTransaction;
}

/**
 * Description of a single record operation (add, put, delete).
 */
export interface RecordOperation {
    /** Type of operation. */
    type: string;
    /** Data payload for add/put operations. */
    data?: unknown;
    /** Primary key for delete or keyed put operations. */
    key?: number;
}

/**
 * Full set of raw database records grouped by store.
 */
export interface RecordsDbData {
    accountsDB: import("@/types").AccountDb[];
    bookingsDB: import("@/types").BookingDb[];
    bookingTypesDB: import("@/types").BookingTypeDb[];
    stocksDB: import("@/types").StockDb[];
}

/**
 * Full set of store-ready items grouped by domain.
 */
export interface RecordsStoreData {
    accounts: import("@/types").AccountStoreItem[];
    bookings: import("@/types").BookingDb[];
    bookingTypes: import("@/types").BookingTypeDb[];
    stocks: import("@/types").StockItem[];
}

/**
 * Result of an automated database repair operation.
 */
export interface RepairResult {
    /** Whether the repair process finished without critical errors. */
    success: boolean;
    /** Number of fixed records. */
    fixed: number;
    /** Errors encountered during repair. */
    errors: Array<{
        issue: string;
        store: string;
        error: string;
    }>;
}

/**
 * Mapping of repository names to their respective instances.
 */
export interface RepositoryMap {
    accounts: ReturnType<typeof import("@/services/database/repositories/account").createAccountRepository>;
    bookings: ReturnType<typeof import("@/services/database/repositories/booking").createBookingRepository>;
    bookingTypes: ReturnType<typeof import("@/services/database/repositories/bookingType").createBookingTypeRepository>;
    stocks: ReturnType<typeof import("@/services/database/repositories/stock").createStockRepository>;
}

/**
 * Permitted repository identifier types.
 */
export type RepositoryType = "accounts" | "bookings" | "bookingTypes" | "stocks";

/**
 * Data structure used for rolling back changes to a previous state.
 */
export interface RollbackData {
    accounts: import("@/types").AccountDb[];
    stocks: import("@/types").StockDb[];
    bookingTypes: import("@/types").BookingTypeDb[];
    bookings: import("@/types").BookingDb[];
    activeAccountId: number;
}

/**
 * Function type for fetching data from a service.
 */
export interface ServiceFetcherType {
    /** Fetches market data for a list of stocks. */
    (_urls: import("@/types").NumberStringPair[]): Promise<import("@/types").StockMarketData[]>;
}

/**
 * Permitted service provider names.
 */
export type ServiceName = "goyax" | "fnet" | "wstreet" | "acheck" | "ard" | "tgate";

/**
 * Interface for application settings in the store.
 */
export type SettingsStoreContract = {
    /** ID of the account currently selected by the user. */
    activeAccountId: number;
};

/**
 * Represents a stock or financial instrument in the database.
 */
export interface StockDb {
    /** Unique identifier. */
    cID: number;
    /** Company name. */
    cCompany: string;
    /** International Securities Identification Number. */
    cISIN: string;
    /** Stock ticker symbol. */
    cSymbol: string;
    /** Whether this stock is shown on the first page. */
    cFirstPage: number;
    /** Whether this stock is faded out in views. */
    cFadeOut: number;
    /** Meeting day information. */
    cMeetingDay: string;
    /** Quarter day information. */
    cQuarterDay: string;
    /** External URL for stock information. */
    cURL: string;
    /** ID of the associated account. */
    cAccountNumberID: number;
    /** Ask dates for stock inquiries. */
    cAskDates: string;
}

/**
 * Data structure used in stock creation/update forms.
 */
export interface StockFormData {
    /** Unique identifier for the stock. */
    id: number;
    /** International Securities Identification Number. */
    isin: string;
    /** Company name. */
    company: string;
    /** Stock ticker symbol. */
    symbol: string;
    /** Meeting day information string. */
    meetingDay: string;
    /** Quarter day information string. */
    quarterDay: string;
    /** Whether the stock is hidden from lists (1 = true, 0 = false). */
    fadeOut: 1 | 0;
    /** Whether the stock is pinned to the first page (1 = true, 0 = false). */
    firstPage: 1 | 0;
    /** External informational URL. */
    url: string;
    /** Formatted string of inquiry dates. */
    askDates: string;
}

/**
 * Properties for the StockForm component.
 */
export interface StockFormProps {
    /** Whether the form is used for an existing stock. */
    isUpdate: boolean;
}

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
 * Interface for the stock data store.
 */
export type StockStoreContract = {
    /** List of all stocks currently in the store. */
    items: StockItem[];
    /** Resets the stock store. */
    clean: () => void;
    /** Adds a stock to the store. */
    add: (_stock: StockItem, _prepend?: boolean) => void;
};

/**
 * Flattened mapping of storage keys to their values.
 */
export type StorageDataType = {
    [P in (typeof import("@/constants").BROWSER_STORAGE)[keyof typeof import("@/constants").BROWSER_STORAGE]["key"]]: Extract<
        (typeof import("@/constants").BROWSER_STORAGE)[keyof typeof import("@/constants").BROWSER_STORAGE],
        { key: P }
    >["value"] extends infer V
        ? V extends readonly any[]
            ? string[]
            : V extends number
                ? number
                : V extends string
                    ? string
                    : V
        : never;
};

/**
 * Generic type for any value stored in the browser storage.
 */
export type StorageValueType = StorageDataType[keyof StorageDataType];

/**
 * Static configuration for store identifiers.
 */
export interface StoresConfigType {
    /** Map of index keys to names. */
    INDEXES: { [key: string]: string };
    /** Map of material keys to names. */
    MATERIALS: { [key: string]: string };
}

/**
 * A simple key-value pair with a string key and number value.
 */
export interface StringNumberPair {
    key: string;
    value: number;
}

/**
 * Validator function for string values.
 */
export type StringValidatorType = (_v: string) => boolean | string;

/**
 * State of the global dialog teleport hub.
 */
export interface TeleportState {
    /** Currently active dialog name. */
    dialogName: DialogNameType | undefined;
    /** Whether the dialog confirms with OK. */
    dialogOk: boolean;
    /** Whether the dialog is visible. */
    dialogVisibility: boolean;
}

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
 * Generic mapping for i18n translation keys.
 */
export type TranslationKeysType = {
    [p: string]: string;
};

/**
 * Stable identifiers for validation errors.
 */
export type ValidationCodeType =
    (typeof import("@/constants").VALIDATION_CODES)[keyof typeof import("@/constants").VALIDATION_CODES];

/**
 * Generic validation rule function.
 */
export type ValidationRuleType = (_value: unknown) => boolean | string;

/**
 * Router paths for the main views.
 */
export type ViewPathType =
    | "/"
    | "/company"
    | "/help"
    | "/privacy";

/**
 * Available main views in the application.
 */
export type ViewTypeSelectionType =
    | "home"
    | "company"
    | "settings"
    | "help"
    | "privacy";

/**
 * State of a currently visible alert/notification.
 */
export interface VisibleAlertData {
    /** Alert identifier. */
    id: number;
    /** Type/Severity of the alert. */
    type: "error" | "success" | "warning" | "info" | undefined;
    /** Title of the alert. */
    title: string;
    /** Detailed message. */
    message: string;
}


declare global {
    module "*.vue" {
        import type { DefineComponent } from "vue";
        const component: DefineComponent<
            Record<string, any>, // props
            Record<string, any>, // return from setup()
            any // other component options
        >;
        export default component;
    }
}
