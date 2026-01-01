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

    async function handleError(
        error: unknown,
        log: (_msg: string, _data?: any) => void,
        notice: (_msg: string[]) => Promise<void>,
        context: string,
        userMessage: string
    ): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        log(`${context}: Error`, {error: errorMessage, stack: error instanceof Error ? error.stack : undefined})
        await notice([userMessage, errorMessage])
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

    function validateForm(form: Ref<HTMLFormElement | null>): boolean {
        if (form.value !== null) {
            return form.value.validate()
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
