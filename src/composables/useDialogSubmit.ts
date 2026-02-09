/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import type { BaseDialogForm } from "@/types";

/**
 * Configuration for the dialog submit operations.
 */
export interface DialogSubmitConfig {
  /** Reference to the BaseDialogForm component */
  dialogRef: Ref<BaseDialogForm | null>;
  /** The main operation to execute after validation and checks */
  operation: () => Promise<void>;
  /** Component name for logging (e.g., "AddBooking") */
  componentName: string;
  /** Translation key prefix for messages (e.g., "components.dialogs.addBooking") */
  i18nPrefix: string;
  /** Whether to check database connection (default: true) */
  checkConnection?: boolean;
  /** Whether to close the dialog on success (default: true) */
  closeOnSuccess?: boolean;
  /** Custom success message override */
  successMessage?: string;
  /** Custom error message override */
  errorMessage?: string;
  /** Callback after a successful operation */
  onSuccess?: () => void | Promise<void>;
  /** Callback after a failed operation */
  onError?: (_error: Error) => void | Promise<void>;
}

/**
 * Composable that standardizes the pattern across all dialogs.
 * Provides consistent validation, database checks, loading states, and user feedback.
 *
 * @module composables/useDialogSubmit
 * @example
 * ```ts
 * const { createSubmitHandler } = useDialogSubmit();
 *
 * const onClickOk = createSubmitHandler({
 *   dialogRef: baseDialogRef,
 *   operation: async () => {
 *     const data = mapFormToDb();
 *     await add(data);
 *   },
 *   componentName: "AddBooking",
 *   i18nPrefix: "components.dialogs.addBooking"
 * });
 * ```
 */
export function useDialogSubmit() {
  const { t } = useI18n();
  const { submitGuard } = useDialogGuards();
  const { handleUserNotice } = useBrowser();
  const runtime = useRuntimeStore();

  /**
   * Creates a standardized handler for dialogs.
   *
   * @param config - Configuration for the submit operation
   * @returns Async function that handles the complete flow
   */
  function createSubmitHandler(config: DialogSubmitConfig) {
    const {
      dialogRef,
      operation,
      componentName,
      i18nPrefix,
      checkConnection = true,
      closeOnSuccess = true,
      //successMessage,
      errorMessage,
      onSuccess,
      onError
    } = config;

    return async (): Promise<void> => {
      DomainUtils.log(`${componentName.toUpperCase()}: onClickOk`);

      await submitGuard({
        formRef: dialogRef.value?.formRef,
        isConnected: checkConnection
          ? databaseService.isConnected()
          : undefined,
        connectionErrorMessage:
          errorMessage || t(`${i18nPrefix}.messages.dbNotConnected`),
        handleUserNotice,
        errorContext: componentName.toUpperCase().replace(/\s/g, "_"),
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
          try {
            await operation();

            // Execute custom success callback
            if (onSuccess) {
              await onSuccess();
            }

            // Close the dialog if configured
            if (closeOnSuccess) {
              runtime.resetTeleport();
            }

            // Show success notification
            await handleUserNotice("success", componentName);
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            // Execute custom error callback
            if (onError) {
              await onError(err as Error);
            }

            // Show error notification
            await handleUserNotice("error", componentName);

            throw err;
          }
        }
      });
    };
  }

  /**
   * Creates a standardized handler for "Add" dialogs.
   * Includes automatic form reset on success.
   *
   * @param config - Configuration with additional reset callback
   * @returns Async function that handles the add operation
   */
  function createAddHandler(
    config: DialogSubmitConfig & { reset: () => void }
  ) {
    const { reset, ...baseConfig } = config;

    return createSubmitHandler({
      ...baseConfig,
      onSuccess: async () => {
        reset();
        if (baseConfig.onSuccess) {
          await baseConfig.onSuccess();
        }
      }
    });
  }

  /**
   * Creates a standardized handler for "Update" dialogs.
   * Includes menu color reset on success.
   *
   * @param config - Configuration for update operation
   * @returns Async function that handles the update operation
   */
  function createUpdateHandler(config: DialogSubmitConfig) {
    return createSubmitHandler({
      ...config,
      onSuccess: async () => {
        runtime.resetOptionsMenuColors();
        if (config.onSuccess) {
          await config.onSuccess();
        }
      }
    });
  }

  return {
    createSubmitHandler,
    createAddHandler,
    createUpdateHandler
  };
}

DomainUtils.log("COMPOSABLE useDialogSubmit");
