import { onUnmounted, ref } from 'vue';
let dbInstance = null;
let dbPromise = null;
export function useIndexedDB(dbName = 'myApp', version = 1) {
    const isConnected = ref(false);
    const error = ref(null);
    const isLoading = ref(false);
    const setupDatabase = (db) => {
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
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
                        console.log('Database version changed, closing connection');
                        db.close();
                        dbInstance = null;
                        dbPromise = null;
                        isConnected.value = false;
                    };
                    db.onclose = () => {
                        console.log('Database connection closed');
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
                        setupDatabase(db);
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
                request.onsuccess = () => resolve('');
                request.onerror = () => reject(request.error);
            });
        });
    };
    onUnmounted(() => {
    });
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
export function useUserStore() {
    const db = useIndexedDB('userApp', 1);
    const addUser = async (userData) => {
        try {
            return await db.add('users', userData);
        }
        catch (err) {
            console.error('Failed to add user:', err);
            throw err;
        }
    };
    const getUserByEmail = async (email) => {
        try {
            return await db.getByIndex('users', 'email', email);
        }
        catch (err) {
            console.error('Failed to get user by email:', err);
            throw err;
        }
    };
    const getAllUsers = async () => {
        try {
            return await db.getAll('users');
        }
        catch (err) {
            console.error('Failed to get all users:', err);
            throw err;
        }
    };
    const updateUser = async (userData) => {
        try {
            return await db.update('users', userData);
        }
        catch (err) {
            console.error('Failed to update user:', err);
            throw err;
        }
    };
    const deleteUser = async (userId) => {
        try {
            return await db.remove('users', userId);
        }
        catch (err) {
            console.error('Failed to delete user:', err);
            throw err;
        }
    };
    return {
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,
        addUser,
        getUserByEmail,
        getAllUsers,
        updateUser,
        deleteUser
    };
}
