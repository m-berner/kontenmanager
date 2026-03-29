/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {isAppError} from "@/domain/errors";
import type {HandleUserAlertOptions} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const ALERT_INFO = {
    RATE_LIMIT_MS: 1500,
    DURATIONS: {
        INFO: 4000,
        WARNING: 4000,
        ERROR: null
    }
}

/**
 * Public alert adapter interface for consumers (components, composables, stores).
 * Deliberately excludes `configureAlertSink`, which is an infrastructure-level
 * setup concern and must not be callable from UI code.
 */
export type AlertAdapter = {
    feedbackInfo: (_title: string, _msg: unknown, _options?: HandleUserAlertOptions) => Promise<number | void>;
    feedbackWarning: (_title: string, _msg: unknown, _options?: HandleUserAlertOptions) => Promise<number | void>;
    feedbackConfirm: (_title: string, _msg: unknown, _options?: HandleUserAlertOptions) => Promise<boolean | void>;
    feedbackError: (_title: string, _msg: unknown, _options: HandleUserAlertOptions) => Promise<number | void>;
};

export type AlertSink = {
    info: (_title: string, _message: string, _duration: number | null) => number;
    warning: (_title: string, _message: string, _duration: number | null) => number;
    error: (_title: string, _message: string, _duration: number | null) => number;
    confirm: (
        _title: string,
        _message: string,
        _confirm?: HandleUserAlertOptions["confirm"]
    ) => Promise<boolean>;
};

/**
 * Checks if an alert should be suppressed based on rate limiting.
 *
 * @returns True if the alert is rate-limited.
 */
export function createAlertAdapter() {
    /**
     * Tracks the last shown timestamp for each alert signature.
     */
    const recentMessages = new Map<string, number>();

    let alertSinkFactory: (() => AlertSink) | undefined;

    /**
     * Registers the alert sink factory used to show alerts to the user.
     * This keeps the services layer independent of Pinia/store imports.
     */
    function configureAlertSink(factory: (() => AlertSink) | undefined): void {
        alertSinkFactory = factory;
    }

    function getAlertSinkSafe(): AlertSink | null {
        try {
            return alertSinkFactory?.() ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Checks if an alert should be suppressed based on rate limiting.
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

    async function feedbackInfo(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = normalizedError(error);
        if (isRateLimited("info", title, message, options)) {
            return;
        }

        const alerts = getAlertSinkSafe();
        if (!alerts) return;
        const duration = options?.duration !== undefined ? options.duration : ALERT_INFO.DURATIONS.INFO;
        return alerts.info(title, message, duration);
    }

    async function feedbackWarning(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = normalizedError(error);
        if (isRateLimited("warn", title, message, options)) {
            return;
        }

        const alerts = getAlertSinkSafe();
        if (!alerts) return;
        const duration = options?.duration ?? ALERT_INFO.DURATIONS.WARNING;
        return alerts.warning(title, message, duration);
    }

    async function feedbackConfirm(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<boolean | void> {
        const message = normalizedError(error);
        if (isRateLimited("confirm", title, message, options)) {
            return;
        }

        const alerts = getAlertSinkSafe();
        if (!alerts) return;
        return await alerts.confirm(title, message, options?.confirm);
    }

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

        const alerts = getAlertSinkSafe();
        if (!alerts) return;
        const duration = options?.duration ?? ALERT_INFO.DURATIONS.ERROR;
        return alerts.error(title, message, duration);
    }

    return {
        configureAlertSink,
        feedbackInfo,
        feedbackWarning,
        feedbackConfirm,
        feedbackError
    };
}

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
