/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import {AppError} from '@/domains/errors'
import {SYSTEM} from '@/domains/config/system'

/**
 * Low-level base class for IndexedDB operations.
 */
export class IndexedDbBase {
    protected db: IDBDatabase | null = null
    protected connected: boolean = false

    async withTransaction<T>(
        storeNames: string | string[],
        mode: IDBTransactionMode,
        callback: (_tx: IDBTransaction) => Promise<T>
    ): Promise<T> {
        await this.ensureConnected()
        const tx = this.db!.transaction(storeNames, mode)
        try {
            const result = await callback(tx)
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(result)
                tx.onerror = () => reject(tx.error)
                tx.onabort = () => reject(new Error('Transaction aborted'))
            })
        } catch (err) {
            tx.abort()
            throw err
        }
    }

    async add<T>(storeName: string, data: T, tx?: IDBTransaction): Promise<number> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'))
        const store = transaction.objectStore(storeName)

        // Remove cID if it exists, as IndexedDB with autoIncrement doesn't allow it
        const addData: any = {...data}
        if ('cID' in addData) {
            delete addData.cID
        }

        const request = store.add(addData)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as number)
            request.onerror = () => reject(new AppError(
                `Failed to add record to ${storeName}: ${request.error?.message}`,
                'DB_ADD_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async get<T>(storeName: string, key: IDBValidKey, tx?: IDBTransaction): Promise<T | null> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'))
        const store = transaction.objectStore(storeName)
        const request = store.get(key)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as T || null)
            request.onerror = () => reject(new AppError(
                `Failed to get record from ${storeName}: ${request.error?.message}`,
                'DB_GET_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async getAll<T>(storeName: string, tx?: IDBTransaction): Promise<T[]> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'))
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as T[])
            request.onerror = () => reject(new AppError(
                `Failed to getAll records from ${storeName}: ${request.error?.message}`,
                'DB_GET_ALL_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async update<T>(storeName: string, data: T, tx?: IDBTransaction): Promise<IDBValidKey> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'))
        const store = transaction.objectStore(storeName)
        const request = store.put(data)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(new AppError(
                `Failed to update record in ${storeName}: ${request.error?.message}`,
                'DB_UPDATE_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async remove(storeName: string, key: IDBValidKey, tx?: IDBTransaction): Promise<void> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'))
        const store = transaction.objectStore(storeName)
        const request = store.delete(key)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = () => reject(new AppError(
                `Failed to remove record from ${storeName}: ${request.error?.message}`,
                'DB_REMOVE_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async clear(storeName: string, tx?: IDBTransaction): Promise<void> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readwrite'))
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = () => reject(new AppError(
                `Failed to clear store ${storeName}: ${request.error?.message}`,
                'DB_CLEAR_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async getAllByIndex<T>(storeName: string, indexName: string, query: IDBValidKey | IDBKeyRange, tx?: IDBTransaction): Promise<T[]> {
        const transaction = tx || (await this.getAutoTransaction(storeName, 'readonly'))
        const store = transaction.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.getAll(query)

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as T[])
            request.onerror = () => reject(new AppError(
                `Failed to getAllByIndex from ${storeName} on index ${indexName}: ${request.error?.message}`,
                'DB_GET_ALL_BY_INDEX_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    async deleteByCursor(index: IDBIndex, query: IDBValidKey | IDBKeyRange): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = index.openCursor(query)
            req.onsuccess = () => {
                const cursor = req.result
                if (cursor) {
                    cursor.delete()
                    cursor.continue()
                } else {
                    resolve()
                }
            }
            req.onerror = () => reject(new AppError(
                `Failed to deleteByCursor: ${req.error?.message}`,
                'DB_DELETE_BY_CURSOR_FAILED',
                SYSTEM.ERROR_CATEGORY.DATABASE,
                {},
                false
            ))
        })
    }

    protected async ensureConnected(): Promise<void> {
        if (!this.db) {
            throw new AppError('Database not connected', 'DATABASE_BASE', SYSTEM.ERROR_CATEGORY.DATABASE)
        }
    }

    private async getAutoTransaction(storeName: string, mode: IDBTransactionMode): Promise<IDBTransaction> {
        await this.ensureConnected()
        return this.db!.transaction(storeName, mode)
    }
}
