/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export interface AccountDb {
    cID: number;
    cSwift: string;
    cIban: string;
    cLogoUrl: string;
    cWithDepot: boolean;
}

export interface AccountEntry {
    id: number;
    name: string;
    sum: number;
    nameClass: string;
    sumClass: string;
}

export interface AccountFormData {
    id: number;
    swift: string;
    iban: string;
    logoUrl: string;
    withDepot: boolean;
}

export interface AccountFormProps {
    isUpdate: boolean;
}

export type AccountStoreContract = {
    items: AccountStoreItem[];
    clean: () => void;
    add: (_account: AccountStoreItem, _prepend?: boolean) => void;
};

export interface AccountStoreItem extends AccountDb {
}

export type ActionHandler = (_recordId: number) => Promise<void>;

export type AlertKindType = "info" | "error" | "confirm";

export type AlertModeType = "notice" | "alert";

export type AlertStoreContract = {
    info: (_title: string, _message: string, _duration: number | null) => void;
};

export type AppErrorCategoryType =
    | SYSTEM.ERRORS.CATEGORY.NETWORK
    | SYSTEM.ERRORS.CATEGORY.VALIDATION
    | SYSTEM.ERRORS.CATEGORY.DATABASE
    | SYSTEM.ERRORS.CATEGORY.BUSINESS;

export interface AppMetadata {
    cVersion: number;
    cDBVersion: number;
    cEngine: string;
}

export interface AppStatus {
    storage: "ok" | "aborted" | "error";
    db: "ok" | "aborted" | "error";
    fetch: { exchanges: boolean; indexes: boolean; materials: boolean };
}

export interface BackupData {
    sm: {
        cVersion: number;
        cDBVersion: number;
        cEngine: string;
    };
    accounts: AccountDb[];
    bookings: BookingDb[];
    bookingTypes: BookingTypeDb[];
    stocks: StockDb[] & StockItem[] & LegacyStockDb[];
    transfers?: LegacyBookingDb[];
}

export interface BackupValidationResult {
    isValid: boolean;
    version: number;
    error?: string;
}

export interface BaseDialogForm {
    formRef: Ref<FormContract | null>; //FormContract | null;
    validateForm: () => Promise<boolean>;
}

export interface BaseEntity {
    cID?: number;
}

export interface BatchOperationDescriptor {
    storeName: string;
    operations: RecordOperation[];
}

export interface BookingDb {
    cID: number;
    cBookDate: string;
    cExDate: string;
    cDebit: number;
    cCredit: number;
    cDescription: string;
    cCount: number;
    cBookingTypeID: number;
    cAccountNumberID: number;
    cStockID: number;
    cSoliCredit: number;
    cSoliDebit: number;
    cTaxCredit: number;
    cTaxDebit: number;
    cFeeCredit: number;
    cFeeDebit: number;
    cSourceTaxCredit: number;
    cSourceTaxDebit: number;
    cTransactionTaxCredit: number;
    cTransactionTaxDebit: number;
    cMarketPlace: string;
}

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

export type BookingStoreContract = {
    items: BookingDb[];
    clean: () => void;
    add: (_booking: BookingDb, _prepend?: boolean) => void;
};

export interface BookingTypeDb {
    cID: number;
    cName: string;
    cAccountNumberID: number;
}

export interface BookingTypeFormData {
    id: number | null;
    name: string;
}

export interface BookingTypeFormProps {
    mode: FormModeType;
}

export type BookingTypeStoreContract = {
    items: BookingTypeDb[];
    clean: () => void;
    add: (_bookingType: BookingTypeDb, _prepend?: boolean) => void;
};

export interface CheckboxGridProps {
    type: string;
}

export interface CompanyData {
    company: string;
    symbol: string;
}

export interface ConfirmationDialogData {
    id: number;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: "error" | "success" | "warning" | "info";
    resolve: () => void;
    reject: () => void;
}

export interface ContentCardProps {
    title: string;
    data: ContentItem[];
}

export interface ContentItem {
    readonly subTitle: string;
    readonly content: string;
    readonly icon: string;
}

export interface CreditDebitFieldsetProps {
    modelValue: { credit: number; debit: number };
    disabled?: boolean;
    legend: string;
    rules: [
        (_v: number) => ValidationRuleType[],
        (_v: number) => ValidationRuleType[]
    ];
}

export interface CurrencyInputProps {
    modelValue: number;
    disabled?: boolean;
    label: string;
    rules?: Array<(_v: number) => boolean | string>;
}

export interface CustomEventTarget extends HTMLInputElement {
    target: { files: UnwrapRef<Blob>[] };
}

export interface DatabaseConnection {
    connect(): Promise<void>;

    disconnect(): Promise<void>;

    isConnected(): boolean;

    getDatabase(): IDBDatabase;

    onVersionChange(_handler: () => void): void;
}

export interface DatabaseMigratorContract {
    setupDatabase(_db: IDBDatabase, _ev: IDBVersionChangeEvent): void;
}

export type DateConfigType = typeof DATE;

