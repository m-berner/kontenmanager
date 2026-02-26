/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {useAlertStore} from "@/stores/alerts";
import {DEFAULTS} from "@/configs/defaults";
import type {HandleUserAlertOptions} from "@/types";
import {DomainUtils} from "@/domains/utils";
import {AppError} from "@/domains/errors";

/**
 * A Map object that stores recent messages with their corresponding timestamps.
 * The key represents the unique identifier of a message (e.g., message ID or user ID),
 * and the value represents the timestamp (e.g., in milliseconds or seconds since the epoch)
 * when the message was last recorded.
 *
 * This data structure can be used for tracking and managing messages
 * based on their recency.
 */
const recentMessages = new Map<string, number>();

/**
 * Normalizes an error into a formatted string message.
 *
 * Converts various error formats into a standardized, readable string representation.
 * Handles instances of custom `AppError`, native `Error`, strings, arrays, and unknown types.
 *
 * @param {string | Error | unknown} error - The error object to be normalized.
 * Can be an instance of `AppError`, a native `Error`, a string, an array of strings, or any other unknown type.
 * @returns {string} A joined and formatted string containing the error message(s).
 */
const normalizedError = (error: string | Error | unknown): string => {
    let messages: string[] = [];
    if (error instanceof AppError) {
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
};

/**
 * Composable that centralizes user feedback mechanisms across the app.
 * Uses the global alert overlay (including confirmation dialogs)
 *
 * @module composables/useAlert
 */
export function useAlert() {
    /**
     * Presents a message to the user using to inform.
     *
     * @param title - Contextual title or source of the message.
     * @param error - The Error object.
     * @param options - Extended options for alerts and delays.
     * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
     */
    async function handleUserInfo(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = normalizedError(error);

        // Rate limit identical messages per kind/title/message
        const rateLimitMs =
            options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `info|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);

        const alerts = useAlertStore();
        const duration = options?.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
        return alerts.info(title, message, duration);
    }

    /**
     * Presents a message to the user using to warn.
     *
     * @param title - Contextual title or source of the message.
     * @param error - The Error object.
     * @param options - Extended options for alerts and delays.
     * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
     */
    async function handleUserWarning(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = normalizedError(error);

        // Rate limit identical messages per kind/title/message
        const rateLimitMs =
            options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `warn|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);

        const alerts = useAlertStore();
        const duration = options?.duration ?? DEFAULTS.USER_INFO.DURATION.INFO;
        return alerts.warning(title, message, duration);
    }

    /**
     * Presents a message to the user using to confirm.
     *
     * @param title - Contextual title or source of the message.
     * @param error - The Error object.
     * @param options - Extended options for alerts and delays.
     * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
     */
    async function handleUserConfirm(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<boolean | void> {
        const message = normalizedError(error);

        // Rate limit identical messages per kind/title/message
        const rateLimitMs =
            options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `confirm|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);

        const alerts = useAlertStore();
        return await alerts.confirm(title, message, options?.confirm);
    }

    /**
     * Presents a message to the user to show an error.
     *
     * @param title - Contextual title or source of the message.
     * @param error - The Error object.
     * @param options - Extended options for alerts and delays.
     * @returns A promise that may resolve to a boolean for `confirm` alerts, a number (alert ID), or void.
     */
    async function handleUserError(
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

        // Rate limit identical messages per kind/title/message
        const rateLimitMs =
            options?.rateLimitMs ?? DEFAULTS.USER_INFO.RATE_LIMIT_MS;
        const key = `error|${title}|${message}`;
        const now = Date.now();
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return;
        }
        recentMessages.set(key, now);

        // Also report to the console
        DomainUtils.log(
            `COMPOSABLES useAlert ${title}: ${message}`.trim(),
            {
                ...((data as Record<string, unknown>) || {}),
                correlationId,
                errorStack
            },
            logLevel
        );

        const alerts = useAlertStore();
        const duration =
            options?.duration ?? DEFAULTS.USER_INFO.DURATION.ERROR;
        return alerts.error(title, message, duration);
    }

    return {
        handleUserInfo,
        handleUserWarning,
        handleUserConfirm,
        handleUserError
    };
}

DomainUtils.log("COMPOSABLES useAlert");
