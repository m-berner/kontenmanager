/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS} from "@/domain/errors";
import type {BaseEntity, QueryOptions} from "@/domain/types";

import type {TransactionManagerContract} from "@/adapters/driven/database/transactionManager";

async function executeRequest<R>(request: IDBRequest<R>, storeName: string): Promise<R> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            const err = request.error as DOMException | null;
            const details = {
                storeName,
                name: err?.name,
                message: err?.message
            } as const;
            reject(
                appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.REQUEST_FAILED.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    details
                )
            );
        };
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
            if (!cursor) {
                resolve();
                return;
            }

            // `IDBCursor.delete()` always returns an IDBRequest — it throws on
            // misuse rather than returning a falsy value — so the old
            // `if (deleteRequest) … else cursor.continue()` had an unreachable
            // else. Worse than dead: it implied a failure mode that cannot
            // occur, and had it occurred it would have skipped the delete-error
            // handling entirely and advanced the cursor as if the row were gone.
            const deleteRequest = cursor.delete();
            deleteRequest.onsuccess = () => cursor.continue();
            deleteRequest.onerror = rejectWithDeleteError;
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
            // A caller-supplied `versionchange` transaction belongs to an
            // in-flight schema upgrade; running ordinary reads/writes on it is
            // almost certainly a mistake, and any failure would abort the
            // upgrade itself. Reject it explicitly rather than silently
            // accepting it because it happens not to be "readonly".
            if (options.tx.mode !== "readonly" && options.tx.mode !== "readwrite") {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.K.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName, requiredMode: mode, actualMode: options.tx.mode}
                );
            }
            if (mode === "readwrite" && options.tx.mode === "readonly") {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.K.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName, requiredMode: mode, actualMode: options.tx.mode}
                );
            }
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

            if ("cID" in entity && entity.cID != null && entity.cID > 0) {
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

    /**
     * Counts records matching a field value using an index.
     *
     * The index-level counterpart to {@link count}, and the reason it exists:
     * every `countByAccount` used to run `findBy(...)` and read `.length`, which
     * makes IndexedDB deserialize every matching record only to discard them all.
     * `IDBIndex.count(key)` returns the same number from the index alone, so an
     * account with a long booking history no longer reads and allocates its
     * entire booking set per call.
     */
    async function countBy(
        field: keyof T,
        value: IDBValidKey,
        options: QueryOptions = {}
    ): Promise<number> {
        const indexName = indexes.get(field);

        if (!indexName) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.NO_INDEX.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName, field: String(field)}
            );
        }

        const operation = async (tx: IDBTransaction): Promise<number> => {
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            return executeRequest<number>(index.count(value), storeName);
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
        countBy,
        storeName,
        indexes,
        executeRequest,
        deleteByCursor,
        runInTransaction
    };
}