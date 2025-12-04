import { ref } from 'vue';
import { useApp } from '@/composables/useApp';
const { CONS, log } = useApp();
const dbInstance = ref(null);
const isConnected = ref(false);
const error = ref(null);
const isLoading = ref(false);
function useDBStore(storeName) {
    const dbi = useIndexedDB();
    return {
        isConnected: dbi.isConnected,
        error: dbi.error,
        isLoading: dbi.isLoading,
        add: (data) => dbi.add(storeName, data),
        getAll: () => dbi.getAll(storeName),
        update: (data) => dbi.update(storeName, data),
        remove: (id) => dbi.remove(storeName, id),
        clear: () => dbi.clear(storeName),
        batchImport: (batch) => dbi.batchOperations(storeName, batch)
    };
}
export function useIndexedDB(dbName = CONS.INDEXED_DB.NAME, version = CONS.INDEXED_DB.CURRENT_VERSION) {
    function _setupDatabase(db) {
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
    async function closeDB() {
        if (dbInstance.value) {
            const db = await dbInstance.value;
            db.close();
            console.error(db);
            dbInstance.value = null;
            isConnected.value = false;
            log('USE_INDEXED_DB: closeDB');
        }
    }
    async function _openDB() {
        if (!dbInstance.value) {
            isLoading.value = true;
            error.value = null;
            dbInstance.value = new Promise((resolve, reject) => {
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
                        dbInstance.value = null;
                        isConnected.value = false;
                    };
                    db.onclose = () => {
                        log('Database connection closed');
                        isConnected.value = false;
                        dbInstance.value = null;
                    };
                    isConnected.value = true;
                    isLoading.value = false;
                    resolve(db);
                };
                request.onupgradeneeded = (ev) => {
                    if (ev.target instanceof IDBRequest) {
                        _setupDatabase(ev.target.result);
                    }
                };
            });
        }
        log('USE_INDEXED_DB: _openDB', { info: dbInstance.value });
        return dbInstance.value;
    }
    async function add(storeName, data) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function get(storeName, key) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function getAll(storeName) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function update(storeName, data) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function remove(storeName, key) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function clear(storeName) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function batchOperations(storeName, operations) {
        const db = await _openDB();
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
                        if (!op.key) {
                            reject(new Error('Delete operation requires a key'));
                            return;
                        }
                        request = store.delete(op.key);
                        break;
                    default:
                        reject(new Error(`Unknown operation type: ${op.type}`));
                        return;
                }
                tx.oncomplete = () => resolve(request.result);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(new Error('Transaction aborted'));
            });
        });
        return Promise.all(promises);
    }
    async function _getAllByIndex(storeName, indexName, value) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function _getAllInTransaction(tx, storeName) {
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function deleteDatabaseWithAccount(accountId) {
        log('INDEXED_DB: deleteDatabaseWithAccount');
        const db = await _openDB();
        const tx = db.transaction([
            CONS.INDEXED_DB.STORES.BOOKINGS.NAME,
            CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME,
            CONS.INDEXED_DB.STORES.STOCKS.NAME,
            CONS.INDEXED_DB.STORES.ACCOUNTS.NAME
        ], 'readwrite');
        const bookings = await _getAllInTransaction(tx, CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        const bookingTypes = await _getAllInTransaction(tx, CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        const stocks = await _getAllInTransaction(tx, CONS.INDEXED_DB.STORES.STOCKS.NAME);
        const bookingsStore = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        const bookingTypesStore = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        const stocksStore = tx.objectStore(CONS.INDEXED_DB.STORES.STOCKS.NAME);
        const accountsStore = tx.objectStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
        bookings.filter((b) => b.cAccountNumberID === accountId).forEach((b) => bookingsStore.delete(b.cID));
        bookingTypes.filter((bt) => bt.cAccountNumberID === accountId).forEach((bt) => bookingTypesStore.delete(bt.cID));
        stocks.filter((s) => s.cAccountNumberID === accountId).forEach((s) => stocksStore.delete(s.cID));
        const request = accountsStore.delete(accountId);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function getDatabaseStores(accountId) {
        log('USE_INDEXED_DB: getDatabaseStores');
        const db = await _openDB();
        const tx = db.transaction([
            CONS.INDEXED_DB.STORES.BOOKINGS.NAME,
            CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME,
            CONS.INDEXED_DB.STORES.STOCKS.NAME,
            CONS.INDEXED_DB.STORES.ACCOUNTS.NAME
        ], 'readonly');
        const accountsStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
        const bookingsStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
        const bookingTypesStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
        const stocksStoreDB = tx.objectStore(CONS.INDEXED_DB.STORES.STOCKS.NAME);
        const requestAccounts = accountsStoreDB.getAll();
        const requestBookings = bookingsStoreDB.getAll();
        const requestBookingTypes = bookingTypesStoreDB.getAll();
        const requestStocks = stocksStoreDB.getAll();
        const results = {
            accountsDB: [],
            bookingsDB: [],
            bookingTypesDB: [],
            stocksDB: []
        };
        requestAccounts.onsuccess = () => {
            results.accountsDB = [...requestAccounts.result];
        };
        requestBookings.onsuccess = () => {
            results.bookingsDB = [...requestBookings.result.filter(b => b.cAccountNumberID === accountId)];
        };
        requestBookingTypes.onsuccess = () => {
            results.bookingTypesDB = [...requestBookingTypes.result.filter(bt => bt.cAccountNumberID === accountId)];
        };
        requestStocks.onsuccess = () => {
            results.stocksDB = [...requestStocks.result.filter(s => s.cAccountNumberID === accountId)];
        };
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                resolve({
                    accountsDB: results.accountsDB,
                    bookingsDB: results.bookingsDB,
                    bookingTypesDB: results.bookingTypesDB,
                    stocksDB: results.stocksDB
                });
            };
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function countByIndex(storeName, indexName, value) {
        const db = await _openDB();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.count(value);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error('Transaction aborted'));
        });
    }
    async function _processWithCursor(storeName, callback, indexName, range) {
        const db = await _openDB();
        if (db !== null) {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = source.openCursor(range);
            return new Promise((resolve, reject) => {
                request.onsuccess = async (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        await callback(cursor.value);
                        cursor.continue();
                    }
                    else {
                        resolve();
                    }
                };
                tx.onerror = () => reject(request.error);
                tx.onabort = () => reject(new Error('Transaction aborted'));
            });
        }
        return null;
    }
    return {
        isConnected,
        error,
        isLoading,
        _openDB,
        closeDB,
        countByIndex,
        add,
        get,
        getAll,
        update,
        remove,
        clear,
        batchOperations,
        _getAllByIndex,
        deleteDatabaseWithAccount,
        getDatabaseStores,
        _processWithCursor
    };
}
export function useAccountsDB() {
    return useDBStore(CONS.INDEXED_DB.STORES.ACCOUNTS.NAME);
}
export function useBookingsDB() {
    return useDBStore(CONS.INDEXED_DB.STORES.BOOKINGS.NAME);
}
export function useBookingTypesDB() {
    return useDBStore(CONS.INDEXED_DB.STORES.BOOKING_TYPES.NAME);
}
export function useStocksDB() {
    const store = useDBStore(CONS.INDEXED_DB.STORES.STOCKS.NAME);
    return {
        ...store,
        update: (stockData) => {
            const { mPortfolio, mInvest, mChange, mBuyValue, mEuroChange, mMin, mValue, mMax, mDividendYielda, mDividendYeara, mDividendYieldb, mDividendYearb, mRealDividend, mRealBuyValue, mDeleteable, ...cleanData } = stockData;
            return store.update(cleanData);
        }
    };
}
