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
    LegacyBookingDb,
    LegacyStockDb,
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
}

export interface BookingTypeRepositoryPort {
    save: (_data: BookingTypeDb | Omit<BookingTypeDb, "cID">, _options?: TxOptions) => Promise<number>;
    delete: (_id: number, _options?: TxOptions) => Promise<void>;
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

export interface ImportExportPort {
    validateBackup: (_data: unknown) => BackupValidationResult;
    validateDataIntegrity: (_backup: BackupData) => string[];
    validateLegacyDataIntegrity: (_backup: BackupData) => string[];
    readJsonFile: (_blob: Blob) => Promise<BackupData>;
    stringifyDatabase: (
        _sm: AppMetadata,
        _accounts: AccountDb[],
        _stocks: StockDb[],
        _bookingTypes: BookingTypeDb[],
        _bookings: BookingDb[]
    ) => string;
    verifyExportIntegrity: (_exportedData: string) => { valid: boolean; errors: string[] };
    transformLegacyStock: (_rec: LegacyStockDb, _activeId: number) => StockDb;
    transformLegacyBooking: (_rec: LegacyBookingDb, _index: number, _activeId: number) => BookingDb;
}

export interface RecordsAccountsPort {
    items: Array<Pick<AccountDb, "cID">>;
    add: (_account: AccountDb) => void;
    update: (_account: AccountDb) => void;
    remove: (_accountId: number) => void;
}

export interface RecordsBookingTypesPort {
    add: (_bt: BookingTypeDb) => void;
    update: (_bt: BookingTypeDb) => void;
    remove: (_id: number) => void;
}

export interface RecordsBookingsPort {
    add: (_booking: BookingDb, _prepend?: boolean) => void;
    update: (_booking: BookingDb) => void;
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
    add: (_stock: StockDb) => void;
    update: (_stock: StockDb) => void;
}

export interface RepositoriesPort {
    accounts: AccountRepositoryPort;
    bookings: BookingRepositoryPort;
    bookingTypes: BookingTypeRepositoryPort;
    stocks: StockRepositoryPort;
}

/** Common deps bundle for use cases that persist to DB, update in-memory records, and reset UI state. */
export type PersistDeps = {
    repositories: RepositoriesPort;
    records: RecordsPort;
    runtime: RuntimePort;
};

export interface RuntimePort {
    resetTeleport: () => void;
}

export interface SettingsPort {
    /** Readable and writable — usecases may update this to persist the active account. */
    activeAccountId: number;
}

export interface StockRepositoryPort {
    save: (_data: StockDb | Omit<StockDb, "cID">, _options?: TxOptions) => Promise<number>;
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