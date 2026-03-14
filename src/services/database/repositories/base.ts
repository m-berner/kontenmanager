/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BaseEntity, QueryOptions} from "@/types";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {ERROR_CATEGORY} from "@/constants";
import type {TransactionManagerContract} from "@/services/database/transaction/manager";

async function executeRequest<R>(request: IDBRequest<R>, storeName: string): Promise<R> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(
                appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.REQUEST_FAILED.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName}
                )
            );
    });
}

async function deleteByCursor(
    index: IDBIndex,
    query: IDBValidKey | IDBKeyRange,
    storeName: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = index.openCursor(query);
        const rejectWithDeleteError = () =>
            reject(
                appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.A.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName}
                )
            );

        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                const deleteRequest = cursor.delete();
                if (deleteRequest) {
                    deleteRequest.onsuccess = () => cursor.continue();
                    deleteRequest.onerror = rejectWithDeleteError;
                } else {
                    cursor.continue();
                }
            } else {
                resolve();
            }
        };

        request.onerror = rejectWithDeleteError;
    });
}

/**
 * Creates base repository operations for a specific store.
 */
export function createBaseRepository<T extends BaseEntity>(
    storeName: string,
    transactionManager: TransactionManagerContract,
    indexes: Map<keyof T, string> = new Map()
) {
    function stripId(entity: T | Omit<T, "cID">): Omit<T, "cID"> {
        if ("cID" in entity) {
            const {cID: _ignored, ...rest} = entity;
            return rest as Omit<T, "cID">;
        }
        return entity as Omit<T, "cID">;
    }

    function runInTransaction<R>(
        mode: IDBTransactionMode,
        operation: (_tx: IDBTransaction) => Promise<R>,
        options: QueryOptions
    ): Promise<R> {
        if (options.tx) {
            return operation(options.tx);
        }
        return transactionManager.execute(storeName, mode, operation);
    }

    /**
     * Retrieves a record by ID.
     */
    async function findById(id: number, options: QueryOptions = {}): Promise<T | null> {
        const operation = async (tx: IDBTransaction): Promise<T | null> => {
            const store = tx.objectStore(storeName);
            const result = await executeRequest<T>(store.get(id), storeName);
            return result || null;
        };

        return runInTransaction("readonly", operation, options);
    }

    /**
     * Retrieves all records from the store.
     */
    async function findAll(options: QueryOptions = {}): Promise<T[]> {
        const operation = async (tx: IDBTransaction): Promise<T[]> => {
            const store = tx.objectStore(storeName);
            return executeRequest<T[]>(store.getAll(), storeName);
        };

        return runInTransaction("readonly", operation, options);
    }

    /**
     * Finds records matching a field value using an index
     */
    async function findBy(
        field: keyof T,
        value: IDBValidKey,
        options: QueryOptions = {}
    ): Promise<T[]> {
        const indexName = indexes.get(field);

        if (!indexName) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.NO_INDEX.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName, field: String(field)}
            );
        }

        const operation = async (tx: IDBTransaction): Promise<T[]> => {
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            return executeRequest<T[]>(index.getAll(value), storeName);
        };

        return runInTransaction("readonly", operation, options);
    }

    /**
     * Saves a record (insert or update)
     */
    async function save(entity: T | Omit<T, "cID">, options: QueryOptions = {}): Promise<number> {
        const operation = async (tx: IDBTransaction): Promise<number> => {
            const store = tx.objectStore(storeName);

            if ("cID" in entity && entity.cID) {
                // Update existing
                const result = await executeRequest<IDBValidKey>(store.put(entity), storeName);
                return result as number;
            } else {
                // Insert new
                const dataToAdd = stripId(entity);
                const result = await executeRequest<IDBValidKey>(store.add(dataToAdd), storeName);
                return result as number;
            }
        };

        return runInTransaction("readwrite", operation, options);
    }

    /**
     * Deletes a record by ID
     */
    async function remove(id: number, options: QueryOptions = {}): Promise<void> {
        const operation = async (tx: IDBTransaction): Promise<void> => {
            const store = tx.objectStore(storeName);
            await executeRequest<undefined>(store.delete(id), storeName);
        };

        return runInTransaction("readwrite", operation, options);
    }

    /**
     * Deletes all records matching a field value
     */
    async function deleteBy(
        field: keyof T,
        value: IDBValidKey,
        options: QueryOptions = {}
    ): Promise<void> {
        const indexName = indexes.get(field);

        if (!indexName) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.NO_INDEX.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName, field: String(field)}
            );
        }

        const operation = async (tx: IDBTransaction): Promise<void> => {
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            await deleteByCursor(index, IDBKeyRange.only(value), storeName);
        };

        return runInTransaction("readwrite", operation, options);
    }

    /**
     * Counts total records in the store
     */
    async function count(options: QueryOptions = {}): Promise<number> {
        const operation = async (tx: IDBTransaction): Promise<number> => {
            const store = tx.objectStore(storeName);
            return executeRequest<number>(store.count(), storeName);
        };

        return runInTransaction("readonly", operation, options);
    }

    return {
        findById,
        findAll,
        findBy,
        save,
        delete: remove,
        deleteBy,
        count,
        storeName,
        indexes,
        executeRequest,
        deleteByCursor,
        runInTransaction
    };
}
