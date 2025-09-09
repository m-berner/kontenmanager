/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IAccountDB, IBookingDB, IBookingTypeDB, IStockDB} from '@/types'
import type {Ref} from 'vue'
import {ref} from 'vue'
import {useApp} from '@/composables/useApp'

// Global database instance (shared across components)
let dbInstance: { db: IDBDatabase } | null = null
let dbPromise: Promise<IDBDatabase> | null = null
const {CONS, log} = useApp()

export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    const isConnected: Ref<boolean> = ref(false)
    const error: Ref<unknown | null> = ref(null)
    const isLoading: Ref<boolean> = ref(false)

    // Database schema setup
    const _setupDatabase = (db: IDBDatabase): void => {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)) {
            const accountStore = db.createObjectStore(
                CONS.INDEXED_DB.STORES.ACCOUNTS.NAME,
                {
                    keyPath: CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.ID,
                    autoIncrement: true
                }
            )
            accountStore.createIndex(`${CONS.INDEXED_DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.NUMBER, {unique: true})
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)) {
            const bookingStore = db.createObjectStore(
                CONS.INDEXED_DB.STORES.BOOKINGS.NAME,
                {
                    keyPath: CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.ID,
                    autoIncrement: true
                }
            )
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k1`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.DATE, {unique: false})
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k2`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k3`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k4`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)) {
            const bookingTypeStore = db.createObjectStore(
                CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME,
                {
                    keyPath: CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID,
                    autoIncrement: true
                }
            )
            bookingTypeStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.STOCKS.NAME)) {
            const stockStore = db.createObjectStore(
                CONS.INDEXED_DB.STORES.STOCKS.NAME,
                {
                    keyPath: CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID,
                    autoIncrement: true
                }
            )
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_uk1`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ISIN, {unique: true})
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_uk2`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.SYMBOL, {unique: true})
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k1`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.FADE_OUT, {unique: false})
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k2`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k3`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
        }
    }

    // Get database connection (singleton pattern)
    const getDB = async (): Promise<IDBDatabase> => {
        if (dbInstance && !dbInstance.db) {
            // Connection closed, reset
            dbInstance = null
            dbPromise = null
        }

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
                    const db: IDBDatabase = request.result

                    // Handle version change from another tab
                    db.onversionchange = () => {
                        log('Database version changed, closing connection')
                        db.close()
                        dbInstance = null
                        dbPromise = null
                        isConnected.value = false
                    }

                    // Handle unexpected close
                    db.onclose = () => {
                        log('Database connection closed')
                        isConnected.value = false
                    }

                    dbInstance = {db}
                    isConnected.value = true
                    isLoading.value = false
                    resolve(db)
                }

                request.onupgradeneeded = (ev: Event) => {
                    if (ev.target !== null && ev.target instanceof IDBRequest) {
                        const db: IDBDatabase = ev.target.result
                        _setupDatabase(db)
                    }
                }
            })
        }

        return dbPromise
    }

    // Generic transaction helper
    const performTransaction = async <T>(storeName: string, mode: 'readonly' | 'readwrite', operations: CallableFunction): Promise<T> => {
        try {
            const db = await getDB()
            const transaction = db.transaction(storeName, mode)

            // Set up error handling
            transaction.onerror = () => {
                error.value = transaction.error
                throw transaction.error
            }

            return await operations(transaction)
        } catch (err: unknown) {
            error.value = err
            throw err
        }
    }

    // CRUD operations
    const add = async <T>(storeName: string, data: T): Promise<number> => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.add(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const get = async <T>(storeName: string, key: number): Promise<T> => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.get(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const getAll = async <T>(storeName: string): Promise<T[]> => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T[]> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.getAll()

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const update = async <T>(storeName: string, data: T): Promise<T> => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction): Promise<IDBValidKey> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.put(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const remove = async <T>(storeName: string, key: number): Promise<T> => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.delete(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const batchOperations = async <T>(storeName: string, operations: Array<{
        type: string,
        data: unknown,
        key: number
    }>): Promise<T> => {
        return performTransaction(storeName, 'readwrite', async (transaction: IDBTransaction): Promise<unknown[]> => {
            const store = transaction.objectStore(storeName)
            const results = []

            for (const operation of operations) {
                const {type, data, key} = operation

                const promise = new Promise((resolve, reject) => {
                    let request

                    switch (type) {
                        case 'add':
                            request = store.add(data)
                            break
                        case 'put':
                            request = store.put(data)
                            break
                        case 'delete':
                            request = store.delete(key)
                            break
                        default:
                            reject(new Error(`Unknown operation type: ${type}`))
                            return
                    }

                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })

                results.push(await promise)
            }

            return results
        })
    }

    // Query by index
    const getByIndex = async <T>(storeName: string, indexName: string, value: number): Promise<T> => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const index = store.index(indexName)
                const request = index.get(value)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    // Clear store
    const clear = async (storeName: string): Promise<string> => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.clear()

                request.onsuccess = () => resolve(`Store: ${storeName} cleared`)
                request.onerror = () => reject(request.error)
            })
        })
    }

    return {
        // State
        isConnected,
        error,
        isLoading,

        // Methods
        getDB,
        performTransaction,

        // CRUD operations
        add,
        get,
        getAll,
        update,
        remove,
        clear,

        // Advanced operations
        batchOperations,
        getByIndex
    }
}

