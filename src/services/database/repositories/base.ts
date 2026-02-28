/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BaseEntity, QueryOptions} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import type {TransactionManager} from "../transaction/manager";

/**
 * Base repository providing common CRUD operations
 * Uses composition over inheritance for better testability
 */
export abstract class BaseRepository<T extends BaseEntity> {
    protected readonly storeName: string;
    protected readonly transactionManager: TransactionManager;
    protected readonly indexes: Map<keyof T, string> = new Map();

    protected constructor(
        storeName: string,
        transactionManager: TransactionManager,
        indexes: Map<keyof T, string> = new Map()
    ) {
        this.storeName = storeName;
        this.transactionManager = transactionManager;
        this.indexes = indexes;
    }

    /**
     * Retrieves a record by ID.
     */
    async findById(id: number, options: QueryOptions = {}): Promise<T | null> {
        const operation = async (tx: IDBTransaction): Promise<T | null> => {
            const store = tx.objectStore(this.storeName);
            const result = await this.executeRequest<T>(store.get(id));
            return result || null;
        };

        return this.runInTransaction("readonly", operation, options);
    }

    /**
     * Retrieves all records from the store.
     */
    async findAll(options: QueryOptions = {}): Promise<T[]> {
        const operation = async (tx: IDBTransaction): Promise<T[]> => {
            const store = tx.objectStore(this.storeName);
            return this.executeRequest<T[]>(store.getAll());
        };

        return this.runInTransaction("readonly", operation, options);
    }

    /**
     * Finds records matching a field value using an index
     */
    async findBy(
        field: keyof T,
        value: IDBValidKey,
        options: QueryOptions = {}
    ): Promise<T[]> {
        const indexName = this.indexes.get(field);

        if (!indexName) {
            throw new AppError(
                ERROR_CODES.SERVICES.DATABASE.NO_INDEX,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName: this.storeName, field: String(field)}
            );
        }

        const operation = async (tx: IDBTransaction): Promise<T[]> => {
            const store = tx.objectStore(this.storeName);
            const index = store.index(indexName);
            return this.executeRequest<T[]>(index.getAll(value));
        };

        return this.runInTransaction("readonly", operation, options);
    }

    /**
     * Saves a record (insert or update)
     */
    async save(entity: T, options: QueryOptions = {}): Promise<number> {
        const operation = async (tx: IDBTransaction): Promise<number> => {
            const store = tx.objectStore(this.storeName);

            if (entity.cID) {
                // Update existing
                const result = await this.executeRequest<IDBValidKey>(store.put(entity));
                return result as number;
            } else {
                // Insert new
                const {cID: _ignored, ...dataToAdd} = entity as T & { cID?: number };
                const result = await this.executeRequest<IDBValidKey>(store.add(dataToAdd));
                return result as number;
            }
        };

        return this.runInTransaction("readwrite", operation, options);
    }

    /**
     * Deletes a record by ID
     */
    async delete(id: number, options: QueryOptions = {}): Promise<void> {
        const operation = async (tx: IDBTransaction): Promise<void> => {
            const store = tx.objectStore(this.storeName);
            await this.executeRequest<undefined>(store.delete(id));
        };

        return this.runInTransaction("readwrite", operation, options);
    }

    /**
     * Deletes all records matching a field value
     */
    async deleteBy(
        field: keyof T,
        value: IDBValidKey,
        options: QueryOptions = {}
    ): Promise<void> {
        const indexName = this.indexes.get(field);

        if (!indexName) {
            throw new AppError(
                ERROR_CODES.SERVICES.DATABASE.NO_INDEX,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName: this.storeName, field: String(field)}
            );
        }

        const operation = async (tx: IDBTransaction): Promise<void> => {
            const store = tx.objectStore(this.storeName);
            const index = store.index(indexName);
            await this.deleteByCursor(index, IDBKeyRange.only(value));
        };

        return this.runInTransaction("readwrite", operation, options);
    }

    /**
     * Counts total records in the store
     */
    async count(options: QueryOptions = {}): Promise<number> {
        const operation = async (tx: IDBTransaction): Promise<number> => {
            const store = tx.objectStore(this.storeName);
            return this.executeRequest<number>(store.count());
        };

        return this.runInTransaction("readonly", operation, options);
    }

    // Protected helper methods

    protected async executeRequest<R>(request: IDBRequest<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () =>
                reject(
                    new AppError(
                        ERROR_CODES.SERVICES.DATABASE.REQUEST_FAILED,
                        ERROR_CATEGORY.DATABASE,
                        false,
                        {storeName: this.storeName}
                    )
                );
        });
    }

    private runInTransaction<R>(
        mode: IDBTransactionMode,
        operation: (_tx: IDBTransaction) => Promise<R>,
        options: QueryOptions
    ): Promise<R> {
        if (options.tx) {
            return operation(options.tx);
        }
        return this.transactionManager.execute(this.storeName, mode, operation);
    }

    protected async deleteByCursor(
        index: IDBIndex,
        query: IDBValidKey | IDBKeyRange
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = index.openCursor(query);
            const rejectWithDeleteError = () =>
                reject(
                    new AppError(
                        ERROR_CODES.SERVICES.DATABASE.BASE.A,
                        ERROR_CATEGORY.DATABASE,
                        false,
                        {storeName: this.storeName}
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
}
