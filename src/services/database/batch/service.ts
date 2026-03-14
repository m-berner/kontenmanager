/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BatchOperationDescriptor, RecordOperation} from "@/types";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import {ERROR_CATEGORY, INDEXED_DB} from "@/constants";
import type {TransactionManagerContract} from "@/services/database/transaction/manager";

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

export type BatchOperationBuilder = {
    add: (_storeName: string, _operation: RecordOperation) => BatchOperationBuilder;
    insert: (_storeName: string, _data: unknown) => BatchOperationBuilder;
    update: (_storeName: string, _data: unknown) => BatchOperationBuilder;
    remove: (_storeName: string, _key: number) => BatchOperationBuilder;
    clear: (_storeName: string) => BatchOperationBuilder;
    execute: () => Promise<void>;
    getOperationCount: () => number;
    reset: () => BatchOperationBuilder;
};

type BatchServiceContract = {
    executeAtomic: (_descriptors: BatchOperationDescriptor[]) => Promise<void>;
    executeBatch: (_storeName: string, _operations: RecordOperation[]) => Promise<void>;
    createBuilder: () => BatchOperationBuilder;
};

function validateDescriptors(descriptors: BatchOperationDescriptor[]): void {
    if (descriptors.length === 0) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.INVALID_BATCH.CODE,
            ERROR_CATEGORY.DATABASE,
            false,
            {reason: "No operations provided"}
        );
    }

    for (const descriptor of descriptors) {
        if (!VALID_STORES.includes(descriptor.storeName as ValidStoreNameType)) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.D.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName: descriptor.storeName}
            );
        }

        if (descriptor.operations.length === 0) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.INVALID_BATCH.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {storeName: descriptor.storeName, reason: "No operations for the store"}
            );
        }
    }
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function executeOperation(
    store: IDBObjectStore,
    operation: RecordOperation
): Promise<void> {
    switch (operation.type) {
        case "add":
            await promisifyRequest(store.add(operation.data));
            break;
        case "put":
            await promisifyRequest(store.put(operation.data));
            break;
        case "delete":
            if (operation.key === undefined) {
                throw appError(
                    ERROR_DEFINITIONS.SERVICES.DATABASE.C.CODE,
                    ERROR_CATEGORY.DATABASE,
                    false,
                    {operation: "delete", reason: "Missing key"}
                );
            }
            await promisifyRequest(store.delete(operation.key));
            break;
        case "clear":
            await promisifyRequest(store.clear());
            break;
        default:
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.D.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {operation: operation.type}
            );
    }
}

async function executeOperations(
    store: IDBObjectStore,
    operations: RecordOperation[]
): Promise<void> {
    for (const operation of operations) {
        await executeOperation(store, operation);
    }
}

/**
 * Creates a batch operation service instance.
 */
export function createBatchOperationService(transactionManager: TransactionManagerContract): BatchServiceContract {
    /**
     * Executes multiple operations across multiple stores atomically
     *
     * @param descriptors - Array of store operations
     * @returns Promise that resolves when all operations complete
     */
    async function executeAtomic(descriptors: BatchOperationDescriptor[]): Promise<void> {
        const startTime = performance.now();

        validateDescriptors(descriptors);

        const storeNames = descriptors.map((d) => d.storeName);

        log("DATABASE batch: starting atomic operation", {
            stores: storeNames,
            totalOperations: descriptors.reduce(
                (sum, d) => sum + d.operations.length,
                0
            )
        });

        await transactionManager.execute(
            storeNames,
            "readwrite",
            async (tx: IDBTransaction) => {
                for (const descriptor of descriptors) {
                    const store = tx.objectStore(descriptor.storeName);
                    await executeOperations(store, descriptor.operations);
                }
            }
        );

        const duration = Math.round(performance.now() - startTime);
        log("DATABASE batch: atomic operation completed", {duration});
    }

    /**
     * Executes operations on a single store
     *
     * @param storeName - Target store name
     * @param operations - Operations to execute
     */
    async function executeBatch(
        storeName: string,
        operations: RecordOperation[]
    ): Promise<void> {
        return executeAtomic([{storeName, operations}]);
    }

    /**
     * Creates a fluent builder for batch operations
     */
    function createBuilder(): BatchOperationBuilder {
        return createBatchOperationBuilder({executeAtomic});
    }

    return {
        executeAtomic,
        executeBatch,
        createBuilder
    };
}

/**
 * Creates a fluent builder for batch operations
 */
export function createBatchOperationBuilder(service: Pick<BatchServiceContract, "executeAtomic">) {
    const descriptors: Map<string, RecordOperation[]> = new Map();

    function add(storeName: string, operation: RecordOperation) {
        if (!descriptors.has(storeName)) {
            descriptors.set(storeName, []);
        }
        descriptors.get(storeName)!.push(operation);
        return builder;
    }

    function insert(storeName: string, data: unknown) {
        return add(storeName, {type: "add", data});
    }

    function update(storeName: string, data: unknown) {
        return add(storeName, {type: "put", data});
    }

    function remove(storeName: string, key: number) {
        return add(storeName, {type: "delete", key});
    }

    function clear(storeName: string) {
        return add(storeName, {type: "clear"});
    }

    async function execute(): Promise<void> {
        const batchDescriptors = Array.from(descriptors.entries()).map(
            ([storeName, operations]) => ({storeName, operations})
        );

        return service.executeAtomic(batchDescriptors);
    }

    function getOperationCount(): number {
        return Array.from(descriptors.values()).reduce(
            (sum, ops) => sum + ops.length,
            0
        );
    }

    function reset() {
        descriptors.clear();
        return builder;
    }

    const builder = {
        add,
        insert,
        update,
        remove,
        clear,
        execute,
        getOperationCount,
        reset
    };

    return builder;
}

// export type BatchOperationBuilder = ReturnType<typeof createBatchOperationBuilder>;

export const BatchOperationService = {
    create: createBatchOperationService
};
