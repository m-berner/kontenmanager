/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {
    I_Account_DB,
    I_Booking_DB,
    I_Booking_Type_DB,
    I_Records,
    I_Records_DB,
    I_Stock_DB,
    I_Stock_Store
} from '@/types'
import {ref} from 'vue'
import {useApp} from '@/composables/useApp'

const {CONS, log} = useApp()
// Single global database promise
const dbInstance = ref<Promise<IDBDatabase> | null>(null)
const isConnected = ref<boolean>(false)
const error = ref<unknown | null>(null)
const isLoading = ref<boolean>(false)

class DatabaseError extends Error {
    constructor(
        message: string,
        public _code: string,
        public _operation: string
    ) {
        super(message)
        this.name = 'DatabaseError'
    }
}

function useDBStore<T>(storeName: string) {
    const dbi = useIndexedDB()
    return {
        isConnected: dbi.isConnected,
        error: dbi.error,
        isLoading: dbi.isLoading,

        add: (data: Omit<T, 'cID'>) => dbi.add(storeName, data),
        getAll: () => dbi.getAll<T>(storeName),
        update: (data: T) => dbi.update(storeName, data),
        remove: (id: number) => dbi.remove(storeName, id),
        clear: () => dbi.clear(storeName),
        batchImport: (batch: I_Records[]) => dbi.batchOperations(storeName, batch)
    }
}

