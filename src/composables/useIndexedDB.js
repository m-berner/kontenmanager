import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
let dbInstance = null;
let dbPromise = null;
const { CONS, log } = useApp();
export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    const isConnected = ref(false);
    const error = ref(null);
    const isLoading = ref(false);
    const _setupDatabase = (db) => {
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME)) {
            const accountStore = db.createObjectStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, {
                keyPath: CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.ID,
                autoIncrement: true
            });
            accountStore.createIndex(`${CONS.INDEXED_DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS.NUMBER, { unique: true });
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.BOOKINGS.NAME)) {
            const bookingStore = db.createObjectStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, {
                keyPath: CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.ID,
                autoIncrement: true
            });
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k1`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.DATE, { unique: false });
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k2`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, { unique: false });
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k3`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
            bookingStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKINGS.NAME}_k4`, CONS.INDEXED_DB.STORES.BOOKINGS.FIELDS.STOCK_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME)) {
            const bookingTypeStore = db.createObjectStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, {
                keyPath: CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ID,
                autoIncrement: true
            });
            bookingTypeStore.createIndex(`${CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(CONS.INDEXED_DB.STORES.STOCKS.NAME)) {
            const stockStore = db.createObjectStore(CONS.INDEXED_DB.STORES.STOCKS.NAME, {
                keyPath: CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ID,
                autoIncrement: true
            });
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_uk1`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ISIN, { unique: true });
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_uk2`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.SYMBOL, { unique: true });
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k1`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.FADE_OUT, { unique: false });
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k2`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.FIRST_PAGE, { unique: false });
            stockStore.createIndex(`${CONS.INDEXED_DB.STORES.STOCKS.NAME}_k3`, CONS.INDEXED_DB.STORES.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
    };
    const getDB = async () => {
        if (dbInstance && !dbInstance.db) {
            dbInstance = null;
            dbPromise = null;
        }
        if (!dbPromise) {
            isLoading.value = true;
            error.value = null;
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, version);
                request.onerror = () => {
                    error.value = request.error;
                    isLoading.value = false;
                    reject(request.error);
                };
                request.onsuccess = () => {
                    const db = request.result;
                    db.onversionchange = () => {
                        log('Database version changed, closing connection');
                        db.close();
                        dbInstance = null;
                        dbPromise = null;
                        isConnected.value = false;
                    };
                    db.onclose = () => {
                        log('Database connection closed');
                        isConnected.value = false;
                    };
                    dbInstance = { db };
                    isConnected.value = true;
                    isLoading.value = false;
                    resolve(db);
                };
                request.onupgradeneeded = (ev) => {
                    if (ev.target !== null && ev.target instanceof IDBRequest) {
                        const db = ev.target.result;
                        _setupDatabase(db);
                    }
                };
            });
        }
        return dbPromise;
    };
    const performTransaction = async (storeName, mode, operations) => {
        try {
            const db = await getDB();
            const transaction = db.transaction(storeName, mode);
            transaction.onerror = () => {
                error.value = transaction.error;
                throw transaction.error;
            };
            return await operations(transaction);
        }
        catch (err) {
            error.value = err;
            throw err;
        }
    };
    const add = async (storeName, data) => {
        return performTransaction(storeName, 'readwrite', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.add(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const get = async (storeName, key) => {
        return performTransaction(storeName, 'readonly', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const getAll = async (storeName) => {
        return performTransaction(storeName, 'readonly', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const update = async (storeName, data) => {
        return performTransaction(storeName, 'readwrite', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const remove = async (storeName, key) => {
        return performTransaction(storeName, 'readwrite', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const batchOperations = async (storeName, operations) => {
        return performTransaction(storeName, 'readwrite', async (transaction) => {
            const store = transaction.objectStore(storeName);
            const results = [];
            for (const operation of operations) {
                const { type, data, key } = operation;
                const promise = new Promise((resolve, reject) => {
                    let request;
                    switch (type) {
                        case 'add':
                            request = store.add(data);
                            break;
                        case 'put':
                            request = store.put(data);
                            break;
                        case 'delete':
                            request = store.delete(key);
                            break;
                        default:
                            reject(new Error(`Unknown operation type: ${type}`));
                            return;
                    }
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                results.push(await promise);
            }
            return results;
        });
    };
    const getByIndex = async (storeName, indexName, value) => {
        return performTransaction(storeName, 'readonly', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.get(value);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    };
    const clear = async (storeName) => {
        return performTransaction(storeName, 'readwrite', (transaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve(`Store: ${storeName} cleared`);
                request.onerror = () => reject(request.error);
            });
        });
    };
    return {
        isConnected,
        error,
        isLoading,
        getDB,
        performTransaction,
        add,
        get,
        getAll,
        update,
        remove,
        clear,
        batchOperations,
        getByIndex
    };
}
export function useAccountsDB() {
    const db = useIndexedDB();
    const addAccount = async (accountData) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData);
        }
        catch (err) {
            log('Failed to add account:', { error: err });
            throw err;
        }
    };
    const getAllAccounts = async () => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
        }
        catch (err) {
            log('Failed to get all accounts:', { error: err });
            throw err;
        }
    };
    const updateAccount = async (accountData) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountData);
        }
        catch (err) {
            log('Failed to update account:', { error: err });
            throw err;
        }
    };
    const deleteAccount = async (accountId) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountId);
        }
        catch (err) {
            log('Failed to delete account:', { error: err });
            throw err;
        }
    };
    const clearAllAccounts = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
        }
        catch (err) {
            log('Failed to delete account:', { error: err });
            throw err;
        }
    };
    const importAccounts = async (accountsBatch) => {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountsBatch);
        }
        catch (err) {
            log('Failed to import account:', { error: err });
            throw err;
        }
    };
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        addAccount,
        updateAccount,
        deleteAccount,
        getAllAccounts,
        clearAllAccounts,
        importAccounts
    };
}
export function useBookingsDB() {
    const db = useIndexedDB();
    const addBooking = async (bookingData) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingData);
        }
        catch (err) {
            log('Failed to add booking:', { error: err });
            throw err;
        }
    };
    const getAllBookings = async () => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        }
        catch (err) {
            log('Failed to get all bookings:', { error: err });
            throw err;
        }
    };
    const updateBooking = async (bookingData) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, bookingData);
        }
        catch (err) {
            log('Failed to update booking:', { error: err });
            throw err;
        }
    };
    const deleteBooking = async (bookingId) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingId);
        }
        catch (err) {
            log('Failed to delete booking:', { error: err });
            throw err;
        }
    };
    const clearAllBookings = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        }
        catch (err) {
            log('Failed to delete booking:', { error: err });
            throw err;
        }
    };
    const importBookings = async (bookingsBatch) => {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, bookingsBatch);
        }
        catch (err) {
            log('Failed to import account:', { error: err });
            throw err;
        }
    };
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        addBooking,
        updateBooking,
        deleteBooking,
        getAllBookings,
        clearAllBookings,
        importBookings
    };
}
export function useBookingTypesDB() {
    const db = useIndexedDB();
    const addBookingType = async (bookingTypeData) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData);
        }
        catch (err) {
            log('Failed to add bookingType:', { error: err });
            throw err;
        }
    };
    const getAllBookingTypes = async () => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        }
        catch (err) {
            log('Failed to get all bookingTypes:', { error: err });
            throw err;
        }
    };
    const updateBookingType = async (bookingTypeData) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeData);
        }
        catch (err) {
            log('Failed to update bookingType:', { error: err });
            throw err;
        }
    };
    const deleteBookingType = async (bookingTypeId) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypeId);
        }
        catch (err) {
            log('Failed to delete bookingType:', { error: err });
            throw err;
        }
    };
    const clearAllBookingTypes = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        }
        catch (err) {
            log('Failed to delete bookingType:', { error: err });
            throw err;
        }
    };
    const importBookingTypes = async (bookingTypesBatch) => {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, bookingTypesBatch);
        }
        catch (err) {
            log('Failed to import account:', { error: err });
            throw err;
        }
    };
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        addBookingType,
        updateBookingType,
        deleteBookingType,
        getAllBookingTypes,
        clearAllBookingTypes,
        importBookingTypes
    };
}
export function useStocksDB() {
    const db = useIndexedDB();
    const addStock = async (stockData) => {
        try {
            return await db.add(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData);
        }
        catch (err) {
            log('Failed to add stock:', { error: err });
            throw err;
        }
    };
    const getAllStocks = async () => {
        try {
            return await db.getAll(CONS.INDEXED_DB.STORES.STOCKS.NAME);
        }
        catch (err) {
            log('Failed to get all stocks:', { error: err });
            throw err;
        }
    };
    const updateStock = async (stockData) => {
        try {
            return await db.update(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockData);
        }
        catch (err) {
            log('Failed to update stock:', { error: err });
            throw err;
        }
    };
    const deleteStock = async (stockId) => {
        try {
            return await db.remove(CONS.INDEXED_DB.STORES.STOCKS.NAME, stockId);
        }
        catch (err) {
            log('Failed to delete stock:', { error: err });
            throw err;
        }
    };
    const clearAllStocks = async () => {
        try {
            return await db.clear(CONS.INDEXED_DB.STORES.STOCKS.NAME);
        }
        catch (err) {
            log('Failed to delete stock:', { error: err });
            throw err;
        }
    };
    const importStocks = async (stocksBatch) => {
        try {
            return await db.batchOperations(CONS.INDEXED_DB.STORES.STOCKS.NAME, stocksBatch);
        }
        catch (err) {
            log('Failed to import account:', { error: err });
            throw err;
        }
    };
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        addStock,
        updateStock,
        deleteStock,
        getAllStocks,
        clearAllStocks,
        importStocks
    };
}
