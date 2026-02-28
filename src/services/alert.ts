/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {useAlertStore} from "@/stores/alerts";
import type {HandleUserAlertOptions} from "@/types";
import {DomainUtils} from "@/domains/utils";
import {AppError} from "@/domains/errors";

const ALERT_INFO = {
    RATE_LIMIT_MS: 1500,
    DURATIONS: {
        INFO: 4000,
        WARNING: 4000,
        ERROR: null
    }
}

/**
 * Service that centralizes user-facing alert behavior
 * (normalization, default durations, logging, and rate limiting).
 */
class AlertServiceImpl {
    /**
     * Tracks the last shown timestamp for each alert signature.
     */
    private recentMessages = new Map<string, number>();

    private normalizedError(error: string | Error | unknown): string {
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
    }

    private isRateLimited(
        kind: "info" | "warn" | "confirm" | "error",
        title: string,
        message: string,
        options?: HandleUserAlertOptions
    ): boolean {
        const rateLimitMs = options?.rateLimitMs ?? ALERT_INFO.RATE_LIMIT_MS;
        const key = `${kind}|${title}|${message}`;
        const now = Date.now();
        const last = this.recentMessages.get(key) ?? 0;
        if (rateLimitMs > 0 && now - last < rateLimitMs) {
            return true;
        }
        this.recentMessages.set(key, now);
        return false;
    }

    async handleUserInfo(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = this.normalizedError(error);
        if (this.isRateLimited("info", title, message, options)) {
            return;
        }

        const alerts = useAlertStore();
        const duration = options?.duration ?? ALERT_INFO.DURATIONS.INFO;
        return alerts.info(title, message, duration);
    }

    async handleUserWarning(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<number | void> {
        const message = this.normalizedError(error);
        if (this.isRateLimited("warn", title, message, options)) {
            return;
        }

        const alerts = useAlertStore();
        const duration = options?.duration ?? ALERT_INFO.DURATIONS.WARNING;
        return alerts.warning(title, message, duration);
    }

    async handleUserConfirm(
        title: string,
        error: string | string[] | Error | unknown,
        options?: HandleUserAlertOptions
    ): Promise<boolean | void> {
        const message = this.normalizedError(error);
        if (this.isRateLimited("confirm", title, message, options)) {
            return;
        }

        const alerts = useAlertStore();
        return await alerts.confirm(title, message, options?.confirm);
    }

    async handleUserError(
        title: string,
        error: string | string[] | Error | unknown,
        options: HandleUserAlertOptions
    ): Promise<number | void> {
        const {data, logLevel = "log", correlationId} = options;
        let errorStack: string | undefined;
        if (error instanceof Error) {
            errorStack = error.stack;
        }
        const message = this.normalizedError(error);
        if (this.isRateLimited("error", title, message, options)) {
            return;
        }

        DomainUtils.log(
            `SERVICES alert ${title}: ${message}`.trim(),
            {
                ...((data as Record<string, unknown>) || {}),
                correlationId,
                errorStack
            },
            logLevel
        );

        const alerts = useAlertStore();
        const duration = options?.duration ?? ALERT_INFO.DURATIONS.ERROR;
        return alerts.error(title, message, duration);
    }
}

export const alertService = new AlertServiceImpl();
export {AlertServiceImpl as AlertService};

DomainUtils.log("SERVICES alert");
