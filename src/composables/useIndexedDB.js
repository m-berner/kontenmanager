import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
import { useSettings } from '@/composables/useSettings';
const { CONS, log } = useApp();
const { activeAccountId } = useSettings();
let dbPromise = null;
export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    const isConnected = ref(false);
    const error = ref(null);
    const isLoading = ref(false);
    function setupDatabase(db) {
        const stores = CONS.INDEXED_DB.STORES;
        if (!db.objectStoreNames.contains(stores.ACCOUNTS.NAME)) {
            const store = db.createObjectStore(stores.ACCOUNTS.NAME, {
                keyPath: stores.ACCOUNTS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${stores.ACCOUNTS.NAME}_uk1`, stores.ACCOUNTS.FIELDS.IBAN, { unique: true });
        }
        if (!db.objectStoreNames.contains(stores.BOOKINGS.NAME)) {
            const store = db.createObjectStore(stores.BOOKINGS.NAME, {
                keyPath: stores.BOOKINGS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${stores.BOOKINGS.NAME}_k1`, stores.BOOKINGS.FIELDS.DATE, { unique: false });
            store.createIndex(`${stores.BOOKINGS.NAME}_k2`, stores.BOOKINGS.FIELDS.BOOKING_TYPE_ID, { unique: false });
            store.createIndex(`${stores.BOOKINGS.NAME}_k3`, stores.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
            store.createIndex(`${stores.BOOKINGS.NAME}_k4`, stores.BOOKINGS.FIELDS.STOCK_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(stores.BOOKING_TYPES.NAME)) {
            const store = db.createObjectStore(stores.BOOKING_TYPES.NAME, {
                keyPath: stores.BOOKING_TYPES.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${stores.BOOKING_TYPES.NAME}_k1`, stores.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
        if (!db.objectStoreNames.contains(stores.STOCKS.NAME)) {
            const store = db.createObjectStore(stores.STOCKS.NAME, {
                keyPath: stores.STOCKS.FIELDS.ID,
                autoIncrement: true
            });
            store.createIndex(`${stores.STOCKS.NAME}_uk1`, stores.STOCKS.FIELDS.ISIN, { unique: true });
            store.createIndex(`${stores.STOCKS.NAME}_uk2`, stores.STOCKS.FIELDS.SYMBOL, { unique: true });
            store.createIndex(`${stores.STOCKS.NAME}_k1`, stores.STOCKS.FIELDS.FADE_OUT, { unique: false });
            store.createIndex(`${stores.STOCKS.NAME}_k2`, stores.STOCKS.FIELDS.FIRST_PAGE, { unique: false });
            store.createIndex(`${stores.STOCKS.NAME}_k3`, stores.STOCKS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
        }
    }
    async function getDB() {
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
                        dbPromise = null;
                        isConnected.value = false;
                    };
                    db.onclose = () => {
                        log('Database connection closed');
                        isConnected.value = false;
                        dbPromise = null;
                    };
                    isConnected.value = true;
                    isLoading.value = false;
                    resolve(db);
                };
                request.onupgradeneeded = (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        setupDatabase(ev.target.result);
                    }
                };
            });
        }
        return dbPromise;
    }
    async function add(storeName, data) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function get(storeName, key) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function getAll(storeName) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function update(storeName, data) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function remove(storeName, key) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async function clear(storeName) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async function batchOperations(storeName, operations) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const promises = operations.map(op => {
            let request;
            return new Promise((resolve, reject) => {
                switch (op.type) {
                    case 'add':
                        request = store.add(op.data);
                        break;
                    case 'put':
                        request = store.put(op.data);
                        break;
                    case 'delete':
                        request = store.delete(op.key);
                        break;
                }
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
        return Promise.all(promises);
    }
    async function getByIndex(storeName, indexName, value) {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.get(value);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function deleteDatabaseWithAccount(accountId) {
        log('INDEXED_DB: deleteDatabaseWithAccount');
        const bookings = (await getAll(CONS.INDEXED_DB.STORES.BOOKINGS.NAME))
            .filter(item => item.cAccountNumberID === accountId);
        const bookingTypes = (await getAll(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME))
            .filter(item => item.cAccountNumberID === accountId);
        const stocks = (await getAll(CONS.INDEXED_DB.STORES.STOCKS.NAME))
            .filter(item => item.cAccountNumberID === accountId);
        for (const rec of bookings)
            await remove(CONS.INDEXED_DB.STORES.BOOKINGS.NAME, rec.cID);
        for (const rec of bookingTypes)
            await remove(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME, rec.cID);
        for (const rec of stocks)
            await remove(CONS.INDEXED_DB.STORES.STOCKS.NAME, rec.cID);
        await remove(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME, accountId);
    }
    async function getDatabaseStores() {
        log('INDEXED_DB: getDatabaseStores');
        const accountsDB = await getAll(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
        const allBookings = await getAll(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        const allBookingTypes = await getAll(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        const allStocks = await getAll(CONS.INDEXED_DB.STORES.STOCKS.NAME);
        return {
            accountsDB,
            bookingsDB: allBookings.filter(b => b.cAccountNumberID === activeAccountId.value),
            bookingTypesDB: allBookingTypes.filter(bt => bt.cAccountNumberID === activeAccountId.value),
            stocksDB: allStocks.filter(s => s.cAccountNumberID === activeAccountId.value)
        };
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
    };
}
export function useStore(storeName) {
    const db = useIndexedDB();
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        add: (data) => db.add(storeName, data),
        getAll: () => db.getAll(storeName),
        update: (data) => db.update(storeName, data),
        remove: (id) => db.remove(storeName, id),
        clear: () => db.clear(storeName),
        batchImport: (batch) => db.batchOperations(storeName, batch)
    };
}
export const useAccountsDB = () => useStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
export const useBookingsDB = () => useStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
export const useBookingTypesDB = () => useStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
export function useStocksDB() {
    const store = useStore(CONS.INDEXED_DB.STORES.STOCKS.NAME);
    return {
        ...store,
        update: (stockData) => {
            const { mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin, mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb, mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData } = stockData;
            return store.update(cleanData);
        }
    };
}
