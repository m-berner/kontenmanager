/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {IAccountDB, IBooking_DB, IBookingTypeDB, IRecordsDB, IStock, IStockDB, IStoresDB} from '@/types.d'
import {ref} from 'vue'
import {useApp} from '@/composables/useApp'
import {useSettings} from '@/composables/useSettings'

// Global database instance (shared across components)
let dbInstance: { db: IDBDatabase } | null = null
let dbPromise: Promise<IDBDatabase> | null = null
const {CONS, log} = useApp()
const {activeAccountId} = useSettings()

export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    const isConnected = ref<boolean>(false)
    const error = ref<unknown | null>(null)
    const isLoading = ref<boolean>(false)

    // Database schema setup
    function _setupDatabase(db: IDBDatabase): void {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)) {
            const accountStore = db.createObjectStore(
                CONS.INDEXED_DB.STORES.ACCOUNTS.NAME,
                {
                    keyPath: CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.ID,
                    autoIncrement: true
                }
            )
            accountStore.createIndex(`${CONS.INDEXED_DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.IBAN, {unique: true})
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

    // Generic transaction helper
    async function _performTransaction<T>(storeName: string, mode: 'readonly' | 'readwrite', operations: CallableFunction): Promise<T> {
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

    async function batchOperations<T>(storeName: string, operations: Array<{
        type: string,
        data: unknown,
        key: number
    }>): Promise<T> {
        return _performTransaction(storeName, 'readwrite', async (transaction: IDBTransaction): Promise<unknown[]> => {
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

    // Get database connection (singleton pattern)
    async function getDB(): Promise<IDBDatabase> {
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

    // CRUD operations
    async function add<T>(storeName: string, data: T): Promise<number> {
        return _performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.add(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    async function get<T>(storeName: string, key: number): Promise<T> {
        return _performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.get(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    async function getAll<T>(storeName: string): Promise<T[]> {
        return _performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T[]> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.getAll()

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    async function update<T>(storeName: string, data: T): Promise<T> {
        return _performTransaction(storeName, 'readwrite', (transaction: IDBTransaction): Promise<IDBValidKey> => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.put(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    async function remove<T>(storeName: string, key: number): Promise<T> {
        return _performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.delete(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    // Query by index
    async function getByIndex<T>(storeName: string, indexName: string, value: number): Promise<T> {
        return _performTransaction(storeName, 'readonly', (transaction: IDBTransaction): Promise<T> => {
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
    async function clear(storeName: string): Promise<string> {
        return _performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.clear()

                request.onsuccess = () => resolve(`Store: ${storeName} cleared`)
                request.onerror = () => reject(request.error)
            })
        })
    }

    async function deleteDatabaseWithAccount(accountId: number): Promise<void> {
        log('INDEXED_DB: deleteDatabaseWithAccount')
        const {deleteAccount} = useAccountsDB()
        const {deleteBooking, getAllBookings} = useBookingsDB()
        const {deleteBookingType, getAllBookingTypes} = useBookingTypesDB()
        const {deleteStock, getAllStocks} = useStocksDB()
        const bookings = (await getAllBookings()).filter(item => item.cAccountNumberID === accountId)
        for (const rec of bookings) {
            await deleteBooking(rec.cID)
        }
        const bookingTypes = (await getAllBookingTypes()).filter(item => item.cAccountNumberID === accountId)
        for (const rec of bookingTypes) {
            await deleteBookingType(rec.cID)
        }
        const stocks = (await getAllStocks()).filter(item => item.cAccountNumberID === accountId)
        for (const rec of stocks) {
            await deleteStock(rec.cID)
        }
        await deleteAccount(accountId)
    }

    async function getDatabaseStores(): Promise<IStoresDB> {
        log('INDEXED_DB: getDatabaseStores')
        const {getAllAccounts} = useAccountsDB()
        const {getAllBookings} = useBookingsDB()
        const {getAllBookingTypes} = useBookingTypesDB()
        const {getAllStocks} = useStocksDB()

        const accountsDB: IAccountDB[] = await getAllAccounts()
        const bookingsDB: IBooking_DB[] = (await getAllBookings()).filter((booking: IBooking_DB) => booking.cAccountNumberID === activeAccountId.value)
        const bookingTypesDB: IBookingTypeDB[] = (await getAllBookingTypes()).filter((bookingType: IBookingTypeDB) => bookingType.cAccountNumberID === activeAccountId.value)
        const stocksDB: IStockDB[] = (await getAllStocks()).filter((stock: IStockDB) => stock.cAccountNumberID === activeAccountId.value)

        return {
            accountsDB,
            bookingsDB,
            bookingTypesDB,
            stocksDB
        }
    }

    return {
        // State
        isConnected,
        error,
        isLoading,

        // Methods
        getDB,

        // CRUD operations
        add,
        get,
        getAll,
        update,
        remove,
        clear,

        // Advanced operations
        getByIndex,
        batchOperations,
        deleteDatabaseWithAccount,
        getDatabaseStores
    }
}

export function useAccountsDB() {
    const db = useIndexedDB()

    async function addAccount(accountData: unknown) {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData)
        } catch (err) {
            log('Failed to add account:', {error: err})
            throw err
        }
    }

    async function getAllAccounts(): Promise<IAccountDB[]> {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        } catch (err) {
            log('Failed to get all accounts:', {error: err})
            throw err
        }
    }

    async function updateAccount(accountData: unknown) {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData)
        } catch (err) {
            log('Failed to update account:', {error: err})
            throw err
        }
    }

    async function deleteAccount(accountId: number) {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountId)
        } catch (err) {
            log('Failed to delete account:', {error: err})
            throw err
        }
    }

    async function clearAllAccounts() {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)
        } catch (err) {
            log('Failed to delete account:', {error: err})
            throw err
        }
    }

    async function importAccounts(accountsBatch: IRecordsDB[]) {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountsBatch)
        } catch (err) {
            log('Failed to import account:', {error: err})
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
        clearAllAccounts,
        importAccounts
    }
}
// TODO addBooking calculations
export function useBookingsDB() {
    const db = useIndexedDB()

    async function addBooking(bookingData: unknown) {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingData)
        } catch (err) {
            log('Failed to add booking:', {error: err})
            throw err
        }
    }

    async function getAllBookings(): Promise<IBooking_DB[]> {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        } catch (err) {
            log('Failed to get all bookings:', {error: err})
            throw err
        }
    }

    async function updateBooking(bookingData: unknown) {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingData)
        } catch (err) {
            log('Failed to update booking:', {error: err})
            throw err
        }
    }

    async function deleteBooking(bookingId: number) {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingId)
        } catch (err) {
            log('Failed to delete booking:', {error: err})
            throw err
        }
    }

    async function clearAllBookings() {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)
        } catch (err) {
            log('Failed to delete booking:', {error: err})
            throw err
        }
    }

    async function importBookings(bookingsBatch: IRecordsDB[]) {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingsBatch)
        } catch (err) {
            log('Failed to import account:', {error: err})
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
        clearAllBookings,
        importBookings
    }
}

export function useBookingTypesDB() {
    const db = useIndexedDB()

    async function addBookingType(bookingTypeData: unknown) {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData)
        } catch (err) {
            log('Failed to add bookingType:', {error: err})
            throw err
        }
    }

    async function getAllBookingTypes(): Promise<IBookingTypeDB[]> {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        } catch (err) {
            log('Failed to get all bookingTypes:', {error: err})
            throw err
        }
    }

    async function updateBookingType(bookingTypeData: unknown) {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData)
        } catch (err) {
            log('Failed to update bookingType:', {error: err})
            throw err
        }
    }

    async function deleteBookingType(bookingTypeId: number) {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeId)
        } catch (err) {
            log('Failed to delete bookingType:', {error: err})
            throw err
        }
    }

    async function clearAllBookingTypes() {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)
        } catch (err) {
            log('Failed to delete bookingType:', {error: err})
            throw err
        }
    }

    async function importBookingTypes(bookingTypesBatch: IRecordsDB[]) {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypesBatch)
        } catch (err) {
            log('Failed to import account:', {error: err})
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
        clearAllBookingTypes,
        importBookingTypes
    }
}

export function useStocksDB() {
    const db = useIndexedDB()

    async function addStock(stockData: unknown) {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData)
        } catch (err) {
            log('Failed to add stock:', {error: err})
            throw err
        }
    }

    async function getAllStocks(): Promise<IStockDB[]> {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.STOCKS.NAME)
        } catch (err) {
            log('Failed to get all stocks:', {error: err})
            throw err
        }
    }

    async function updateStock(stockData: IStock) {
        try {
            delete stockData.mPortfolio
            delete stockData.mInvest
            delete stockData.mChange
            delete stockData.mBuyValue
            delete stockData.mEuroChange
            delete stockData.mMin
            delete stockData.mValue
            delete stockData.mMax
            delete stockData.mDividendYielda
            delete stockData.mDividendYeara
            delete stockData.mDividendYieldb
            delete stockData.mDividendYearb
            delete stockData.mRealDividend
            delete stockData.mRealBuyValue
            delete stockData.mDeleteable
            return await db.update(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData)
        } catch (err) {
            log('Failed to update stock:', {error: err})
            throw err
        }
    }

    async function deleteStock(stockId: number) {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockId)
        } catch (err) {
            log('Failed to delete stock:', {error: err})
            throw err
        }
    }

    async function clearAllStocks() {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.STOCKS.NAME)
        } catch (err) {
            log('Failed to delete stock:', {error: err})
            throw err
        }
    }

    async function importStocks(stocksBatch: IRecordsDB[]) {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.STOCKS.NAME, stocksBatch)
        } catch (err) {
            log('Failed to import account:', {error: err})
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
        clearAllStocks,
        importStocks
    }
}
