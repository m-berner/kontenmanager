/* eslint-disable no-unused-vars */
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
import {useAppConfig} from '@/composables/useAppConfig'

const {log} = useApp()
const {INDEXED_DB} = useAppConfig()

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

class IndexedDBManager {
    private static instance: IndexedDBManager
    private dbPromise: Promise<IDBDatabase> | null = null
    private isConnectedFlag = false

    private constructor() {
    }

    private setupDatabase(db: IDBDatabase): void {
        // Accounts store
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.ACCOUNTS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.ACCOUNTS.NAME, {
                keyPath: INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${INDEXED_DB.STORE.ACCOUNTS.NAME}_uk1`, INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN, {unique: true})
        }

        // Bookings store
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKINGS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.BOOKINGS.NAME, {
                keyPath: INDEXED_DB.STORE.BOOKINGS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k1`, INDEXED_DB.STORE.BOOKINGS.FIELDS.DATE, {unique: false})
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k2`, INDEXED_DB.STORE.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`, INDEXED_DB.STORE.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
            store.createIndex(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k4`, INDEXED_DB.STORE.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
        }

        // Booking Types store
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.BOOKING_TYPES.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME, {
                keyPath: INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`, INDEXED_DB.STORE.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }

        // Stocks store
        if (!db.objectStoreNames.contains(INDEXED_DB.STORE.STOCKS.NAME)) {
            const store = db.createObjectStore(INDEXED_DB.STORE.STOCKS.NAME, {
                keyPath: INDEXED_DB.STORE.STOCKS.FIELDS.ID,
                autoIncrement: true
            })
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_uk1`, INDEXED_DB.STORE.STOCKS.FIELDS.ISIN, {unique: true})
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_uk2`, INDEXED_DB.STORE.STOCKS.FIELDS.SYMBOL, {unique: true})
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k1`, INDEXED_DB.STORE.STOCKS.FIELDS.FADE_OUT, {unique: false})
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k2`, INDEXED_DB.STORE.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
            store.createIndex(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`, INDEXED_DB.STORE.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }
    }

    private async initDB(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(INDEXED_DB.NAME, INDEXED_DB.VERSION)

                request.onerror = () => {
                    log('Database open failed', request.error, 'error')
                    reject(request.error)
                }

                request.onsuccess = () => {
                    const db = request.result

                    db.onversionchange = () => {
                        log('Database version changed, closing connection')
                        db.close()
                        this.dbPromise = null
                        this.isConnectedFlag = false
                    }

                    db.onclose = () => {
                        log('Database connection closed')
                        this.isConnectedFlag = false
                        this.dbPromise = null
                    }

                    this.isConnectedFlag = true
                    log('Database opened successfully')
                    resolve(db)
                }

                request.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
                    const db = (ev.target as IDBOpenDBRequest).result
                    log('Database upgrade needed', ev.oldVersion + ev.newVersion!, 'info')
                    this.setupDatabase(db)
                }
            })
        }
        return this.dbPromise
    }

    static getInstance(): IndexedDBManager {
        if (!IndexedDBManager.instance) {
            IndexedDBManager.instance = new IndexedDBManager()
        }
        return IndexedDBManager.instance
    }

    async getDB(): Promise<IDBDatabase> {
        return this.initDB()
    }

    async closeDB(): Promise<void> {
        if (this.dbPromise) {
            try {
                const db = await this.dbPromise
                db.close()
            } catch (error) {
                log('Error closing database', {error})
            } finally {
                this.dbPromise = null
                this.isConnectedFlag = false
            }
        }
    }

    isConnected(): boolean {
        return this.isConnectedFlag
    }
}

// Singleton composable pattern
const manager = IndexedDBManager.getInstance()
const isConnected = ref<boolean>(false)
const error = ref<unknown | null>(null)
const isLoading = ref<boolean>(false)

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

export function useIndexedDB() {
    async function getDB(): Promise<IDBDatabase> {
        isLoading.value = true
        error.value = null
        try {
            const db = await manager.getDB()
            isConnected.value = true
            return db
        } catch (err) {
            error.value = err
            isConnected.value = false
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function closeDB(): Promise<void> {
        await manager.closeDB()
        isConnected.value = false
        log('USE_INDEXED_DB: closeDB')
    }

    async function add<T>(storeName: string, data: T): Promise<number> {
        try {
            const db = await getDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.add(data)

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result as number)
                request.onerror = () => reject(new DatabaseError(
                    `Failed to add record: ${request.error?.message}`,
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
            const db = await getDB()
            const tx = db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const request = store.get(key)

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(new DatabaseError(
                    `Failed to get record: ${request.error?.message}`,
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
            const db = await getDB()
            const tx = db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const request = store.getAll()

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(new DatabaseError(
                    `Failed to getAll records: ${request.error?.message}`,
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
            const db = await getDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.put(data)

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(new DatabaseError(
                    `Failed to update record: ${request.error?.message}`,
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
            const db = await getDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            store.delete(key)

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve()
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
            const db = await getDB()
            const tx = db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            store.clear()

            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(new DatabaseError(
                    `Failed to clear records: ${tx.error?.message}`,
                    'DB_CLEAR_FAILED',
                    'clear'
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
        const db = await getDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)

        return new Promise((resolve, reject) => {
            operations.forEach(op => {
                try {
                    switch (op.type) {
                        case 'add':
                            store.add(op.data)
                            break
                        case 'put':
                            store.put(op.data)
                            break
                        case 'delete':
                            if (!op.key) {
                                reject(new Error('Delete operation requires a key'))
                                return
                            }
                            store.delete(op.key)
                            break
                        default:
                            reject(new Error(`Unknown operation type: ${(op as any).type}`))
                            return
                    }
                } catch (e) {
                    reject(e)
                }
            })

            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(new DatabaseError(
                `Failed to execute batch operations: ${tx.error?.message}`,
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
        const db = await getDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.getAll(value)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(new DatabaseError(
                `Failed to getAllByIndex: ${request.error?.message}`,
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

    async function deleteDatabaseWithAccount(accountId: number): Promise<void> {
        log('USE_INDEXED_DB: deleteDatabaseWithAccount')
        const db = await getDB()
        const tx = db.transaction(
            [
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.ACCOUNTS.NAME
            ],
            'readwrite'
        )

        const bookingsStore = tx.objectStore(INDEXED_DB.STORE.BOOKINGS.NAME)
        const bookingTypesStore = tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME)
        const stocksStore = tx.objectStore(INDEXED_DB.STORE.STOCKS.NAME)
        const accountsStore = tx.objectStore(INDEXED_DB.STORE.ACCOUNTS.NAME)

        // Use indexes for efficient filtering
        const bookingsIndex = bookingsStore.index(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`)
        const bookingTypesIndex = bookingTypesStore.index(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`)
        const stocksIndex = stocksStore.index(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`)

        // Delete using cursors on indexes
        const deletePromises: Promise<void>[] = []

        deletePromises.push(
            new Promise((resolve, reject) => {
                const req = bookingsIndex.openCursor(IDBKeyRange.only(accountId))
                req.onsuccess = () => {
                    const cursor = req.result
                    if (cursor) {
                        cursor.delete()
                        cursor.continue()
                    } else {
                        resolve()
                    }
                }
                req.onerror = () => reject(req.error)
            })
        )

        deletePromises.push(
            new Promise((resolve, reject) => {
                const req = bookingTypesIndex.openCursor(IDBKeyRange.only(accountId))
                req.onsuccess = () => {
                    const cursor = req.result
                    if (cursor) {
                        cursor.delete()
                        cursor.continue()
                    } else {
                        resolve()
                    }
                }
                req.onerror = () => reject(req.error)
            })
        )

        deletePromises.push(
            new Promise((resolve, reject) => {
                const req = stocksIndex.openCursor(IDBKeyRange.only(accountId))
                req.onsuccess = () => {
                    const cursor = req.result
                    if (cursor) {
                        cursor.delete()
                        cursor.continue()
                    } else {
                        resolve()
                    }
                }
                req.onerror = () => reject(req.error)
            })
        )

        await Promise.all(deletePromises)
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
        const db = await getDB()
        const tx = db.transaction(
            [
                INDEXED_DB.STORE.BOOKINGS.NAME,
                INDEXED_DB.STORE.BOOKING_TYPES.NAME,
                INDEXED_DB.STORE.STOCKS.NAME,
                INDEXED_DB.STORE.ACCOUNTS.NAME
            ],
            'readonly'
        )

        const accountsStoreDB = tx.objectStore(INDEXED_DB.STORE.ACCOUNTS.NAME)
        const bookingsStoreDB = tx.objectStore(INDEXED_DB.STORE.BOOKINGS.NAME)
        const bookingTypesStoreDB = tx.objectStore(INDEXED_DB.STORE.BOOKING_TYPES.NAME)
        const stocksStoreDB = tx.objectStore(INDEXED_DB.STORE.STOCKS.NAME)

        const requestAccounts = accountsStoreDB.getAll()
        const requestBookings = bookingsStoreDB.index(`${INDEXED_DB.STORE.BOOKINGS.NAME}_k3`).getAll(accountId)
        const requestBookingTypes = bookingTypesStoreDB.index(`${INDEXED_DB.STORE.BOOKING_TYPES.NAME}_k1`).getAll(accountId)
        const requestStocks = stocksStoreDB.index(`${INDEXED_DB.STORE.STOCKS.NAME}_k3`).getAll(accountId)

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve(
                    {
                        accountsDB: requestAccounts.result,
                        bookingsDB: requestBookings.result,
                        bookingTypesDB: requestBookingTypes.result,
                        stocksDB: requestStocks.result
                    }
                )
            }
            tx.onerror = () => reject(new DatabaseError(
                `Failed to get database stores: ${tx.error?.message}`,
                'DB_GETDATABASESTORES_FAILED',
                'getDatabaseStores'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'getDatabaseStores'
            ))
        })
    }

    async function countByIndex(storeName: string, indexName: string, value: number | string): Promise<number> {
        const db = await getDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.count(value)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(new DatabaseError(
                `Failed to count records by index: ${request.error?.message}`,
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
    ): Promise<void> {
        const db = await getDB()
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
            request.onerror = () => reject(new DatabaseError(
                `Failed to process cursor: ${request.error?.message}`,
                'DB_PROCESS_WITH_CURSOR_FAILED',
                'processWithCursor'
            ))
            tx.onabort = () => reject(new DatabaseError(
                'Transaction aborted',
                'TX_ABORTED',
                'processWithCursor'
            ))
        })
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
    return useDBStore<I_Account_DB>(INDEXED_DB.STORE.ACCOUNTS.NAME)
}

export function useBookingsDB() {
    return useDBStore<I_Booking_DB>(INDEXED_DB.STORE.BOOKINGS.NAME)
}

export function useBookingTypesDB() {
    return useDBStore<I_Booking_Type_DB>(INDEXED_DB.STORE.BOOKING_TYPES.NAME)
}

export function useStocksDB() {
    const store = useDBStore<I_Stock_DB>(INDEXED_DB.STORE.STOCKS.NAME)

    return {
        ...store,
        update: (stockData: I_Stock_Store) => {
            const {
                mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin,
                mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb,
                mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData
            } = stockData
            return store.update(cleanData as I_Stock_DB)
        }
    }
}
