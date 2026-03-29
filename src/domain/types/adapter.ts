/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ValidStoreNameType} from "@/domain/constants";
import type {AccountDb, BookingDb, BookingTypeDb, StockDb} from "@/domain/types/domain";

export interface QueryOptions {
    tx?: IDBTransaction;
}

export type RecordOperation =
    | { type: "clear" }
    | { type: "delete"; key: number }
    | { type: "add"; data: unknown }
    | { type: "put"; data: unknown };

export interface BatchOperationDescriptor {
    storeName: ValidStoreNameType;
    operations: RecordOperation[];
}

export interface RecordsDbData {
    accountsDB: AccountDb[];
    bookingsDB: BookingDb[];
    bookingTypesDB: BookingTypeDb[];
    stocksDB: StockDb[];
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

export interface BaseRepository<T> {
    findById: (_id: number, _options?: QueryOptions) => Promise<T | null>;
    findAll: (_options?: QueryOptions) => Promise<T[]>;
    save: (_data: T | Omit<T, "cID">, _options?: QueryOptions) => Promise<number>;
    delete: (_id: number, _options?: QueryOptions) => Promise<void>;
}

export interface AccountRepository extends BaseRepository<AccountDb> {
    findByIBAN?: (_iban: string) => Promise<AccountDb | null>;
    ibanExists?: (_iban: string) => Promise<boolean>;
}

export interface BookingRepository extends BaseRepository<BookingDb> {
    findByAccount: (_accountId: number, _options?: QueryOptions) => Promise<BookingDb[]>;
    findByDate: (_date: string, _options?: QueryOptions) => Promise<BookingDb[]>;
    findByBookingType: (_bookingTypeId: number, _options?: QueryOptions) => Promise<BookingDb[]>;
    findByStock: (_stockId: number, _options?: QueryOptions) => Promise<BookingDb[]>;
    deleteByAccount: (_accountId: number, _options?: QueryOptions) => Promise<void>;
    countByAccount: (_accountId: number) => Promise<number>;
}

export interface BookingTypeRepository extends BaseRepository<BookingTypeDb> {
    findByAccount: (_accountId: number, _options?: QueryOptions) => Promise<BookingTypeDb[]>;
    deleteByAccount: (_accountId: number, _options?: QueryOptions) => Promise<void>;
    countByAccount: (_accountId: number) => Promise<number>;
}

export interface StockRepository extends BaseRepository<StockDb> {
    findByAccount: (_accountId: number, _options?: QueryOptions) => Promise<StockDb[]>;
    deleteByAccount: (_accountId: number, _options?: QueryOptions) => Promise<void>;
    countByAccount: (_accountId: number) => Promise<number>;
}

export interface RepositoryMap {
    accounts: AccountRepository;
    bookings: BookingRepository;
    bookingTypes: BookingTypeRepository;
    stocks: StockRepository;
}

export type RepositoryType = keyof RepositoryMap;

export interface RollbackData {
    accounts: AccountDb[];
    stocks: StockDb[];
    bookingTypes: BookingTypeDb[];
    bookings: BookingDb[];
    activeAccountId: number;
}

/**
 * Flattened mapping of storage keys to their values.
 */
export type StorageDataType = {
    [P in (typeof import("@/domain/constants").BROWSER_STORAGE)[keyof typeof import("@/domain/constants").BROWSER_STORAGE]["key"]]?: Extract<
        (typeof import("@/domain/constants").BROWSER_STORAGE)[keyof typeof import("@/domain/constants").BROWSER_STORAGE],
        { key: P }
    >["value"] extends infer V
        ? V extends readonly unknown[]
            ? string[]
            : V extends number
                ? number
                : V extends string
                    ? string
                    : V
        : never;
};

export type StorageValueType = Exclude<StorageDataType[keyof StorageDataType], undefined>;