export interface DateData {
    key: number | undefined;
    value: {
        qf: number;
        gm: number;
    };
}

export interface DialogComponent {
    onClickOk: () => Promise<void>;
    title: string;
}

export interface DomainValidationResult {
    isValid: boolean;
    error?: ValidationCodeType;
}

export interface DynamicListProps {
    type: string;
    hint?: string;
    placeholder?: string;
}

export interface ExchangeData {
    key: string;
    value: number;
}

export interface ExportData {
    sm: {
        cVersion: number;
        cDBVersion: number;
        cEngine: string;
    };
    accounts: AccountDb[];
    bookings: BookingDb[];
    bookingTypes: BookingTypeDb[];
    stocks: StockDb[];
}

export interface FetchConfigType {
    PROVIDERS: {
        [key: string]: {
            NAME: string;
            HOME: string;
            QUOTE: string;
        };
    };
    FNET: {
        INDEXES: string;
        DATES: string;
        MATERIALS: string;
        ONLINE_TEST: string;
        SEARCH: string;
    };
    FX: {
        NAME: string;
        HOME: string;
        QUOTE: string;
    };
    DEFAULT_TTL: number;
    DEFAULT_VALUE: string;
    DEFAULT_CURRENCY: string;
    TARGET_PERIOD: string;
    DEFAULT_CURRENCY_SYMBOL: string;
}

export interface FetchResult {
    rate: string;
    min: string;
    max: string;
    currency: string;
}

export type FormContract = {
    validate: () => FormValidateResultType;
    resetValidation?: () => void;
};

export type FormModeType = "add" | "update" | "delete";

export interface FormsManager<TForm, TDB> {
    formData: UnwrapNestedRefs<TForm>;
    reset: () => void;
    mapFormToDb: (_data: UnwrapNestedRefs<TForm>, ..._args: any[]) => TDB;
}

export type FormValidateResultType = { valid: boolean; errors?: string[] };

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

export interface HeaderItem {
    title: string;
    align: "start";
    sortable: boolean;
    key: string;
}

export interface HealthCheckResult {
    healthy: boolean;
    issues: HealthIssue[];
    stats: HealthStats;
}

export interface HealthIssue {
    type: "orphaned_records" | "invalid_references" | "missing_data";
    severity: "warning" | "error";
    store: string;
    count: number;
    details?: string;
}

export interface HealthStats {
    totalAccounts: number;
    totalBookings: number;
    totalStocks: number;
    totalBookingTypes: number;
    orphanedBookings: number;
    orphanedStocks: number;
    orphanedBookingTypes: number;
}

export type HighlightColor = "green" | "red" | "yellow" | "blue";

export interface HighlightOptions {
    color?: HighlightColor;
    duration?: number;
}

export interface I18nWrapper {
    i18n: I18n<{ "de-DE": MessageSchemaType; "en-US": MessageSchemaType }>;
}

export type IndexedDbConfigType = typeof INDEXED_DB;

export interface LegacyBookingDb {
    cDate: number;
    cExDay: number;
    cUnitQuotation: number;
    cAmount: number;
    cDescription: string;
    cCount: number;
    cType: number;
    cStockID: number;
    cSoli: number;
    cTax: number;
    cFees: number;
    cSTax: number;
    cFTax: number;
    cMarketPlace: string;
}

export interface LegacyStockDb {
    cID: number;
    cSym: string;
    cMeetingDay: number;
    cQuarterDay: number;
    cCompany: string;
    cISIN: string;
    cFadeOut: number;
    cFirstPage: number;
    cURL: string;
}

export interface LocalStorageData {
    sActiveAccountId: number;
    sSkin: string;
    sBookingsPerPage: number;
    sStocksPerPage: number;
    sDividendsPerPage: number;
    sSumsPerPage: number;
    sService: string;
    sExchanges: string[];
    sIndexes: string[];
    sMarkets: string[];
    sMaterials: string[];
}

export type LogLevelType = "info" | "warn" | "error" | "log";

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

export interface MenuConfigData {
    recordId: number;
    items: readonly MenuItemData[];
}

export interface MenuItemData {
    id: string;
    title: string;
    icon: string;
    action: MenuActionType;
    variant?: "default" | "danger";
}

export type MessageSchemaType = typeof deDE;

export interface NumberParseOptions {
    locale?: "de" | "en";
    fallback?: number;
    throwOnError?: boolean;
}

export interface NumberStringPair {
    key: number | undefined;
    value: string;
}

export type NumberValidatorType = (_v: number) => boolean | string;

export interface OnlineStorageData {
    id: number | undefined;
    isin: string;
    min: string;
    rate: string;
    max: string;
    cur: string;
}

export interface OptionTab {
    id: string;
    title: string;
}

export interface PiniaWrapper {
    pinia: Pinia;
}

export interface PrivacyParagraph {
    SUBTITLE: string;
    CONTENT: string;
    ICON: string;
}

export interface QueryOptions {
    tx?: IDBTransaction;
}

export interface RecordOperation {
    type: string;
    data?: unknown;
    key?: number;
}