export function useAccountsDB() {
    const db = useIndexedDB()

    const addAccount = async (accountData: unknown) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData)
        } catch (err) {
            log('Failed to add account:', {error: err})
            throw err
        }
    }

    const getAllAccounts = async (): Promise<IAccountDB[]> => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        } catch (err) {
            log('Failed to get all accounts:', {error: err})
            throw err
        }
    }

    const updateAccount = async (accountData: unknown) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData)
        } catch (err) {
            log('Failed to update account:', {error: err})
            throw err
        }
    }

    const deleteAccount = async (accountId: number) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountId)
        } catch (err) {
            log('Failed to delete account:', {error: err})
            throw err
        }
    }

    const clearAllAccounts = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        } catch (err) {
            log('Failed to delete account:', {error: err})
            throw err
        }
    }

    return {
        // Expose database state
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        addAccount,
        updateAccount,
        deleteAccount,
        getAllAccounts,
        clearAllAccounts
    }
}

export function useBookingsDB() {
    const db = useIndexedDB()

    const addBooking = async (bookingData: unknown) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingData)
        } catch (err) {
            log('Failed to add booking:', {error: err})
            throw err
        }
    }

    const getAllBookings = async (): Promise<IBookingDB[]> => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        } catch (err) {
            log('Failed to get all bookings:', {error: err})
            throw err
        }
    }

    const updateBooking = async (bookingData: unknown) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, bookingData)
        } catch (err) {
            log('Failed to update booking:', {error: err})
            throw err
        }
    }

    const deleteBooking = async (bookingId: number) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingId)
        } catch (err) {
            log('Failed to delete booking:', {error: err})
            throw err
        }
    }

    const clearAllBookings = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        } catch (err) {
            log('Failed to delete booking:', {error: err})
            throw err
        }
    }

    return {
        // Expose database state
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        addBooking,
        updateBooking,
        deleteBooking,
        getAllBookings,
        clearAllBookings
    }
}

export function useBookingTypesDB() {
    const db = useIndexedDB()

    const addBookingType = async (bookingTypeData: unknown) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData)
        } catch (err) {
            log('Failed to add bookingType:', {error: err})
            throw err
        }
    }

    const getAllBookingTypes = async (): Promise<IBookingTypeDB[]> => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        } catch (err) {
            log('Failed to get all bookingTypes:', {error: err})
            throw err
        }
    }

    const updateBookingType = async (bookingTypeData: unknown) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData)
        } catch (err) {
            log('Failed to update bookingType:', {error: err})
            throw err
        }
    }

    const deleteBookingType = async (bookingTypeId: number) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeId)
        } catch (err) {
            log('Failed to delete bookingType:', {error: err})
            throw err
        }
    }

    const clearAllBookingTypes = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        } catch (err) {
            log('Failed to delete bookingType:', {error: err})
            throw err
        }
    }

    return {
        // Expose database state
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        addBookingType,
        updateBookingType,
        deleteBookingType,
        getAllBookingTypes,
        clearAllBookingTypes
    }
}

export function useStocksDB() {
    const db = useIndexedDB()

    const addStock = async (stockData: unknown) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData)
        } catch (err) {
            log('Failed to add stock:', {error: err})
            throw err
        }
    }

    const getAllStocks = async (): Promise<IStockDB[]> => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.STOCKS.NAME)
        } catch (err) {
            log('Failed to get all stocks:', {error: err})
            throw err
        }
    }

    const updateStock = async (stockData: unknown) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData)
        } catch (err) {
            log('Failed to update stock:', {error: err})
            throw err
        }
    }

    const deleteStock = async (stockId: number) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockId)
        } catch (err) {
            log('Failed to delete stock:', {error: err})
            throw err
        }
    }

    const clearAllStocks = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.STOCKS.NAME)
        } catch (err) {
            log('Failed to delete stock:', {error: err})
            throw err
        }
    }

    return {
        // Expose database state
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        addStock,
        updateStock,
        deleteStock,
        getAllStocks,
        clearAllStocks
    }
}
