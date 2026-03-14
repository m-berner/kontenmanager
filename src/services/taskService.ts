/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {appError, ERROR_DEFINITIONS} from "@/domains/errors";
import {ERROR_CATEGORY} from "@/constants";

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

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            if (attempt === maxRetries) {
                throw appError(
                    ERROR_DEFINITIONS.USE_DIALOG_GUARDS.B.CODE,
                    ERROR_CATEGORY.VALIDATION,
                    true
                );
            }

            onRetry?.(attempt, err as Error);
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
    }

    throw appError(
        ERROR_DEFINITIONS.USE_DIALOG_GUARDS.C.CODE,
        ERROR_CATEGORY.VALIDATION,
        false
    );
}

/**
 * Checks connection and throws an error if disconnected.
 *
 * @param isConnected - Current connection status.
 * @param errorMessage - Message to include in the error.
 * @throws Error if not connected.
 */
export function ensureConnected(isConnected: boolean, errorMessage = "Database is not connected"): void {
    if (!isConnected) {
        throw new Error(errorMessage);
    }
}

export const taskService = {
    withRetry,
    ensureConnected
};
