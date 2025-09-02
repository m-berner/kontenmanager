/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {type Ref, onUnmounted, ref} from 'vue'

// Global database instance (shared across components)
let dbInstance: { db: IDBDatabase } | null = null
let dbPromise: Promise<IDBDatabase> | null = null

export function useIndexedDB(dbName = 'myApp', version = 1) {
    const isConnected: Ref<boolean> = ref(false)
    const error: Ref<unknown | null> = ref(null)
    const isLoading: Ref<boolean> = ref(false)

    // Database schema setup
    const setupDatabase = (db: IDBDatabase) => {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', {keyPath: 'id', autoIncrement: true})
            userStore.createIndex('email', 'email', {unique: true})
            userStore.createIndex('name', 'name', {unique: false})
        }

        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', {keyPath: 'key'})
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
                        console.log('Database version changed, closing connection')
                        db.close()
                        dbInstance = null
                        dbPromise = null
                        isConnected.value = false
                    }

                    // Handle unexpected close
                    db.onclose = () => {
                        console.log('Database connection closed')
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
                        setupDatabase(db)
                    }
                }
            })
        }

        return dbPromise
    }

    // Generic transaction helper
    const performTransaction = async (storeName: string, mode: 'readonly' | 'readwrite', operations: CallableFunction): Promise<void> => {
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
    const add = async (storeName: string, data: unknown) => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.add(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const get = async (storeName: string, key: string) => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.get(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const getAll = async (storeName: string) => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.getAll()

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const update = async (storeName: string, data: unknown) => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.put(data)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    const remove = async (storeName: string, key: string) => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.delete(key)

                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
        })
    }

    // Batch operations
    const batchOperations = async (storeName: string, operations: Array<{type: string, data: unknown, key: IDBValidKey}>) => {
        return performTransaction(storeName, 'readwrite', async (transaction: IDBTransaction) => {
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
    const getByIndex = async (storeName: string, indexName: string, value: IDBValidKey) => {
        return performTransaction(storeName, 'readonly', (transaction: IDBTransaction) => {
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
    const clear = async (storeName: string) => {
        return performTransaction(storeName, 'readwrite', (transaction: IDBTransaction) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName)
                const request = store.clear()

                request.onsuccess = () => resolve('')
                request.onerror = () => reject(request.error)
            })
        })
    }

    // Cleanup on unmount (optional - connection stays open by default)
    onUnmounted(() => {
        // Typically you don't close the connection
        // Only close if you specifically need to
        // if (dbInstance?.db) {
        //   dbInstance.db.close()
        //   dbInstance = null
        //   dbPromise = null
        // }
    })

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

// Usage example in a component
export function useUserStore() {
    const db = useIndexedDB('userApp', 1)

    const addUser = async (userData: unknown) => {
        try {
            return await db.add('users', userData)
        } catch (err) {
            console.error('Failed to add user:', err)
            throw err
        }
    }

    const getUserByEmail = async (email: string) => {
        try {
            return await db.getByIndex('users', 'email', email)
        } catch (err) {
            console.error('Failed to get user by email:', err)
            throw err
        }
    }

    const getAllUsers = async () => {
        try {
            return await db.getAll('users')
        } catch (err) {
            console.error('Failed to get all users:', err)
            throw err
        }
    }

    const updateUser = async (userData: unknown) => {
        try {
            return await db.update('users', userData)
        } catch (err) {
            console.error('Failed to update user:', err)
            throw err
        }
    }

    const deleteUser = async (userId: string) => {
        try {
            return await db.remove('users', userId)
        } catch (err) {
            console.error('Failed to delete user:', err)
            throw err
        }
    }

    return {
        // Expose database state
        isConnected: db.isConnected,
        error: db.error,
        isLoading: db.isLoading,

        // User-specific operations
        addUser,
        getUserByEmail,
        getAllUsers,
        updateUser,
        deleteUser
    }
}
