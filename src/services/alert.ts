/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {useAlertsStore} from "@/stores/alerts";
import type {HandleUserAlertOptions} from "@/types";
import {log} from "@/domains/utils/utils";
import {isAppError} from "@/domains/errors";

const ALERT_INFO = {
    RATE_LIMIT_MS: 1500,
    DURATIONS: {
        INFO: 4000,
        WARNING: 4000,
        ERROR: null
    }
}

/**
 * Tracks the last shown timestamp for each alert signature.
 */
const recentMessages = new Map<string, number>();

/**
 * Normalizes various error types into a single string message.
 *
 * @param error - The error to normalize (string, Error, AppError, etc.).
 * @returns A newline-separated string of error messages.
 */
function normalizedError(error: string | Error | unknown): string {
    let messages: string[] = [];
    if (isAppError(error)) {
        messages = [`${error.category}`, error.message];
    } else if (error instanceof Error) {
        messages = [error.name, error.message];
    } else if (typeof error === "string") {
        messages = [error];
    } else if (Array.isArray(error)) {
        messages = [...error];
    } else {
        messages = ["Unknown error"];
    }
    return messages.join("\n");
}

/**
 * Checks if an alert should be suppressed based on rate limiting.
 *
 * @param kind - The type of alert.
 * @param title - The alert title.
 * @param message - The alert message.
 * @param options - Alert options including custom rate limits.
 * @returns True if the alert is rate-limited.
 */
function isRateLimited(
    kind: "info" | "warn" | "confirm" | "error",
    title: string,
    message: string,
    options?: HandleUserAlertOptions
): boolean {
    const rateLimitMs = options?.rateLimitMs ?? ALERT_INFO.RATE_LIMIT_MS;
    const key = `${kind}|${title}|${message}`;
    const now = Date.now();
    const last = recentMessages.get(key) ?? 0;
    if (rateLimitMs > 0 && now - last < rateLimitMs) {
        return true;
    }
    recentMessages.set(key, now);
    return false;
}

/**
 * Displays an informational feedback message to the user.
 *
 * @param title - Alert title.
 * @param error - The message or error object to display.
 * @param options - Additional display options.
 * @returns A promise that resolves when the alert is handled.
 */
async function feedbackInfo(
    title: string,
    error: string | string[] | Error | unknown,
    options?: HandleUserAlertOptions
): Promise<number | void> {
    const message = normalizedError(error);
    if (isRateLimited("info", title, message, options)) {
        return;
    }

    const alerts = useAlertsStore();
    const duration = options?.duration ?? ALERT_INFO.DURATIONS.INFO;
    return alerts.info(title, message, duration);
}

/**
 * Displays a warning feedback message to the user.
 *
 * @param title - Alert title.
 * @param error - The message or error object to display.
 * @param options - Additional display options.
 * @returns A promise that resolves when the alert is handled.
 */
async function feedbackWarning(
    title: string,
    error: string | string[] | Error | unknown,
    options?: HandleUserAlertOptions
): Promise<number | void> {
    const message = normalizedError(error);
    if (isRateLimited("warn", title, message, options)) {
        return;
    }

    const alerts = useAlertsStore();
    const duration = options?.duration ?? ALERT_INFO.DURATIONS.WARNING;
    return alerts.warning(title, message, duration);
}

/**
 * Displays a confirmation dialog to the user.
 *
 * @param title - Alert title.
 * @param error - The message or error object to display.
 * @param options - Additional display options.
 * @returns A promise resolving to true if confirmed, false if canceled.
 */
async function feedbackConfirm(
    title: string,
    error: string | string[] | Error | unknown,
    options?: HandleUserAlertOptions
): Promise<boolean | void> {
    const message = normalizedError(error);
    if (isRateLimited("confirm", title, message, options)) {
        return;
    }

    const alerts = useAlertsStore();
    return await alerts.confirm(title, message, options?.confirm);
}

/**
 * Displays an error feedback message to the user and logs it to the console.
 *
 * @param title - Alert title.
 * @param error - The message or error object to display.
 * @param options - Additional display and logging options.
 * @returns A promise that resolves when the alert is handled.
 */
async function feedbackError(
    title: string,
    error: string | string[] | Error | unknown,
    options: HandleUserAlertOptions
): Promise<number | void> {
    const {data, logLevel = "log", correlationId} = options;
    let errorStack: string | undefined;
    if (error instanceof Error) {
        errorStack = error.stack;
    }
    const message = normalizedError(error);
    if (isRateLimited("error", title, message, options)) {
        return;
    }

    log(
        `SERVICES alert ${title}: ${message}`.trim(),
        {
            ...((data as Record<string, unknown>) || {}),
            correlationId,
            errorStack
        },
        logLevel
    );

    const alerts = useAlertsStore();
    const duration = options?.duration ?? ALERT_INFO.DURATIONS.ERROR;
    return alerts.error(title, message, duration);
}

// Export as a singleton instance
export const alertService = {
    feedbackInfo,
    feedbackWarning,
    feedbackConfirm,
    feedbackError
};
