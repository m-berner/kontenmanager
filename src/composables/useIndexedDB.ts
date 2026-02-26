/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountDb,
    BookingDb,
    BookingTypeDb,
    RecordOperation,
    RepositoryType,
    StockDb,
    StockItem
} from "@/types";
import {INDEXED_DB} from "@/configs/database";
import {databaseService} from "@/services/database/service";
import {DomainValidators} from "@/domains/validation/validators";
import {DomainUtils} from "@/domains/utils";

type CrudRepository<T extends { cID?: number }> = {
    save: (_data: T | Omit<T, "cID">, _options?: { tx?: IDBTransaction }) => Promise<number>;
    findById: (_id: number, _options?: { tx?: IDBTransaction }) => Promise<T | null>;
    findAll: (_options?: { tx?: IDBTransaction }) => Promise<T[]>;
    delete: (_id: number, _options?: { tx?: IDBTransaction }) => Promise<void>;
};

/**
 * Generic internal helper to create store-specific IndexedDB wrappers.
 *
 * @param storeName - The name of the IndexedDB object store.
 * @returns An object with common database operations for the store.
 */
function useDBStore<T extends { cID?: number }>(storeName: RepositoryType) {
    const dbi = databaseService;
    const repo = dbi.getRepository(storeName) as unknown as CrudRepository<T>;

    return {
        /** Adds a new record. */
        add: (data: Omit<T, "cID">, tx?: IDBTransaction) =>
            repo.save(data, {tx}),
        /** Retrieves a record by ID. */
        get: (id: number, tx?: IDBTransaction) => repo.findById(id, {tx}) as Promise<T | null>,
        /** Retrieves all records from the store. */
        getAll: (tx?: IDBTransaction) => repo.findAll({tx}) as Promise<T[]>,
        /** Updates an existing record. */
        update: (data: T, tx?: IDBTransaction) => repo.save(data, {tx}),
        /** Removes a record by ID. */
        remove: (id: number, tx?: IDBTransaction) => repo.delete(id, {tx}),
        /** Clears all records in the store. */
        clear: (_tx?: IDBTransaction) =>
            dbi.transactionManager.execute(storeName, "readwrite", async (t) => {
                const store = t.objectStore(storeName);
                store.clear();
            }),
        /** Executes batch operations. */
        batchImport: (batch: RecordOperation[]) =>
            dbi.batchOperations(storeName, batch),
        /** Atomic multi-store import. */
        atomicImport: (
            stores: { storeName: string; operations: RecordOperation[] }[]
        ) => dbi.atomicImport(stores)
    };
}

/**
 * Composable for interacting with the 'accounts' IndexedDB store.
 */
export function useAccountsDB() {
    const store = useDBStore<AccountDb>(INDEXED_DB.STORE.ACCOUNTS.NAME);
    return {
        ...store,
        add: (data: Omit<AccountDb, "cID">, tx?: IDBTransaction) => {
            const validated = DomainValidators.validateAccount(data);
            const {cID, ...rest} = validated;
            return store.add(rest, tx);
        },
        update: (data: AccountDb, tx?: IDBTransaction) => {
            return store.update(DomainValidators.validateAccount(data), tx);
        }
    };
}

/**
 * Composable for interacting with the 'bookings' IndexedDB store.
 */
export function useBookingsDB() {
    const store = useDBStore<BookingDb>(INDEXED_DB.STORE.BOOKINGS.NAME);

    return {
        ...store,
        /** Adds a new record with validation. */
        add: (data: Omit<BookingDb, "cID">, tx?: IDBTransaction) => {
            const validated = DomainValidators.validateBooking(data);
            const {cID, ...rest} = validated;
            return store.add(rest, tx);
        },
        /** Updates an existing record with validation. */
        update: (data: BookingDb, tx?: IDBTransaction) => {
            return store.update(DomainValidators.validateBooking(data), tx);
        },
        /** Retrieves all records with validation. */
        getAll: async (tx?: IDBTransaction) => {
            const records = await store.getAll(tx);
            return records.map((rec) => DomainValidators.validateBooking(rec));
        }
    };
}

/**
 * Composable for interacting with the 'bookingTypes' IndexedDB store.
 */
export function useBookingTypesDB() {
    const store = useDBStore<BookingTypeDb>(INDEXED_DB.STORE.BOOKING_TYPES.NAME);
    return {
        ...store,
        add: (data: Omit<BookingTypeDb, "cID">, tx?: IDBTransaction) => {
            const validated = DomainValidators.validateBookingType(data);
            const {cID, ...rest} = validated;
            return store.add(rest, tx);
        },
        update: (data: BookingTypeDb, tx?: IDBTransaction) => {
            return store.update(DomainValidators.validateBookingType(data), tx);
        }
    };
}

/**
 * Composable for interacting with the 'stocks' IndexedDB store.
 * Includes a customized update method that strips RAM-only properties.
 */
export function useStocksDB() {
    const store = useDBStore<StockDb>(INDEXED_DB.STORE.STOCKS.NAME);

    return {
        ...store,
        add: (data: Omit<StockDb, "cID">, tx?: IDBTransaction) => {
            const validated = DomainValidators.validateStock(data);
            const {cID, ...rest} = validated;
            return store.add(rest, tx);
        },
        /**
         * Updates a stock record, ensuring only database-relevant fields are sent.
         * Strips calculated properties (prefix 'm').
         *
         * @param stockData - The full stock object including RAM state.
         * @param tx - Optional existing transaction.
         */
        update: (stockData: StockItem, tx?: IDBTransaction) => {
            const {
                mPortfolio,
                mInvest,
                mChange,
                mBuyValue,
                mEuroChange,
                mMin,
                mValue,
                mMax,
                mDividendYielda,
                mDividendYeara,
                mDividendYieldb,
                mDividendYearb,
                mRealDividend,
                mRealBuyValue,
                mDeleteable,
                ...cleanData
            } = stockData;
            return store.update(
                DomainValidators.validateStock(cleanData as StockDb),
                tx
            );
        }
    };
}

DomainUtils.log("COMPOSABLES useIndexedDB");
