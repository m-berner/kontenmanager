/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BatchOperationDescriptor, RecordOperation} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import type {TransactionManager} from "../transaction/manager";
import {INDEXED_DB} from "@/configs/database";

/**
 * Valid store names
 */
const VALID_STORES = [
    INDEXED_DB.STORE.ACCOUNTS.NAME,
    INDEXED_DB.STORE.BOOKINGS.NAME,
    INDEXED_DB.STORE.STOCKS.NAME,
    INDEXED_DB.STORE.BOOKING_TYPES.NAME
] as const;

export type ValidStoreNameType = (typeof VALID_STORES)[number];

/**
 * Service for executing batch operations atomically
 */
export class BatchOperationService {
    private readonly transactionManager: TransactionManager;

    constructor(transactionManager: TransactionManager) {
        this.transactionManager = transactionManager;
    }

    /**
     * Executes multiple operations across multiple stores atomically
     *
     * @param descriptors - Array of store operations
     * @returns Promise that resolves when all operations complete
     */
    async executeAtomic(descriptors: BatchOperationDescriptor[]): Promise<void> {
        const startTime = performance.now();

        this.validateDescriptors(descriptors);

        const storeNames = descriptors.map((d) => d.storeName);

        DomainUtils.log("DATABASE batch: starting atomic operation", {
            stores: storeNames,
            totalOperations: descriptors.reduce(
                (sum, d) => sum + d.operations.length,
                0
            )
        });

        await this.transactionManager.execute(
            storeNames,
            "readwrite",
            async (tx) => {
                for (const descriptor of descriptors) {
                    const store = tx.objectStore(descriptor.storeName);
                    await this.executeOperations(store, descriptor.operations);
                }
            }
        );

        const duration = Math.round(performance.now() - startTime);
        DomainUtils.log("DATABASE batch: atomic operation completed", {duration});
    }

    /**
     * Executes operations on a single store
     *
     * @param storeName - Target store name
     * @param operations - Operations to execute
     */
    async executeBatch(
        storeName: string,
        operations: RecordOperation[]
    ): Promise<void> {
        return this.executeAtomic([{storeName, operations}]);
    }

    /**
     * Creates a fluent builder for batch operations
     */
    createBuilder(): BatchOperationBuilder {
        return new BatchOperationBuilder(this);
    }

    // Private methods

    private validateDescriptors(descriptors: BatchOperationDescriptor[]): void {
        if (descriptors.length === 0) {
            throw new AppError(
                ERROR_CODES.SERVICES.DATABASE.INVALID_BATCH,
                ERROR_CATEGORY.DATABASE,
                false,
                {reason: "No operations provided"}
            );
        }

        for (const descriptor of descriptors) {
            if (!VALID_STORES.includes(descriptor.storeName as ValidStoreNameType)) {
                throw new AppError(
                    ERROR_CODES.SERVICES.DATABASE.D,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName: descriptor.storeName}
                );
            }

            if (descriptor.operations.length === 0) {
                throw new AppError(
                    ERROR_CODES.SERVICES.DATABASE.INVALID_BATCH,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {storeName: descriptor.storeName, reason: "No operations for store"}
                );
            }
        }
    }

    private async executeOperations(
        store: IDBObjectStore,
        operations: RecordOperation[]
    ): Promise<void> {
        for (const operation of operations) {
            await this.executeOperation(store, operation);
        }
    }

    private async executeOperation(
        store: IDBObjectStore,
        operation: RecordOperation
    ): Promise<void> {
        switch (operation.type) {
            case "add":
                await this.promisifyRequest(store.add(operation.data));
                break;
            case "put":
                await this.promisifyRequest(store.put(operation.data));
                break;
            case "delete":
                if (operation.key === undefined) {
                    throw new AppError(
                        ERROR_CODES.SERVICES.DATABASE.C,
                        ERROR_CATEGORY.DATABASE,
                        false,
                        {operation: "delete", reason: "Missing key"}
                    );
                }
                await this.promisifyRequest(store.delete(operation.key));
                break;
            case "clear":
                await this.promisifyRequest(store.clear());
                break;
            default:
                throw new AppError(
                    ERROR_CODES.SERVICES.DATABASE.D,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {operation: operation.type}
                );
        }
    }

    private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

/**
 * Fluent builder for batch operations
 */
export class BatchOperationBuilder {
    private descriptors: Map<string, RecordOperation[]> = new Map();
    private readonly service: BatchOperationService;

    constructor(service: BatchOperationService) {
        this.service = service;
    }

    /**
     * Adds an operation to the batch
     */
    add(storeName: string, operation: RecordOperation): this {
        if (!this.descriptors.has(storeName)) {
            this.descriptors.set(storeName, []);
        }
        this.descriptors.get(storeName)!.push(operation);
        return this;
    }

    /**
     * Adds an insert operation
     */
    insert(storeName: string, data: unknown): this {
        return this.add(storeName, {type: "add", data});
    }

    /**
     * Adds an update operation
     */
    update(storeName: string, data: unknown): this {
        return this.add(storeName, {type: "put", data});
    }

    /**
     * Adds a delete operation
     */
    remove(storeName: string, key: number): this {
        return this.add(storeName, {type: "delete", key});
    }

    /**
     * Adds a clear operation
     */
    clear(storeName: string): this {
        return this.add(storeName, {type: "clear"});
    }

    /**
     * Executes all queued operations atomically
     */
    async execute(): Promise<void> {
        const descriptors = Array.from(this.descriptors.entries()).map(
            ([storeName, operations]) => ({storeName, operations})
        );

        return this.service.executeAtomic(descriptors);
    }

    /**
     * Gets the current operation count
     */
    getOperationCount(): number {
        return Array.from(this.descriptors.values()).reduce(
            (sum, ops) => sum + ops.length,
            0
        );
    }

    /**
     * Clears all queued operations
     */
    reset(): this {
        this.descriptors.clear();
        return this;
    }
}
