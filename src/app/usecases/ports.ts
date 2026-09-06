/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountDb,
    AppMetadata,
    BackupData,
    BackupValidationResult,
    BookingDb,
    BookingTypeDb,
    HandleUserAlertOptions,
    RecordsDbData,
    StockDb,
    StorageValueType
} from "@/domain/types";

export type TxOptions = { tx?: IDBTransaction };

export interface AccountRepositoryPort {
    save: (_data: AccountDb | Omit<AccountDb, "cID">, _options?: TxOptions) => Promise<number>;
}

export interface AlertPort {
    feedbackInfo: (
        _title: string,
        _msg: unknown,
        _options?: HandleUserAlertOptions
    ) => Promise<number | void>;
    feedbackError: (
        _title: string,
        _msg: unknown,
        _options: HandleUserAlertOptions
    ) => Promise<number | void>;
    feedbackConfirm?: (
        _title: string,
        _msg: unknown,
        _options?: HandleUserAlertOptions
    ) => Promise<boolean | void>;
}

export interface BookingRepositoryPort {
    save: (_data: BookingDb | Omit<BookingDb, "cID">, _options?: TxOptions) => Promise<number>;
    delete: (_id: number, _options?: TxOptions) => Promise<void>;
}

export interface BookingTypeRepositoryPort {
    save: (_data: BookingTypeDb | Omit<BookingTypeDb, "cID">, _options?: TxOptions) => Promise<number>;
    delete: (_id: number, _options?: TxOptions) => Promise<void>;
    /**
     * Declared here because two role-uniqueness guards need an account-scoped
     * read that is correct for *any* account: `updateAccountUsecase`'s
     * `existingRoles` and `updateBookingTypeUsecase`'s role-conflict check both
     * used to derive it from `records.bookingTypes.items`, which holds only the
     * **active** account's types — so the `cAccountNumberID` filter read like it
     * made them account-agnostic when it did not.
     */
    findByAccount: (_accountId: number, _options?: TxOptions) => Promise<BookingTypeDb[]>;
    /**
     * Declared here for `deleteBookingTypeUsecase`'s role guard, which needs the
     * `cRole` of the record it is about to delete. Read from the repository
     * rather than `records.bookingTypes.items` for the same reason
     * `findByAccount` is: the store holds only the **active** account's types,
     * so a guard built on it would silently fail *open* for any other account.
     */
    findById: (_id: number, _options?: TxOptions) => Promise<BookingTypeDb | null>;
}

export interface BrowserPort {
    manifest: () => { version: string };
    writeBufferToFile: (_buffer: string, _filename: string) => Promise<void>;
}

export interface DatabaseAccountsPort {
    transactionManager: TransactionManagerPort;
    deleteAccountRecords: (_accountId: number) => Promise<void>;
    getAccountRecords: (_accountId: number) => Promise<RecordsDbData>;
}

/**
 * A faithful whole-database read, in ONE readonly transaction.
 *
 * Declared as its own port because the difference from four separate
 * `repository.findAll()` calls is a correctness property, not a convenience:
 * `databaseAdapter.getAllRecords` reads all four stores inside a single
 * transaction "so the four stores cannot be observed at different points in
 * time" (its own doc comment). The export used to issue the four reads
 * independently — each `findAll()` without a `tx` opens its own transaction —
 * and then ran `findExportConsistencyIssues` over the possibly-torn result,
 * which is the one check standing between the app and a backup it would later
 * refuse to re-import.
 *
 * Note `getAccountRecords` is NOT interchangeable here: it returns every account
 * but only the *active* account's bookings/bookingTypes/stocks.
 */
export interface DatabaseSnapshotPort {
    getAllRecords: () => Promise<RecordsDbData>;
}

