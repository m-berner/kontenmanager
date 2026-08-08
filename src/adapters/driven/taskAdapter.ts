/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError, toError} from "@/domain/errors";

/**
 * Executes an async operation with automatic retries on failure.
 *
 * @param operation - The async function to retry.
 * @param options - Configuration for max retries, delay, and retry callback.
 * @returns A promise resolving to the operation result.
 * @throws AppError if all retries fail.
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: {
        maxRetries?: number;
        delay?: number;
        onRetry?: (_attempt: number, _error: Error) => void;
    } = {}
): Promise<T> {
    const {maxRetries = 3, delay = 1000, onRetry} = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            lastError = err;
            const asError = toError(err);

            // If a domain-level AppError is thrown, preserve it; retries are only useful
            // for transient failures.
            if (isAppError(err) && !err.recoverable) {
                throw err;
            }

            if (attempt === maxRetries) {
                // Rethrow an AppError unchanged so callers keep the ability to
                // branch on what actually failed. Previously every final failure
                // was replaced by a generic USE_DIALOG_GUARDS.B error, with the
                // cause surviving only inside serialized `details`.
                if (isAppError(err)) {
                    throw err;
                }
                throw appError(
                    ERROR_DEFINITIONS.USE_DIALOG_GUARDS.B.CODE,
                    ERROR_CATEGORY.VALIDATION,
                    true,
                    {
                        maxRetries,
                        attempt,
                        lastError: serializeError(lastError)
                    }
                );
            }

            onRetry?.(attempt, asError);
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
    }

    // The loop above always returns or throws on its final iteration, so this
    // is unreachable — but TypeScript cannot see that, and a bare fallthrough
    // would silently resolve `undefined`. Kept as an explicit invariant guard.
    /* istanbul ignore next */
    throw appError(
        ERROR_DEFINITIONS.USE_DIALOG_GUARDS.C.CODE,
        ERROR_CATEGORY.VALIDATION,
        false,
        {maxRetries, lastError: serializeError(lastError)}
    );
}

/**
 * Checks connection and throws an error if disconnected.
 *
 * @param isConnected - Current connection status.
 * @param errorMessage - Message to include in the error.
 * @throws AppError if not connected.
 */
export function ensureConnected(isConnected: boolean, errorMessage = "Database is not connected"): void {
    if (!isConnected) {
        const err = appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.I.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {errorMessage}
        );
        // Preserve the caller-provided message for UI/tests while keeping a stable code/category.
        err.message = errorMessage;
        throw err;
    }
}

export function createTaskAdapter() {
    return {
        withRetry,
        ensureConnected
    };
}

export type TaskAdapter = ReturnType<typeof createTaskAdapter>;