export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    // Database schema setup
    function _setupDatabase(db: IDBDatabase): void {
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

    async function closeDB(): Promise<void> {
        if (dbInstance.value) {
            const db = await dbInstance.value
            db.close()
            dbInstance.value = null
            isConnected.value = false
            log('USE_INDEXED_DB: closeDB')
        }
    }

    async function _openDB(): Promise<IDBDatabase> {
        if (!dbInstance.value) {
            isLoading.value = true
            error.value = null

            dbInstance.value = new Promise((resolve, reject) => {
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
                        dbInstance.value = null
                        isConnected.value = false
                    }

                    db.onclose = () => {
                        log('Database connection closed')
                        isConnected.value = false
                        dbInstance.value = null
                    }

                    isConnected.value = true
                    isLoading.value = false
                    resolve(db)
                }

                request.onupgradeneeded = (ev: Event) => {
                    if (ev.target instanceof IDBRequest) {
                        _setupDatabase(ev.target.result)
                    }
                }
            })
        }
        log('USE_INDEXED_DB: _openDB', {info: dbInstance.value})
        return dbInstance.value
    }

    async function add<T>(storeName: string, data: T): Promise<number> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.add(data)

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result as number)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to add record: ${tx.error?.message}`,
                    'DB_ADD_FAILED',
                    'add'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'add'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'add'
            )
        }
    }

    async function get<T>(storeName: string, key: number): Promise<T> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const request = store.get(key)

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to get records: ${tx.error?.message}`,
                    'DB_GET_FAILED',
                    'get'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'get'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'get'
            )
        }
    }

    async function getAll<T>(storeName: string): Promise<T[]> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const request = store.getAll()

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to getAll records: ${tx.error?.message}`,
                    'DB_GET_ALL_FAILED',
                    'getAll'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'getAll'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'getAll'
            )
        }
    }

    async function update<T>(storeName: string, data: T): Promise<IDBValidKey> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.put(data)

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result as number)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to update record: ${tx.error?.message}`,
                    'DB_UPDATE_FAILED',
                    'update'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'update'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'update'
            )
        }
    }

    async function remove(storeName: string, key: number): Promise<void> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.delete(key)

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to remove record: ${tx.error?.message}`,
                    'DB_REMOVE_FAILED',
                    'remove'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'remove'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'remove'
            )
        }
    }

    async function clear(storeName: string): Promise<void> {
        try {
            const db = await _openDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.clear()

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(request.result)
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to clear records: ${tx.error?.message}`,
                    'DB_CLEAR_FAILED',
                    'clrea'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'clear'
                ))
            })
        } catch (error) {
            throw new DatabaseError(
                `Database operation failed: ${error}`,
                'DB_CONNECTION_FAILED',
                'clear'
            )
        }
    }

    async function batchOperations(storeName: string, operations: I_Records[]): Promise<void> {
        const db = await _openDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)

        return new Promise((resolve, reject) => {
            let completed = 0
            try {
                operations.forEach(op => {
                    let request: IDBRequest
                    switch (op.type) {
                        case 'add':
                            request = store.add(op.data)
                            break
                        case 'put':
                            request = store.put(op.data)
                            break
                        case 'delete':
                            if (!op.key) {
                                reject(new Error('Delete operation requires a key'))
                                return
                            }
                            request = store.delete(op.key)
                            break
                        default:
                            reject(new Error(`Unknown operation type: ${(op as any).type}`))
                            return
                    }
                    request.onsuccess = () => {
                        completed++
                        if (completed === operations.length) {
                            resolve()
                        }
                    }
                    request.onerror = () => {
                        reject(request.error)
                    }
                })
            } catch (e) {
                log('USE_INDEXED_DB', {error: e})
            }
            tx.onerror = () => reject(new DatabaseError(
                `Failed to execute operations: ${tx.error?.message}`,
                'DB_BATCH_FAILED',
                'batchOperations'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'batchOperations'
            ))
        })
    }

    async function getAllByIndex<T>(storeName: string, indexName: string, value: number | string): Promise<T[]> {
        const db = await _openDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.getAll(value)

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result)
            tx.onerror = () => reject(new DatabaseError(
                `Failed to getAllByIndex record: ${tx.error?.message}`,
                'DB_GETALLBYINDEX_FAILED',
                'getAllByIndex'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'getAllByIndex'
            ))
        })
    }

    async function _getAllInTransaction<T>(tx: IDBTransaction, storeName: string): Promise<T[]> {
        const store = tx.objectStore(storeName)
        const request = store.getAll()
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async function deleteDatabaseWithAccount(accountId: number): Promise<void> {
        log('INDEXED_DB: deleteDatabaseWithAccount')
        const db = await _openDB()
        const tx = db.transaction(
            [
                CONS.INDEXED_DB.STORES.BOOKINGS.NAME,
                CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME,
                CONS.INDEXED_DB.STORES.STOCKS.NAME,
                CONS.INDEXED_DB.STORES.ACCOUNTS.NAME
            ], 'readwrite'
        )

        // Get all records first
        const bookings = await _getAllInTransaction<I_Booking_DB>(tx, CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        const bookingTypes = await _getAllInTransaction<I_Booking_Type_DB>(tx, CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        const stocks = await _getAllInTransaction<I_Stock_DB>(tx, CONS.INDEXED_DB.STORES.STOCKS.NAME)

        // Delete in one transaction
        const bookingsStore = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        const bookingTypesStore = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        const stocksStore = tx.objectStore(CONS.INDEXED_DB.STORES.STOCKS.NAME)
        const accountsStore = tx.objectStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)

        bookings.filter((b: I_Booking_DB) => b.cAccountNumberID === accountId).forEach((b: I_Booking_DB) => bookingsStore.delete(b.cID!))
        bookingTypes.filter((bt: I_Booking_Type_DB) => bt.cAccountNumberID === accountId).forEach((bt: I_Booking_Type_DB) => bookingTypesStore.delete(bt.cID!))
        stocks.filter((s: I_Stock_DB) => s.cAccountNumberID === accountId).forEach((s: I_Stock_DB) => stocksStore.delete(s.cID!))
        accountsStore.delete(accountId)
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(new DatabaseError(
                `Failed to delete database: ${tx.error?.message}`,
                'DB_DELETION_FAILED',
                'deleteDatabaseWithAccount'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'deleteDatabaseWithAccount'
            ))
        })
    }

    async function getDatabaseStores(accountId: number): Promise<I_Records_DB> {
        log('USE_INDEXED_DB: getDatabaseStores')
        const db = await _openDB()
        const tx = db.transaction(
            [
                CONS.INDEXED_DB.STORES.BOOKINGS.NAME,
                CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME,
                CONS.INDEXED_DB.STORES.STOCKS.NAME,
                CONS.INDEXED_DB.STORES.ACCOUNTS.NAME
            ], 'readonly'
        )

        const accountsStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        const bookingsStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        const bookingTypesStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        const stocksStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.STOCKS.NAME)

        const requestAccounts = accountsStoreDB.getAll()
        const requestBookings = bookingsStoreDB.getAll()
        const requestBookingTypes = bookingTypesStoreDB.getAll()
        const requestStocks = stocksStoreDB.getAll()

        const results: I_Records_DB = {
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        }
        requestAccounts.onsuccess = () => {
            results.accountsDB = [...requestAccounts.result]
        }
        requestBookings.onsuccess = () => {
            results.bookingsDB = [...requestBookings.result.filter(b => b.cAccountNumberID === accountId)]
        }
        requestBookingTypes.onsuccess = () => {
            results.bookingTypesDB = [...requestBookingTypes.result.filter(bt => bt.cAccountNumberID === accountId)]
        }
        requestStocks.onsuccess = () => {
            results.stocksDB = [...requestStocks.result.filter(s => s.cAccountNumberID === accountId)]
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve(
                    {
                        accountsDB: results.accountsDB,
                        bookingsDB: results.bookingsDB,
                        bookingTypesDB: results.bookingTypesDB,
                        stocksDB: results.stocksDB
                    }
                )
            }
            tx.onerror = () => reject(new DatabaseError(
                `Failed to get database stores: ${tx.error?.message}`,
                'DB_GETDATABASESTORES_FAILED',
                'getDatabaseStore'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'getDatabaseStores'
            ))
        })
    }

    async function countByIndex(storeName: string, indexName: string, value: number | string): Promise<number> {
        const db = await _openDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.count(value)

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result)
            tx.onerror = () => reject(new DatabaseError(
                `Failed to count records by index: ${tx.error?.message}`,
                'DB_COUNTBYINDEX_FAILED',
                'countByIndex'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'countByIndex'
            ))
        })
    }

    async function processWithCursor<T>(
        storeName: string,
        callback: (_item: T) => void | Promise<void>,
        indexName?: string,
        range?: IDBKeyRange
    ): Promise<void | null> {
        const db = await _openDB()
        if (db !== null) {
            const tx = db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const source = indexName ? store.index(indexName) : store
            const request = source.openCursor(range)

            return new Promise((resolve, reject) => {
                request.onsuccess = async (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
                    if (cursor) {
                        await callback(cursor.value)
                        cursor.continue()
                    } else {
                        resolve()
                    }
                }
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to add record: ${tx.error?.message}`,
                    'DB_PROCESS_WITH_CURSOR_FAILED',
                    'processWithCursor'
                ))
                tx.onabort = () => reject(new DatabaseError(
                    'Transaction aborted',
                    'TX_ABORTED',
                    'processWithCursor'
                )) })
        }
        return null
    }

    return {
        isConnected,
        error,
        isLoading,
        closeDB,
        countByIndex,
        add,
        get,
        getAll,
        update,
        remove,
        clear,
        batchOperations,
        getAllByIndex,
        deleteDatabaseWithAccount,
        getDatabaseStores,
        processWithCursor
    }
}

export function useAccountsDB() {
    return useDBStore<I_Account_DB>(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
}

export function useBookingsDB() {
    return useDBStore<I_Booking_DB>(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
}

export function useBookingTypesDB() {
    return useDBStore<I_Booking_Type_DB>(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
}

// Stocks need special handling for computed properties
export function useStocksDB() {
    const store = useDBStore<I_Stock_DB>(CONS.INDEXED_DB.STORES.STOCKS.NAME)

    return {
        ...store,
        update: (stockData: I_Stock_Store) => {
            // Isolate temporary properties before saving
            /* eslint-disable no-unused-vars */
            const {
                mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin,
                mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb,
                mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData
            } = stockData
            return store.update(cleanData as I_Stock_DB)
        }
    }
}
