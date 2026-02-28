/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    DatabaseConnection,
    TransactionOptions
} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";

/**
 * Manages IndexedDB transactions with proper lifecycle handling
 */
export class TransactionManager {
    private readonly connection: DatabaseConnection;

    constructor(connection: DatabaseConnection) {
        this.connection = connection;
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
    async execute<T>(
        storeNames: string | string[],
        mode: IDBTransactionMode,
        operation: (_tx: IDBTransaction) => Promise<T>,
        options: TransactionOptions = {}
    ): Promise<T> {
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];

        this.ensureConnected();

        const tx = this.connection.getDatabase().transaction(stores, mode);

        // Set up timeout if specified
        const timeoutHandle = options.timeout
            ? this.setupTimeout(tx, options.timeout, stores)
            : undefined;

        try {
            options.onProgress?.({phase: "started"});

            options.onProgress?.({phase: "executing"});
            const result = await operation(tx);

            options.onProgress?.({phase: "completing"});
            await this.waitForCompletion(tx);

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
            } catch {
                // Transaction may already be aborted
            }

            throw this.wrapTransactionError(err, stores, mode);
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
    async executeMultiple<T>(
        storeNames: string | string[],
        mode: IDBTransactionMode,
        operations: Array<(_tx: IDBTransaction) => Promise<T>>
    ): Promise<T[]> {
        return this.execute(storeNames, mode, async (tx) => {
            const results: T[] = [];

            for (const operation of operations) {
                const result = await operation(tx);
                results.push(result);
            }

            return results;
        });
    }

    // Private methods

    private ensureConnected(): void {
        if (!this.connection.isConnected()) {
            throw new AppError(
                ERROR_CODES.SERVICES.DATABASE.BASE.I,
                ERROR_CATEGORY.DATABASE,
                false
            );
        }
    }

    private waitForCompletion(tx: IDBTransaction): Promise<void> {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(new Error("Transaction aborted"));
        });
    }

    private setupTimeout(
        tx: IDBTransaction,
        timeout: number,
        stores: string[]
    ): NodeJS.Timeout {
        return setTimeout(() => {
            DomainUtils.log(
                "DATABASE transaction: timeout",
                {timeout, stores},
                "error"
            );
            try {
                tx.abort();
            } catch {
                // May already be aborted
            }
        }, timeout);
    }

    private wrapTransactionError(
        err: unknown,
        stores: string[],
        mode: IDBTransactionMode
    ): AppError {
        if (err instanceof AppError) {
            return err;
        }

        return new AppError(
            ERROR_CODES.SERVICES.DATABASE.TRANSACTION_FAILED,
            ERROR_CATEGORY.DATABASE,
            true,
            {stores, mode, originalError: err}
        );
    }
}
