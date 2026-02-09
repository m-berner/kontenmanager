/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
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

export interface AccountStoreItem extends AccountDb {}

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
  stocks: StocksDb[] & StockItem[] & LegacyStockDb[];
  transfers?: LegacyBookingDb[];
}

export interface BackupValidationResult {
  isValid: boolean;
  version: number;
  error?: string;
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

export interface DialogComponent {
  onClickOk: () => Promise<void>;
  title: string;
}

export interface BaseDialogForm {
  formRef: Ref<FormInterface | null>; //FormInterface | null;
  validateForm: () => Promise<boolean>;
}

export interface ContentItem {
  readonly subTitle: string;
  readonly content: string;
  readonly icon: string;
}

export interface ContentCardProps {
  title: string;
  data: ContentItem[];
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

export interface FetchResult {
  rate: string;
  min: string;
  max: string;
  currency: string;
}

export interface FormsManager<TForm, TDB> {
  formData: UnwrapNestedRefs<TForm>;
  reset: () => void;
  mapFormToDb: (_data: UnwrapNestedRefs<TForm>, ..._args: any[]) => TDB;
}

export interface DateData {
  key: number | undefined;
  value: {
    qf: number;
    gm: number;
  };
}

export interface DomainValidationResult {
  isValid: boolean;
  error?: ValidationCode;
}

export interface DynamicListProps {
  type: string;
  hint?: string;
  placeholder?: string;
}

export interface CustomEventTarget extends HTMLInputElement {
  target: { files: UnwrapRef<Blob>[] };
}

export interface ExchangeData {
  key: string;
  value: number;
}

export interface HandleUserAlertOptions {
  data?: unknown;
  logLevel?: LogLevelType;
  delay?: number | null;
  // Alert options
  duration?: number | null;
  confirm?: {
    confirmText?: string;
    cancelText?: string;
    type?: "error" | "success" | "warning" | "info";
  };
  // Rate limiting the window in ms (identical messages suppressed), default from DEFAULTS.USER_INFO.RATE_LIMIT_MS
  rateLimitMs?: number;
  // Optional correlation identifier forwarded to logs
  correlationId?: string;
}

export interface HeaderItem {
  title: string;
  align: "start";
  sortable: boolean;
  key: string;
}

export interface I18nWrapper {
  i18n: I18n<{ "de-DE": MessageSchemaType; "en-US": MessageSchemaType }>;
}

export interface AppMetadata {
  cVersion: number;
  cDBVersion: number;
  cEngine: string;
}

export interface NumberParseOptions {
  locale?: "de" | "en";
  fallback?: number;
  throwOnError?: boolean;
}

export interface NumberStringPair {
  key: number | undefined;
  value: string;
}

export interface MenuItemData {
  id: string;
  title: string;
  icon: string;
  action: MenuActionType;
  variant?: "default" | "danger";
}

export interface MenuConfigData {
  recordId: number;
  items: readonly MenuItemData[];
}

export interface StockMarketData {
  id: number;
  isin: string;
  rate: string;
  min: string;
  max: string;
  cur: string;
}

export interface PiniaWrapper {
  pinia: Pinia;
}

export interface RecordOperation {
  type: string;
  data?: unknown;
  key?: number;
}

export interface RouterWrapper {
  router: Router;
}

export interface ExternalServiceConfig {
  NAME: string;
  HOME: string;
  QUOTE: string;
}

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

export interface StockItem extends StockRamData, StockDb {
  //
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

export interface OnlineStorageData {
  id: number | undefined;
  isin: string;
  min: string;
  rate: string;
  max: string;
  cur: string;
}

export interface StringNumberPair {
  key: string;
  value: number;
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

export interface AccountStoreInterface {
  items: AccountStoreItem[];
  clean: () => void;
  add: (_account: AccountStoreItem, _prepend?: boolean) => void;
}

export interface BookingStoreInterface {
  items: BookingDb[];
  clean: () => void;
  add: (_booking: BookingDb, _prepend?: boolean) => void;
}

export interface BookingTypeStoreInterface {
  items: BookingTypeDb[];
  clean: () => void;
  add: (_bookingType: BookingTypeDb, _prepend?: boolean) => void;
}

export interface StockStoreInterface {
  items: StockItem[];
  clean: () => void;
  add: (_stock: StockItem, _prepend?: boolean) => void;
}

export interface SettingsStoreInterface {
  activeAccountId: number;
}

export interface AlertStoreInterface {
  info: (_title: string, _message: string, _duration: number | null) => void;
}

export interface RollbackData {
  accounts: AccountDb[];
  stocks: StockDb[];
  bookingTypes: BookingTypeDb[];
  bookings: BookingDb[];
  activeAccountId: number;
}

export interface ServiceFetcherType {
  (_urls: NumberStringPair[]): Promise<StockMarketData[]>;
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

export interface OptionTab {
  id: string;
  title: string;
}

export interface PrivacyParagraph {
  SUBTITLE: string;
  CONTENT: string;
  ICON: string;
}

export interface TeleportState {
  dialogName: string;
  dialogOk: boolean;
  dialogVisibility: boolean;
}

export interface ValidationResultData {
  valid: boolean;
  error?: string;
}

export interface VisibleAlertData {
  id: number;
  type: "error" | "success" | "warning" | "info" | undefined;
  title: string;
  message: string;
}

export interface VuetifyWrapper {
  vuetify: ReturnType<typeof createVuetify>;
}

export type Mode = "notice" | "alert";

export type AlertKind = "info" | "error" | "confirm";

// Discriminated result types for useAlert
export type UserInfoConsoleResult = void;
export type UserInfoNoticeResult = void;
export type UserInfoAlertInfoResult = number; // alert id
export type UserInfoAlertErrorResult = number; // alert id
export type UserInfoAlertConfirmResult = boolean; // user choice
export type UserInfoResult =
  | UserInfoConsoleResult
  | UserInfoNoticeResult
  | UserInfoAlertInfoResult
  | UserInfoAlertErrorResult
  | UserInfoAlertConfirmResult;

// Callable type for the handleUserInfo function used across dialogs/guards (mirrors overloads)
export interface HandleUserInfoFn {
  (
    _mode: "console",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions
  ): Promise<UserInfoConsoleResult>;
  (
    _mode: "notice",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions
  ): Promise<UserInfoNoticeResult>;
  (
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions & {
      alertKind?: "info";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertInfoResult>;
  (
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions & {
      alertKind?: "error";
      duration?: number | null;
    }
  ): Promise<UserInfoAlertErrorResult>;
  (
    _mode: "alert",
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions & { alertKind: "confirm" }
  ): Promise<UserInfoAlertConfirmResult>;
  (
    _mode: Mode,
    _title: string,
    _messageOrError: string | Error,
    _options?: HandleUserAlertOptions
  ): Promise<UserInfoResult>;
}

export type FormModeType = "add" | "update" | "delete";

export type DateConfigType = typeof DATE;

export type IndexedDbConfigType = typeof INDEXED_DB;

export type LogLevelType = "info" | "warn" | "error" | "log";

export type MessageSchemaType = typeof deDE;

// Rule builder type
export type RuleBuilderType = (..._args: any[]) => ValidationRuleType;

// Strongly typed browser storage snapshot derived from BROWSER_STORAGE config
// We map the runtime schema entries to a type whose keys are the literal
// storage keys (e.g., "sSkin") and whose values are the corresponding default
// value types (string | number | boolean | string[]).
type __BrowserStorageSchema =
  typeof import("@/domains/config/storage").BROWSER_STORAGE;
type __BrowserStorageEntryUnion =
  __BrowserStorageSchema[keyof __BrowserStorageSchema];

export type StorageDataType = {
  [P in __BrowserStorageEntryUnion["key"]]: Extract<
    __BrowserStorageEntryUnion,
    { key: P }
  >["value"];
};

export type StorageValueType = StorageDataType[keyof StorageDataType];

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

export type FormValidateResultType = { valid: boolean; errors?: string[] };

export type FormInterface = {
  validate: () => FormValidateResultType;
  resetValidation?: () => void;
};

export type StringValidatorType = (_v: string) => boolean | string;

export type NumberValidatorType = (_v: number) => boolean | string;

export type ValidationRuleType = (_value: unknown) => boolean | string;

export type AppErrorCategoryType =
  | SYSTEM.ERRORS.CATEGORY.NETWORK
  | SYSTEM.ERRORS.CATEGORY.VALIDATION
  | SYSTEM.ERRORS.CATEGORY.DATABASE
  | SYSTEM.ERRORS.CATEGORY.BUSINESS;

export type ValidationCode =
  (typeof VALIDATION_CODES)[keyof typeof VALIDATION_CODES];

export type ViewTypeSelection =
  | CODES.VIEW_CODES.HOME
  | CODES.VIEW_CODES.COMPANY
  | CODES.VIEW_CODES.SETTINGS;

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
