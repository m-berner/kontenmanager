/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domain/errors";
import type {AppError, DatabaseConnection, TransactionOptions} from "@/domain/types";
import {log} from "@/domain/utils/utils";

function waitForCompletion(
    tx: IDBTransaction,
    stores: string[],
    mode: IDBTransactionMode
): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(
            appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.TRANSACTION_FAILED.CODE,
                ERROR_CATEGORY.DATABASE,
                true,
                {
                    stores,
                    mode,
                    reason: "Transaction aborted",
                    originalError: tx.error ? serializeError(tx.error) : undefined
                }
            )
        );
    });
}

function setupTimeout(
    tx: IDBTransaction,
    timeout: number,
    stores: string[]
): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
        log(
            "DATABASE transaction: timeout",
            {timeout, stores},
            "error"
        );
        try {
            tx.abort();
        } catch (err) {
            // May already be aborted
            void err;
        }
    }, timeout);
}

function wrapTransactionError(
    err: unknown,
    stores: string[],
    mode: IDBTransactionMode
): AppError {
    if (isAppError(err)) {
        return err;
    }

    return appError(
        ERROR_DEFINITIONS.SERVICES.DATABASE.TRANSACTION_FAILED.CODE,
        ERROR_CATEGORY.DATABASE,
        true,
        {stores, mode, originalError: err}
    );
}

/**
 * Creates a transaction manager instance.
 */
export function createTransactionManager(connection: DatabaseConnection) {
    function ensureConnected(): void {
        if (!connection.isConnected()) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE,
                ERROR_CATEGORY.DATABASE,
                false
            );
        }
    }

    /**
     * Executes an operation within a transaction
     *
     * @param storeNames - Store(s) to include in transaction
     * @param mode - Transaction mode (readonly/readwrite)
     * @param operation - Function to execute within transaction
     * @param options - Optional transaction configuration
     * @returns Result of the operation
     */
    async function execute<T>(
        storeNames: string | string[],
        mode: IDBTransactionMode,
        operation: (_tx: IDBTransaction) => Promise<T>,
        options: TransactionOptions = {}
    ): Promise<T> {
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];

        ensureConnected();

        const tx = connection.getDatabase().transaction(stores, mode);

        // Set up timeout if specified
        const timeoutHandle = options.timeout
            ? setupTimeout(tx, options.timeout, stores)
            : undefined;

        try {
            options.onProgress?.({phase: "started"});

            options.onProgress?.({phase: "executing"});
            const result = await operation(tx);

            options.onProgress?.({phase: "completing"});
            await waitForCompletion(tx, stores, mode);

            options.onProgress?.({phase: "completed"});

            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            return result;
        } catch (err) {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            // Abort transaction on error
            try {
                tx.abort();
            } catch (abortErr) {
                // Transaction may have already auto-committed before the error was thrown,
                // meaning partial writes could be persisted despite the error path.
                log(
                    "DATABASE transaction: abort failed — writes may have been committed",
                    {stores, mode, abortErr},
                    "error"
                );
            }

            throw wrapTransactionError(err, stores, mode);
        }
    }

    /**
     * Executes multiple operations in a single transaction
     *
     * @param storeNames - Store(s) to include in transaction
     * @param mode - Transaction mode
     * @param operations - Array of operations to execute
     * @returns Array of results in the same order as operations
     */
    async function executeMultiple<T>(
        storeNames: string | string[],
        mode: IDBTransactionMode,
        operations: Array<(_tx: IDBTransaction) => Promise<T>>
    ): Promise<T[]> {
        return execute(storeNames, mode, async (tx) => {
            const results: T[] = [];

            for (const operation of operations) {
                const result = await operation(tx);
                results.push(result);
            }

            return results;
        });
    }

    return {
        execute,
        executeMultiple
    };
}

export type TransactionManagerContract = ReturnType<typeof createTransactionManager>;

export const TransactionManager = {
    create: createTransactionManager
};