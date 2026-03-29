/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {App} from "vue";

import {log} from "@/domain/utils/utils";

export function installUnhandledRejectionLogger(context: string): void {
    window.addEventListener("unhandledrejection", (e) => {
        log(`ENTRYPOINTS ${context}: unhandledrejection`, {reason: e.reason}, "error");
    });
}

export function installVueGlobalHandlers(app: App, context: string): void {
    app.config.errorHandler = (err: unknown, _instance, info): void => {
        const message = err instanceof Error ? err.message : String(err);
        log(
            `ENTRYPOINTS ${context}: errorHandler`,
            {message, info, stack: (err as Error)?.stack},
            "error"
        );
    };

    app.config.warnHandler = (msg: string, _instance, trace): void => {
        log(`ENTRYPOINTS ${context}: warnHandler`, {msg, trace}, "warn");
    };
}
