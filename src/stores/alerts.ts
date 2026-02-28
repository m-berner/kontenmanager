/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {ConfirmationDialogData, VisibleAlertData} from "@/types";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {DomainUtils} from "@/domains/utils";

type VisualAlertType = "error" | "success" | "warning" | "info";

function createDefaultAlert(): VisibleAlertData {
    return {
        id: -1,
        type: undefined,
        title: "",
        message: ""
    };
}

function createDefaultConfirmation(): ConfirmationDialogData {
    return {
        id: -1,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "warning",
        resolve: () => {
        },
        reject: () => {
        }
    };
}

/**
 * Counter for generating unique alert IDs.
 * Using a counter instead of Date.now() + Math.random() prevents ID collisions.
 */
let alertIdCounter = 0;

/**
 * Generates a unique ID for alerts and confirmation dialogs.
 *
 * @returns {number} Unique incrementing ID
 */
function generateUniqueId(): number {
    return ++alertIdCounter;
}

/**
 * Pinia store managing global application alerts and confirmation dialogs.
 * Supports queued alerts with optional auto-dismiss functionality.
 *
 * @module stores/alerts
 * @returns Reactive and non-reactive alert state, computed aggregations,
 * and methods to mutate and enrich alerts.
 */
export const useAlertStore = defineStore("alerts", () => {
    /** Queue of all pending alerts. */
    const alertQueue = ref<VisibleAlertData[]>([]);
    /** The alert currently being displayed. */
    const currentAlert = ref<VisibleAlertData>(createDefaultAlert());
    /** The active confirmation dialog configuration. */
    const confirmationDialog = ref<ConfirmationDialogData>(
        createDefaultConfirmation()
    );
    /** Active auto-dismiss timeouts mapped by alert ID. */
    const timeouts = ref<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    /** Number of alerts waiting in the queue. */
    const pendingCount = computed(() => Math.max(0, alertQueue.value.length - 1));
    /** Whether the alert overlay should be visible. */
    const showOverlay = computed(() => currentAlert.value.id > -1);
    /** Whether the confirmation dialog should be visible. */
    const showConfirmation = computed(() => confirmationDialog.value.id > -1);
    /** Current alert severity type. */
    const alertType = computed(() => currentAlert.value?.type || "info");
    /** Current alert title. */
    const alertTitle = computed(() => currentAlert.value?.title || "");
    /** Current alert message content. */
    const alertMessage = computed(() => currentAlert.value?.message || "");

    function resetConfirmationDialog(): void {
        confirmationDialog.value = createDefaultConfirmation();
    }

    /**
     * Clears a specific timeout and removes it from the timeouts map.
     *
     * @param id - Alert ID associated with the timeout.
     */
    function clearAlertTimeout(id: number): void {
        const timeoutId = timeouts.value.get(id);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeouts.value.delete(id);
        }
    }

    /**
     * Displays a new alert with optional auto-dismiss.
     *
     * @param type - Alert severity type.
     * @param title - Alert title.
     * @param message - Alert message content.
     * @param duration - Optional auto-dismiss duration in milliseconds.
     * @returns Unique alert ID.
     */
    function showAlert(
        type: VisualAlertType | undefined,
        title: string,
        message: string,
        duration: number | null = null
    ): number {
        const id = generateUniqueId();
        const alert: VisibleAlertData = {id, type, title, message};

        alertQueue.value.push(alert);

        // Show immediately if no alert is currently displayed
        if (currentAlert.value.id === -1) {
            showNext();
        }

        // Set up auto-dismiss if duration is specified
        if (duration !== null && duration > 0) {
            const timeoutId = setTimeout(() => {
                dismissAlert(id);
            }, duration);
            timeouts.value.set(id, timeoutId);
        }

        return id;
    }

    /**
     * Shows the next alert in the queue.
     * Sets currentAlert to the first queued or resets to default if the queue is empty.
     */
    function showNext(): void {
        if (alertQueue.value.length > 0) {
            currentAlert.value = {...alertQueue.value[0]};
        } else {
            currentAlert.value = createDefaultAlert();
        }
    }

    /**
     * Dismisses a specific alert by ID.
     * Clears associated timeout and shows next alert if dismissed alert was currently displayed.
     *
     * @param id - Alert ID to dismiss.
     */
    function dismissAlert(id: number | undefined): void {
        if (id === undefined) {
            DomainUtils.log(
                "STORES alert: Attempted to dismiss alert with undefined ID",
                null,
                "warn"
            );
            return;
        }

        const index = alertQueue.value.findIndex((alert) => alert.id === id);

        if (index === -1) {
            DomainUtils.log("STORES alert: Alert not found for dismissal", id, "warn");
            return;
        }

        // Clear any pending timeout for this alert
        clearAlertTimeout(id);

        const wasCurrentAlert = index === 0;
        alertQueue.value.splice(index, 1);

        // If the dismissed alert was currently displayed, show the next one
        if (wasCurrentAlert) {
            showNext();
        }
    }

    /**
     * Convenience method for a success alert.
     *
     * @param title - Alert title.
     * @param message - Alert message.
     * @param duration - Auto-dismiss duration.
     * @returns Alert ID.
     */
    function success(
        title: string,
        message: string,
        duration: number | null = null
    ): number {
        return showAlert("success", title, message, duration);
    }

    /**
     * Convenience method for an error alert.
     *
     * @param title - Alert title.
     * @param message - Alert message.
     * @param duration - Auto-dismiss duration.
     * @returns Alert ID.
     */
    function error(
        title: string,
        message: string,
        duration: number | null = null
    ): number {
        return showAlert("error", title, message, duration);
    }

    /**
     * Convenience method for a warning alert.
     *
     * @param title - Alert title.
     * @param message - Alert message.
     * @param duration - Auto-dismiss duration.
     * @returns Alert ID.
     */
    function warning(
        title: string,
        message: string,
        duration: number | null = null
    ): number {
        return showAlert("warning", title, message, duration);
    }

    /**
     * Convenience method for an info alert.
     *
     * @param title - Alert title.
     * @param message - Alert message.
     * @param duration - Auto-dismiss duration.
     * @returns Alert ID.
     */
    function info(
        title: string,
        message: string,
        duration: number | null = null
    ): number {
        return showAlert("info", title, message, duration);
    }

    /**
     * Shows a confirmation dialog and returns a promise.
     *
     * @param title - Dialog title.
     * @param message - Dialog message.
     * @param options - Custom text for confirm/cancel buttons and type.
     * @returns Promise that resolves to true on confirmation, false on cancel.
     */
    function confirm(
        title: string,
        message: string,
        options?: {
            confirmText?: string;
            cancelText?: string;
            type?: "error" | "success" | "warning" | "info";
        }
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Check if a confirmation dialog is already active
            if (confirmationDialog.value.id > -1) {
                DomainUtils.log(
                    "STORES alert: Confirmation dialog already active",
                    null,
                    "warn"
                );
                reject(new Error("Confirmation dialog already active"));
                return;
            }

            const id = generateUniqueId();
            confirmationDialog.value = {
                id,
                title,
                message,
                confirmText: options?.confirmText || "Confirm",
                cancelText: options?.cancelText || "Cancel",
                type: options?.type || "warning",
                resolve: () => {
                    resetConfirmationDialog();
                    resolve(true);
                },
                reject: () => {
                    resetConfirmationDialog();
                    resolve(false);
                }
            };
        });
    }

    /**
     * Handles the confirmation button click in the confirmation dialog.
     */
    function handleConfirm(): void {
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.resolve) {
            try {
                confirmationDialog.value.resolve();
            } catch (err) {
                DomainUtils.log("STORES alert: Error in confirm handler", err, "error");
                resetConfirmationDialog();
            }
        }
    }

    /**
     * Handles the cancel button click in the confirmation dialog.
     */
    function handleCancel(): void {
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.reject) {
            try {
                confirmationDialog.value.reject();
            } catch (err) {
                DomainUtils.log("STORES alert: Error in cancel handler", err, "error");
                resetConfirmationDialog();
            }
        }
    }

    /**
     * Clears all alerts and confirmation dialogs.
     * Cancels all pending timeouts and resets the state to defaults.
     */
    function clearAll(): void {
        // Clear all pending timeouts
        timeouts.value.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        timeouts.value.clear();

        // Clear alerts
        alertQueue.value = [];
        currentAlert.value = createDefaultAlert();

        // Cancel confirmation dialog if active
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.reject) {
            try {
                confirmationDialog.value.reject();
            } catch (err) {
                DomainUtils.log(
                    "STORES alert: Error clearing confirmation dialog",
                    err,
                    "warn"
                );
            }
        }
        resetConfirmationDialog();
    }

    /**
     * Cleanup function to be called when the store is no longer needed.
     * Clears all timeouts to prevent memory leaks.
     */
    function cleanup(): void {
        clearAll();
    }

    return {
        currentAlert,
        confirmationDialog,
        pendingCount,
        showOverlay,
        showConfirmation,
        alertType,
        alertTitle,
        alertMessage,
        showAlert,
        dismissAlert,
        success,
        error,
        warning,
        info,
        confirm,
        handleConfirm,
        handleCancel,
        clearAll,
        cleanup
    };
});

DomainUtils.log("STORES alerts");
