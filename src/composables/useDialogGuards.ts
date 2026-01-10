/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type { Ref } from 'vue'
import { ref } from 'vue'

export class GuardError extends Error {
    constructor(
        message: string,
        public readonly _code: string,
        public readonly _context?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'GuardError'
    }
}

export function useDialogGuards() {
    const isLoading = ref<boolean>(false)
    const loadingOperations = ref<Set<string>>(new Set())

    /**
     * Enhanced connection check with custom error
     */
    async function ensureConnected(
        isConnected: Ref<boolean>,
        notice: (_msg: string[]) => Promise<void>,
        errorMessage = 'Database not connected'
    ): Promise<boolean> {
        if (!isConnected.value) {
            await notice([errorMessage])
            return false
        }
        return true
    }

    /**
     * Enhanced error handler with better type safety
     */
    function handleError(errorKey: string, err: unknown): Error {
        if (err instanceof Error) {
            return new GuardError(
                `${errorKey}: ${err.message}`,
                errorKey,
                { originalError: err }
            )
        }

        return new GuardError(
            `${errorKey}: Unknown error`,
            errorKey,
            { originalError: err }
        )
    }

    /**
     * Track multiple concurrent operations
     */
    async function withLoading<T>(
        operation: () => Promise<T>,
        operationId?: string
    ): Promise<T> {
        const id = operationId || `op-${Date.now()}`

        isLoading.value = true
        loadingOperations.value.add(id)

        try {
            return await operation()
        } finally {
            loadingOperations.value.delete(id)
            isLoading.value = loadingOperations.value.size > 0
        }
    }

    /**
     * Enhanced form validation with detailed errors
     */
    function validateForm(
        form: Ref<HTMLFormElement | null>
    ): { valid: boolean; errors?: string[] } {
        if (!form.value) {
            return { valid: false, errors: ['Form reference not available'] }
        }

        try {
            const result = form.value.validate()
            return {
                valid: result.valid,
                errors: result.errors || []
            }
        } catch (error) {
            return {
                valid: false,
                errors: [(error as Error).message]
            }
        }
    }

    /**
     * Retry mechanism for failed operations
     */
    async function withRetry<T>(
        operation: () => Promise<T>,
        options: {
            maxRetries?: number
            delay?: number
            onRetry?: (_attempt: number, _error: Error) => void
        } = {}
    ): Promise<T> {
        const { maxRetries = 3, delay = 1000, onRetry } = options

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation()
            } catch (error) {
                if (attempt === maxRetries) throw error

                onRetry?.(attempt, error as Error)
                await new Promise(resolve => setTimeout(resolve, delay * attempt))
            }
        }

        throw new Error('Should not reach here')
    }

    return {
        isLoading,
        loadingOperations,
        ensureConnected,
        handleError,
        validateForm,
        withLoading,
        withRetry
    }
}
