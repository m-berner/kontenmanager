/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App} from "vue";

import {log} from "@/domain/utils/utils";

/**
 * Last-resort reporter for uncaught failures.
 *
 * Deliberately writes to `console.error` directly instead of going through
 * `log()`. `log()` is silent unless `MODE === "development"` or
 * `VITE_DEBUG_LOGS` is set — and because installing `app.config.errorHandler`
 * *suppresses* Vue's own default console reporting, routing these through
 * `log()` meant a release build emitted nothing at all for a component error
 * or an unhandled rejection: strictly less visibility than not installing the
 * handler. These two sinks are the only thing standing between a production
 * failure and complete silence, so they always report.
 */
/* eslint-disable no-console */
function reportAlways(label: string, detail: unknown, level: "error" | "warn"): void {
    if (level === "error") {
        console.error(label, detail);
    } else {
        console.warn(label, detail);
    }
}

/* eslint-enable no-console */

export function installUnhandledRejectionLogger(context: string): void {
    window.addEventListener("unhandledrejection", (e) => {
        reportAlways(`ENTRYPOINTS ${context}: unhandledrejection`, {reason: e.reason}, "error");
    });
}

export function installVueGlobalHandlers(app: App, context: string): void {
    app.config.errorHandler = (err: unknown, _instance, info): void => {
        const message = err instanceof Error ? err.message : String(err);
        reportAlways(
            `ENTRYPOINTS ${context}: errorHandler`,
            {message, info, stack: (err as Error)?.stack},
            "error"
        );
    };

    // Vue only calls warnHandler in development builds, so this one can stay on
    // the debug-gated logger without hiding anything from production.
    app.config.warnHandler = (msg: string, _instance, trace): void => {
        log(`ENTRYPOINTS ${context}: warnHandler`, {msg, trace}, "warn");
    };
}