export interface ImportExportPort {
    validateBackup: (_data: unknown) => BackupValidationResult;
    validateDataIntegrity: (_backup: BackupData) => string[];
    readJsonFile: (_blob: Blob) => Promise<BackupData>;
    stringifyDatabase: (
        _sm: AppMetadata,
        _accounts: AccountDb[],
        _stocks: StockDb[],
        _bookingTypes: BookingTypeDb[],
        _bookings: BookingDb[]
    ) => string;
    verifyExportIntegrity: (_exportedData: string) => { valid: boolean; errors: string[] };
}

/**
 * Every leaf store's `add` takes an optional `prepend` flag (stores/accounts.ts,
 * stores/stocks.ts, stores/bookingTypes.ts, stores/bookings.ts). Only
 * `bookings` used to declare it here, so `toRecordsPort` silently dropped the
 * argument for the other three and TypeScript endorsed the loss — a call site
 * could pass `true` and be quietly ignored. Declared on all four so the port
 * mirrors the stores it wraps.
 */
export interface RecordsAccountsPort {
    items: Array<Pick<AccountDb, "cID">>;
    add: (_account: AccountDb, _prepend?: boolean) => void;
    update: (_account: AccountDb) => void;
    remove: (_accountId: number) => void;
}

export interface RecordsBookingTypesPort {
    items: Array<Pick<BookingTypeDb, "cID" | "cAccountNumberID" | "cRole">>;
    add: (_bt: BookingTypeDb, _prepend?: boolean) => void;
    update: (_bt: BookingTypeDb) => void;
    remove: (_id: number) => void;
}

export interface RecordsBookingsPort {
    items: Array<Pick<BookingDb, "cID">>;
    add: (_booking: BookingDb, _prepend?: boolean) => void;
    update: (_booking: BookingDb) => void;
    remove: (_id: number) => void;
}

export interface RecordsPort {
    accounts: RecordsAccountsPort;
    bookingTypes: RecordsBookingTypesPort;
    bookings: RecordsBookingsPort;
    stocks: RecordsStocksPort;
    clean: (_hard?: boolean) => void;
    init: (_db: RecordsDbData, _messages: { title: string; message: string }) => Promise<void> | void;
}

export interface RecordsStocksPort {
    items: Array<Pick<StockDb, "cID">>;
    add: (_stock: StockDb, _prepend?: boolean) => void;
    update: (_stock: StockDb) => void;
    remove: (_id: number) => void;
}

export interface RepositoriesPort {
    accounts: AccountRepositoryPort;
    bookings: BookingRepositoryPort;
    bookingTypes: BookingTypeRepositoryPort;
    stocks: StockRepositoryPort;
}

/** Common deps bundle for use cases that persist to DB, update in-memory records, and reset the UI state. */
export type PersistDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
    runtime: RuntimePort;
};

export interface RuntimePort {
    resetTeleport: () => void;
    /**
     * Invalidates every stock page's online-data freshness marker.
     *
     * Any write that adds, removes, or edits a stock — or a booking, which is
     * what drives a stock's holdings — can change which page a stock lands on:
     * `portfolio.active` is a flat list sorted by `cFirstPage` then
     * `mPortfolio`, then sliced into pages. Because paging is positional, one
     * write can shift every stock after it, so the whole freshness cache is
     * invalidated rather than a single page.
     */
    clearStocksPages: () => void;
}

export interface SettingsPort {
    /** Readable and writable — usecases may update this to persist the active account. */
    activeAccountId: number;
}

export interface StockRepositoryPort {
    save: (_data: StockDb | Omit<StockDb, "cID">, _options?: TxOptions) => Promise<number>;
    delete: (_id: number, _options?: TxOptions) => Promise<void>;
}

export interface StoragePort {
    setStorage: (_key: string, _value: StorageValueType) => Promise<void>;
}

export interface TransactionManagerPort {
    execute: <T>(
        _storeNames: string[],
        _mode: IDBTransactionMode,
        _cb: (_tx: IDBTransaction) => Promise<T>
    ) => Promise<T>;
}