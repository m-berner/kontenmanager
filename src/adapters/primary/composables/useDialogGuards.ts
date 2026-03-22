/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {Ref} from "vue";
import {ref} from "vue";

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import type {FormContract, FormValidateResultType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import type {BrowserService} from "@/adapters/secondary/types";

type ShowSystemNotificationFn = (
    _mod: string,
    _messageOrError: string | string[] | Error | unknown
) => Promise<number | void>;

/**
 * Provides utility functions for managing dialog guards, including connection checks, form validation,
 * loading state management, and centralized error handling for dialog interactions.
 *
 * @param translate - Optional translation function to resolve localized messages. If not provided,
 *                    falls back to the default message resolver.
 * @returns An object containing utility methods and state references:
 *         - `isLoading`: A reactive boolean indicating whether any operation is currently loading.
 *         - `loadingOperations`: A reactive set tracking active operation identifiers.
 *         - `ensureConnected`: Ensures the database is connected, with error notifications if disconnected.
 *         - `validateForm`: Validates a Vuetify form instance and returns the validation result.
 *         - `withLoading`: Executes an async operation while managing its loading state.
 *         - `withRetry`: Executes an async operation with configurable automatic retry logic.
 *         - `submitGuard`: Encapsulates a "save flow" for dialogs with validation, connection check,
 *                        loading state, and consistent error handling.
 */
type DialogGuardsDeps = {
    alertService: {
        feedbackInfo?: (
            _title: string,
            _msg: unknown,
            _options?: unknown
        ) => Promise<unknown> | unknown;
        feedbackWarning?: (
            _title: string,
            _msg: unknown,
            _options?: unknown
        ) => Promise<unknown> | unknown;
        feedbackConfirm?: (
            _title: string,
            _msg: unknown,
            _options?: unknown
        ) => Promise<unknown> | unknown;
        feedbackError: (
            _title: string,
            _msg: unknown,
            _options: unknown
        ) => Promise<unknown> | unknown;
    };
    browserService: Pick<BrowserService, "getMessage">;
    taskService: {
        withRetry: <T>(
            operation: () => Promise<T>,
            options?: {
                maxRetries?: number;
                delay?: number;
                onRetry?: (_attempt: number, _error: Error) => void;
            }
        ) => Promise<T>;
        ensureConnected: (_isConnected: boolean, _errorMessage?: string) => void;
    };
};

export function useDialogGuards(
    translate?: (_key: string) => string,
    deps?: DialogGuardsDeps
) {
    const {alertService, browserService, taskService} = deps ?? useServices();

    /** Global loading flag for the dialog. */
    const isLoading = ref<boolean>(false);
    /** Set of active operation identifiers. */
    const loadingOperations = ref<Set<string>>(new Set());
    /** Counter for generating unique operation IDs. */
    let operationCounter = 0;
    /**
     * Resolves the message for a given key by attempting to retrieve a translated version
     * if translation is enabled. If no translation is available or the translation matches
     * the key, the default message from the browser service is returned.
     *
     * @param key - The key identifying the message to be resolved.
     * @returns The resolved message, either translated or the default message from the browser service.
     */
    const resolveMessage = (key: Parameters<BrowserService["getMessage"]>[0]): string => {
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
        errorMessage = "Database is not connected"
    ): Promise<boolean> {
        try {
            taskService.ensureConnected(isConnected, errorMessage);
            return true;
        } catch (err) {
            log(
                "COMPOSABLES useDialogGuards: ensureConnected",
                {error: serializeError(err)},
                "warn"
            );
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
            return await form.value.validate();
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.USE_DIALOG_GUARDS.A.CODE,
                ERROR_CATEGORY.VALIDATION,
                true,
                {originalError: serializeError(err)}
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
        return taskService.withRetry(operation, options);
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