export interface RecordsDbData {
    accountsDB: AccountDb[];
    bookingsDB: BookingDb[];
    bookingTypesDB: BookingTypeDb[];
    stocksDB: StockDb[];
}

export interface RecordsStoreData {
    accounts: AccountStoreItem[];
    bookings: BookingDb[];
    bookingTypes: BookingTypeDb[];
    stocks: StockItem[];
}

export interface RepairResult {
    success: boolean;
    fixed: number;
    errors: Array<{
        issue: string;
        store: string;
        error: string;
    }>;
}

export interface RepositoryMap {
    accounts: import("@/services/database/repositories/account").AccountRepository;
    bookings: import("@/services/database/repositories/booking").BookingRepository;
    bookingTypes: import("@/services/database/repositories/bookingType").BookingTypeRepository;
    stocks: import("@/services/database/repositories/stock").StockRepository;
}

export type RepositoryType = "accounts" | "bookings" | "bookingTypes" | "stocks";

export interface RollbackData {
    accounts: AccountDb[];
    stocks: StockDb[];
    bookingTypes: BookingTypeDb[];
    bookings: BookingDb[];
    activeAccountId: number;
}

export interface RouterWrapper {
    router: Router;
}

export interface ServiceFetcherType {
    (_urls: NumberStringPair[]): Promise<StockMarketData[]>;
}

export type SettingsStoreContract = {
    activeAccountId: number;
};

export interface StockDb {
    cID: number;
    cCompany: string;
    cISIN: string;
    cSymbol: string;
    cFirstPage: number;
    cFadeOut: number;
    cMeetingDay: string;
    cQuarterDay: string;
    cURL: string;
    cAccountNumberID: number;
    cAskDates: string;
}

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

export interface StockFormProps {
    isUpdate: boolean;
}

export interface StockItem extends StockRamData, StockDb {
    //
}

export interface StockMarketData {
    id: number;
    isin: string;
    rate: string;
    min: string;
    max: string;
    cur: string;
}

export interface StockRamData {
    mPortfolio?: number;
    mInvest?: number;
    mChange?: number;
    mBuyValue?: number;
    mEuroChange?: number;
    mMin?: number;
    mValue?: number;
    mMax?: number;
    mDividendYielda?: number;
    mDividendYeara?: number;
    mDividendYieldb?: number;
    mDividendYearb?: number;
    mRealDividend?: number;
    mRealBuyValue?: number;
    mDeleteable?: boolean;
}

export type StockStoreContract = {
    items: StockItem[];
    clean: () => void;
    add: (_stock: StockItem, _prepend?: boolean) => void;
};

export type StorageDataType = {
    [P in (typeof import("@/domains/configs/storage").BROWSER_STORAGE)[keyof typeof import("@/domains/configs/storage").BROWSER_STORAGE]["key"]]: Extract<
        (typeof import("@/domains/configs/storage").BROWSER_STORAGE)[keyof typeof import("@/domains/configs/storage").BROWSER_STORAGE],
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

export type StorageValueType = StorageDataType[keyof StorageDataType];

export interface StoresConfigType {
    INDEXES: { [key: string]: string };
    MATERIALS: { [key: string]: string };
}

export interface StringNumberPair {
    key: string;
    value: number;
}

export type StringValidatorType = (_v: string) => boolean | string;

export interface TeleportState {
    dialogName: string;
    dialogOk: boolean;
    dialogVisibility: boolean;
}

export interface TransactionOptions {
    timeout?: number;
    onProgress?: (_progress: TransactionProgress) => void;
}

export interface TransactionProgress {
    phase: "started" | "executing" | "completing" | "completed";
    store?: string;
}

export type TranslationKeysType = {
    [p: string]: string;
};

export type UserInfoAlertConfirmResult = boolean; // user choice

export type UserInfoAlertErrorResult = number; // alert id

export type UserInfoAlertInfoResult = number; // alert id

export type UserInfoConsoleResult = void;

export type UserInfoNoticeResult = void;

export type UserInfoResult =
    | UserInfoConsoleResult
    | UserInfoNoticeResult
    | UserInfoAlertInfoResult
    | UserInfoAlertErrorResult
    | UserInfoAlertConfirmResult;

export type ValidationCodeType =
    (typeof VALIDATION_CODES)[keyof typeof VALIDATION_CODES];

export type ValidationRuleType = (_value: unknown) => boolean | string;

export type ViewTypeSelectionType =
    | "home"
    | "company"
    | "settings"
    | "help" | "privacy";

export interface VisibleAlertData {
    id: number;
    type: "error" | "success" | "warning" | "info" | undefined;
    title: string;
    message: string;
}

export interface VuetifyWrapper {
    vuetify: ReturnType<typeof createVuetify>;
}

declare global {
    module "*.vue" {
        import type {DefineComponent} from "vue";
        const component: DefineComponent<
            Record<string, any>, // props
            Record<string, any>, // return from setup()
            any // other component options
        >;
        export default component;
    }
}
