/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";
import {ref} from "vue";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import type {FormContract, FormValidateResultType} from "@/types";
import {log} from "@/domains/utils/utils";
import {alertService} from "@/services/alert";
import {browserService} from "@/services/browserService";

import {TaskService} from "@/services/taskService";

type ShowSystemNotificationFn = (
    _mod: string,
    _messageOrError: string | string[] | Error | unknown
) => Promise<number | void>;

export function useDialogGuards(translate?: (_key: string) => string) {
    /** Global loading flag for the dialog. */
    const isLoading = ref<boolean>(false);
    /** Set of active operation identifiers. */
    const loadingOperations = ref<Set<string>>(new Set());
    /** Counter for generating unique operation IDs. */
    let operationCounter = 0;
    const resolveMessage = (key: Parameters<typeof browserService.getMessage>[0]): string => {
        if (!translate) {
            return browserService.getMessage(key);
        }
        const translated = translate(key);
        return translated && translated !== key ? translated : browserService.getMessage(key);
    };

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
        try {
            TaskService.ensureConnected(isConnected, errorMessage);
            return true;
        } catch {
            await showSystemNotification("Composables useDialogGuards", [
                resolveMessage("xx_db_connection_err"),
                errorMessage
            ]);
            return false;
        }
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
            throw AppError(
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
        return TaskService.withRetry(operation, options);
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
                await alertService.feedbackError(errorTitle ?? "", err, {data: errorContext ?? ""});
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

log("COMPOSABLES useDialogGuards");


