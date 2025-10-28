/* eslint-disable no-unused-vars */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {
    IAccount_DB,
    IBooking_DB,
    IBookingType_DB, IRecords_DB,
    IStock_DB,
    IStock_Store,
    IStores_DB
} from '@/types.d'
import {ref} from 'vue'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'

const {CONS, log} = useApp()
const {activeAccountId} = useSettings()

// Single global database promise
let dbPromise: Promise<IDBDatabase> | null = null

export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    const isConnected = ref<boolean>(false)
    const error = ref<unknown | null>(null)
    const isLoading = ref<boolean>(false)

    // Database schema setup
    function setupDatabase(db: IDBDatabase): void {
        const stores = CONS.INDEXED_DB.STORES

        // Accounts store
        if (!db.objectStoreNames.contains(stores.ACCOUNTS.NAME)) {
            const store = db.createObjectStore(stores.ACCOUNTS.NAME, {
                keyPath: stores.ACCOUNTS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${stores.ACCOUNTS.NAME}_uk1`, stores.ACCOUNTS.FIELDS.IBAN, {unique: true})
        }

        // Bookings store
        if (!db.objectStoreNames.contains(stores.BOOKINGS.NAME)) {
            const store = db.createObjectStore(stores.BOOKINGS.NAME, {
                keyPath: stores.BOOKINGS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${stores.BOOKINGS.NAME}_k1`, stores.BOOKINGS.FIELDS.DATE, {unique: false})
            store.createIndex(`${stores.BOOKINGS.NAME}_k2`, stores.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
            store.createIndex(`${stores.BOOKINGS.NAME}_k3`, stores.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
            store.createIndex(`${stores.BOOKINGS.NAME}_k4`, stores.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
        }

        // Booking Types store
        if (!db.objectStoreNames.contains(stores.BOOKING_TYPES.NAME)) {
            const store = db.createObjectStore(stores.BOOKING_TYPES.NAME, {
                keyPath: stores.BOOKING_TYPES.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${stores.BOOKING_TYPES.NAME}_k1`, stores.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }

        // Stocks store
        if (!db.objectStoreNames.contains(stores.STOCKS.NAME)) {
            const store = db.createObjectStore(stores.STOCKS.NAME, {
                keyPath: stores.STOCKS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${stores.STOCKS.NAME}_uk1`, stores.STOCKS.FIELDS.ISIN, {unique: true})
            store.createIndex(`${stores.STOCKS.NAME}_uk2`, stores.STOCKS.FIELDS.SYMBOL, {unique: true})
            store.createIndex(`${stores.STOCKS.NAME}_k1`, stores.STOCKS.FIELDS.FADE_OUT, {unique: false})
            store.createIndex(`${stores.STOCKS.NAME}_k2`, stores.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
            store.createIndex(`${stores.STOCKS.NAME}_k3`, stores.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }
    }

    // Get database connection
    async function getDB(): Promise<IDBDatabase> {
        if (!dbPromise) {
            isLoading.value = true
            error.value = null

            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, version)

                request.onerror = () => {
                    error.value = request.error
                    isLoading.value = false
                    reject(request.error)
                }

                request.onsuccess = () => {
                    const db = request.result

                    db.onversionchange = () => {
                        log('Database version changed, closing connection')
                        db.close()
                        dbPromise = null
                        isConnected.value = false
                    }

                    db.onclose = () => {
                        log('Database connection closed')
                        isConnected.value = false
                        dbPromise = null
                    }

                    isConnected.value = true
                    isLoading.value = false
                    resolve(db)
                }

                request.onupgradeneeded = (ev: Event) => {
                    if (ev.target instanceof IDBRequest) {
                        setupDatabase(ev.target.result)
                    }
                }
            })
        }

        return dbPromise
    }

    // Generic CRUD operations
    async function add<T>(storeName: string, data: T): Promise<number> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.add(data)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as number)
            request.onerror = () => reject(request.error)
        })
    }

    async function get<T>(storeName: string, key: number): Promise<T> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.get(key)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async function getAll<T>(storeName: string): Promise<T[]> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.getAll()

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async function update<T>(storeName: string, data: T): Promise<IDBValidKey> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.put(data)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async function remove(storeName: string, key: number): Promise<void> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.delete(key)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async function clear(storeName: string): Promise<void> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.clear()

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async function batchOperations(storeName: string, operations: IRecords_DB[]): Promise<unknown[]> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)

        const promises = operations.map(op => {
            let request: IDBRequest
            return new Promise((resolve, reject) => {
                switch (op.type) {
                    case 'add':
                        request = store.add(op.data)
                        break
                    case 'put':
                        request = store.put(op.data)
                        break
                    case 'delete':
                        request = store.delete(op.key!)
                        break
                }

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })

        return Promise.all(promises)
    }

    async function getByIndex<T>(storeName: string, indexName: string, value: number): Promise<T> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.get(value)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    // High-level operations
    async function deleteDatabaseWithAccount(accountId: number): Promise<void> {
        log('INDEXED_DB: deleteDatabaseWithAccount')

        const bookings = (await getAll<IBooking_DB>(CONS.INDEXED_DB.STORES.BOOKINGS.NAME))
            .filter(item => item.cAccountNumberID === accountId)
        const bookingTypes = (await getAll<IBookingType_DB>(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME))
            .filter(item => item.cAccountNumberID === accountId)
        const stocks = (await getAll<IStock_DB>(CONS.INDEXED_DB.STORES.STOCKS.NAME))
            .filter(item => item.cAccountNumberID === accountId)

        // Batch delete operations
        for (const rec of bookings) await remove(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, rec.cID)
        for (const rec of bookingTypes) await remove(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, rec.cID)
        for (const rec of stocks) await remove(CONS.INDEXED_DB.STORES.STOCKS.NAME, rec.cID)

        await remove(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountId)
    }

    async function getDatabaseStores(): Promise<IStores_DB> {
        log('INDEXED_DB: getDatabaseStores')

        const accountsDB = await getAll<IAccount_DB>(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        const allBookings = await getAll<IBooking_DB>(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        const allBookingTypes = await getAll<IBookingType_DB>(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        const allStocks = await getAll<IStock_DB>(CONS.INDEXED_DB.STORES.STOCKS.NAME)

        return {
            accountsDB,
            bookingsDB: allBookings.filter(b => b.cAccountNumberID === activeAccountId.value),
            bookingTypesDB: allBookingTypes.filter(bt => bt.cAccountNumberID === activeAccountId.value),
            stocksDB: allStocks.filter(s => s.cAccountNumberID === activeAccountId.value)
        }
    }

    return {
        isConnected,
        error,
        isLoading,
        getDB,
        add,
        get,
        getAll,
        update,
        remove,
        clear,
        batchOperations,
        getByIndex,
        deleteDatabaseWithAccount,
        getDatabaseStores
    }
}

// Generic store wrapper - replaces all 4 store-specific composables
export function useStore<T>(storeName: string) {
    const db = useIndexedDB()

    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        add: (data: Omit<T, 'cID'>) => db.add(storeName, data),
        getAll: () => db.getAll<T>(storeName),
        update: (data: T) => db.update(storeName, data),
        remove: (id: number) => db.remove(storeName, id),
        clear: () => db.clear(storeName),
        batchImport: (batch: IRecords_DB[]) => db.batchOperations(storeName, batch)
    }
}

// Convenience exports
export const useAccountsDB = () => useStore<IAccount_DB>(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
export const useBookingsDB = () => useStore<IBooking_DB>(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
export const useBookingTypesDB = () => useStore<IBookingType_DB>(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
// Stocks need special handling for computed properties
export function useStocksDB() {
    const store = useStore<IStock_DB>(CONS.INDEXED_DB.STORES.STOCKS.NAME)

    return {
        ...store,
        update: (stockData: IStock_Store) => {
            // Remove computed properties before saving
            const {mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin,
                mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb,
                mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData} = stockData
            return store.update(cleanData as IStock_DB)
        }
    }
}
