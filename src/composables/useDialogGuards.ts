/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {ref} from 'vue'

export function useDialogGuards() {
    const isLoading = ref<boolean>(false)

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

    function handleError(errorKey: string, err: unknown): Error {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return new Error(`${errorKey}: ${message}`)
    }

    async function withLoading<T>(
        operation: () => Promise<T>
    ): Promise<T | undefined> {
        isLoading.value = true
        try {
            return await operation()
        } finally {
            isLoading.value = false
        }
    }

    async function validateForm(form: Ref<HTMLFormElement | null>): Promise<boolean> {
        if (form.value !== null) {
            // noinspection ES6RedundantAwait
            const values = await form.value.validate()
            return values.valid
        }
        return false
    }

    return {
        isLoading,
        ensureConnected,
        handleError,
        validateForm,
        withLoading
    }
}
