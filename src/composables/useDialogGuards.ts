/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";
import {ref} from "vue";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import type {FormContract, FormValidateResultType} from "@/types";
import {DomainUtils} from "@/domains/utils";
import {useAlert} from "@/composables/useAlert";
import {useBrowser} from "@/composables/useBrowser";

type ShowSystemNotificationFn = (
    _mod: string,
    _messageOrError: string | string[] | Error | unknown
) => Promise<number | void>;

export function useDialogGuards() {
    const {handleUserError} = useAlert();
    const {getMessage} = useBrowser();
    /** Global loading flag for the dialog. */
    const isLoading = ref<boolean>(false);
    /** Set of active operation identifiers. */
    const loadingOperations = ref<Set<string>>(new Set());
    /** Counter for generating unique operation IDs. */
    let operationCounter = 0;

    /**
     * Ensures that the database is connected before proceeding.
     * Shows a notification if not connected.
     *
     * @param isConnected - Current connection status.
     * @param showSystemNotification - Function to present user information consistently across the app.
     * @param errorMessage - Message to show if disconnected.
     * @returns A promise resolving to true if connected.
     */
    async function ensureConnected(
        isConnected: boolean,
        showSystemNotification: ShowSystemNotificationFn,
        errorMessage = "Database not connected"
    ): Promise<boolean> {
        if (!isConnected) {
            await showSystemNotification("Composables useDialogGuards", [
                getMessage("xx_db_connection_err"),
                errorMessage
            ]);
            return false;
        }
        return true;
    }

    /**
     * Executes an async operation while managing the loading state.
     * Tracks concurrent operations using unique IDs.
     *
     * @param operation - The async function to execute.
     * @param operationId - Optional identifier for the operation.
     * @returns A promise resolving to the operation result.
     */
    async function withLoading<T>(
        operation: () => Promise<T>,
        operationId?: string
    ): Promise<T> {
        const id = operationId || `op-${++operationCounter}`;
        isLoading.value = true;
        loadingOperations.value.add(id);

        try {
            return await operation();
        } finally {
            loadingOperations.value.delete(id);
            isLoading.value = loadingOperations.value.size > 0;
        }
    }

    /**
     * Triggers validation on a Vuetify form and returns detailed results.
     *
     * @param form - Reference to the Vuetify form instance.
     * @returns Validation status and any error messages.
     */
    async function validateForm(
        form: Ref<FormContract | null>
    ): Promise<FormValidateResultType> {
        try {
            if (form.value === null) {
                return {valid: false, errors: ["System error"]};
            }
            return form.value.validate();
        } catch {
            throw new AppError(
                ERROR_CODES.USE_DIALOG_GUARDS.A,
                ERROR_CATEGORY.VALIDATION,
                true
            );
        }
    }

    /**
     * Executes an async operation with automatic retries on failure.
     *
     * @param operation - The async function to retry.
     * @param options - Configuration for max retries, delay, and retry callback.
     * @returns A promise resolving to the operation result.
     * @throws AppError if all retries fail.
     */
    async function withRetry<T>(
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
                    throw new AppError(
                        ERROR_CODES.USE_DIALOG_GUARDS.B,
                        ERROR_CATEGORY.VALIDATION,
                        true
                    );
                }

                onRetry?.(attempt, err as Error);
                await new Promise((resolve) => setTimeout(resolve, delay * attempt));
            }
        }

        throw new AppError(
            ERROR_CODES.USE_DIALOG_GUARDS.C,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    /**
     * Centralized "save flow" for dialogs.
     * Encapsulates validation, connection check, loading state, and consistent error handling.
     *
     * @param options - Configuration for the submit operation.
     */
    async function submitGuard(options: {
        formRef?: Ref<FormContract | null>;
        isConnected?: boolean;
        connectionErrorMessage?: string;
        showSystemNotification: ShowSystemNotificationFn;
        operation: () => Promise<void>;
        onFinally?: () => void;
        errorContext?: string;
        errorTitle?: string;
    }): Promise<void> {
        const {
            formRef,
            isConnected,
            connectionErrorMessage,
            showSystemNotification,
            operation,
            onFinally,
            errorContext,
            errorTitle
        } = options;

        if (formRef && formRef.value) {
            const validation = await validateForm(formRef);
            if (!validation.valid) return;
        }

        if (isConnected !== undefined) {
            if (
                !(await ensureConnected(
                    isConnected,
                    showSystemNotification,
                    connectionErrorMessage
                ))
            )
                return;
        }

        await withLoading(async () => {
            try {
                await operation();
            } catch (err) {
                await handleUserError(errorTitle ?? "", err, {data: errorContext ?? ""});
            } finally {
                onFinally?.();
            }
        });
    }

    return {
        isLoading,
        loadingOperations,
        ensureConnected,
        validateForm,
        withLoading,
        withRetry,
        submitGuard
    };
}

DomainUtils.log("COMPOSABLES useDialogGuards");
