/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { Ref } from "vue";
import { ref } from "vue";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES,
  serializeError
} from "@/domains/errors";
import type { FormInterface, FormValidateResultType } from "@/types";

/**
 * Composable providing common guards and wrappers for dialog operations.
 * Handles loading states, database connection checks, form validation, and retries.
 *
 * @module composables/useDialogGuards
 */
export function useDialogGuards() {
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
   * @param handleUserInfo - User info functionality.
   * @param errorMessage - Message to show if disconnected.
   * @returns A promise resolving to true if connected.
   */
  async function ensureConnected(
    isConnected: boolean,
    handleUserInfo: (_msg: string[]) => Promise<void>,
    errorMessage = "Database not connected"
  ): Promise<boolean> {
    if (!isConnected) {
      await handleUserInfo("notice", "useDialogGuards", "ensureConnected", { noticeLines: [errorMessage] });
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
    form: Ref<FormInterface | null>
  ): Promise<FormValidateResultType> {
    try {
      if (form.value === null) {
        return { valid: false, errors: ["System error"] };
      }
      return form.value.validate();
    } catch (err) {
      throw new AppError(
        ERROR_CODES.USE_DIALOG_GUARDS.A,
        ERROR_CATEGORY.VALIDATION,
        { input: serializeError(err) },
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
    const { maxRetries = 3, delay = 1000, onRetry } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        if (attempt === maxRetries) {
          throw new AppError(
            ERROR_CODES.USE_DIALOG_GUARDS.B,
            ERROR_CATEGORY.VALIDATION,
            { input: serializeError(err), attempt, maxRetries },
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
      { input: "retry_exhausted" },
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
    formRef?: Ref<FormInterface | null>;
    isConnected?: boolean;
    connectionErrorMessage?: string;
    handleUserInfo: (_msg: string[]) => Promise<void>;
    operation: () => Promise<void>;
    onFinally?: () => void;
    errorContext?: string;
    errorTitle?: string;
  }): Promise<void> {
    const {
      formRef,
      isConnected,
      connectionErrorMessage = "Database not connected",
      handleUserInfo,
      operation,
      onFinally
      //errorContext = 'USE_DIALOG_GUARD'
    } = options;

    if (formRef) {
      const validation = await validateForm(formRef);
      if (!validation.valid) return;
    }

    if (isConnected !== undefined) {
      if (!(await ensureConnected(isConnected, handleUserInfo, connectionErrorMessage)))
        return;
    }

    await withLoading(async () => {
      try {
        await operation();
      } catch (err) {
        if (err instanceof AppError) {
          throw err;
        }

        throw new AppError(
          ERROR_CODES.USE_DIALOG_GUARDS.B,
          ERROR_CATEGORY.VALIDATION,
          { input: serializeError(err), phase: "submitGuard" },
          true
        );
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
