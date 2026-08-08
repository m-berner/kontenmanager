/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domain/errors";
import type {HandleUserAlertOptions} from "@/domain/types";
import {log} from "@/domain/utils/utils";

const ALERT_INFO = {
    RATE_LIMIT_MS: 1500,
    // Generous upper bound on how long a rate-limit entry can matter.
    // A hard cap on the map's size as a backstop — keeps recentMessages from
    // growing unbounded over a long session full of distinct dynamic
    // messages (per-item errors, URLs, ISINs).
    MAX_MESSAGE_AGE_MS: 60_000,
    MAX_TRACKED_MESSAGES: 200,
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
     * This keeps the service layer independent of Pinia/store imports.
     */
    function configureAlertSink(factory: (() => AlertSink) | undefined): void {
        alertSinkFactory = factory;
    }

    /**
     * Resolves the sink, tolerating its absence.
     *
     * Correct for `feedbackInfo`/`feedbackWarning`/`feedbackError`, which return
     * `void` and whose callers never branch on the result — a message that
     * cannot be shown is simply not shown. **Not** correct for a confirmation;
     * see {@link getAlertSinkOrThrow}.
     */
    function getAlertSinkSafe(): AlertSink | null {
        try {
            return alertSinkFactory?.() ?? null;
        } catch (err) {
            // Logged rather than swallowed outright: the bare catch discarded
            // the one piece of information that would explain why the sink is
            // unavailable.
            log("SERVICES alert: alert sink factory threw", serializeError(err), "error");
            return null;
        }
    }

    /**
     * Resolves the sink for a confirmation, throwing when it cannot be had.
     *
     * A confirmation is a *question*. "Could not ask" is not an answer, and it
     * is certainly not "the user said no" — but that is what the previous
     * `return undefined` amounted to, because every call site coerces with
     * `!!(await feedbackConfirm(...))`, which collapses `undefined` to `false`.
     * An import, an export or a delete then silently did nothing, with no dialog
     * and no explanation. This function's sibling `feedbackConfirm` already
     * carries that exact reasoning about a *different* branch (the rate limiter,
     * which was removed for it); the no-sink path had the same consequence and
     * was left as-is.
     *
     * `AlertPort.feedbackConfirm` is typed `Promise<boolean | void>`, so the
     * third state is already in the contract — it was the consumers that erased
     * it. Throwing makes it one they cannot silently absorb.
     */
    function getAlertSinkOrThrow(): AlertSink {
        let sink: AlertSink | undefined;
        try {
            sink = alertSinkFactory?.();
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.STORES.ALERTS.SINK_UNAVAILABLE.CODE,
                ERROR_CATEGORY.STORE,
                false,
                {originalError: serializeError(err)}
            );
        }

        if (!sink) {
            throw appError(
                ERROR_DEFINITIONS.STORES.ALERTS.SINK_UNAVAILABLE.CODE,
                ERROR_CATEGORY.STORE,
                false,
                {reason: "No alert sink configured"}
            );
        }

        return sink;
    }

    /**
     * Removes stale/excess entries from recentMessages so it can't grow
     * unbounded over a long session.
     */
    function pruneRecentMessages(now: number): void {
        for (const [trackedKey, timestamp] of recentMessages) {
            if (now - timestamp >= ALERT_INFO.MAX_MESSAGE_AGE_MS) {
                recentMessages.delete(trackedKey);
            }
        }
        while (recentMessages.size > ALERT_INFO.MAX_TRACKED_MESSAGES) {
            const oldestKey = recentMessages.keys().next().value;
            if (oldestKey === undefined) break;
            recentMessages.delete(oldestKey);
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
        pruneRecentMessages(now);
        const last = recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return true;
        }
        // Delete before re-inserting: Map.set() on an existing key updates its
        // value in place without moving it to the end of iteration order, which
        // would make pruneRecentMessages' "oldest key" eviction target
        // frequently-repeated (i.e. still relevant) messages ahead of truly
        // stale ones.
        recentMessages.delete(key);
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
        const duration = options?.duration !== undefined ? options.duration : ALERT_INFO.DURATIONS.WARNING;
        return alerts.warning(title, message, duration);
    }

    async function feedbackConfirm(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<boolean | void> {
        const message = normalizedError(error);
        // Deliberately NOT rate-limited, unlike the notification helpers above.
        // A confirmation is a request for input, not a fire-and-forget message:
        // suppressing it returned `undefined`, and every caller coerces that to
        // a boolean (`!!(await feedbackConfirm(...))`), so a suppressed dialog
        // was indistinguishable from the user pressing Cancel. Within the 1.5 s
        // window that silently aborted an import or export — no dialog, no
        // explanation — and made HomeContent's Ctrl+Alt+R reset a no-op.
        // Re-entrancy is already handled one layer down: alerts.confirm()
        // rejects when a confirmation dialog is already open.
        //
        // `getAlertSinkOrThrow`, not the `Safe` variant: an unavailable sink is
        // a failure to ask, not a "no". See that function's comment. Call sites
        // distinguish the two rejections with `isConfirmDialogBusyError`.
        const alerts = getAlertSinkOrThrow();
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

        // Logged BEFORE the rate-limit check, and unconditionally. Rate limiting
        // is about not spamming the user with the same toast; suppressing the
        // diagnostic record too was a side effect. Two failures 200 ms apart
        // share a message but can carry different `data`, `correlationId` and
        // `errorStack`, and only the first survived — exactly the context needed
        // to tell a burst of distinct failures from one repeated one.
        log(
            `SERVICES alert ${title}: ${message}`.trim(),
            {
                ...((data as Record<string, unknown>) || {}),
                correlationId,
                errorStack
            },
            logLevel
        );

        if (isRateLimited("error", title, message, options)) {
            return;
        }

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
