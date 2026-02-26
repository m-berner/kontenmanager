/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createApp} from "vue";
import {DomainUtils} from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import piniaPlugin from "@/plugins/pinia";
import OptionsIndex from "@/views/OptionsIndex.vue";

/**
 * Catch errors not handled by Vue's errorHandler.
 */
window.addEventListener("unhandledrejection", (e) => {
    DomainUtils.log(
        "ENTRYPOINTS options: unhandledrejection",
        {reason: e.reason},
        "error"
    );
});

/**
 * Initializes and mounts the options application instance for the options view.
 */
const app = createApp(OptionsIndex);

/**
 * Global error handler for the Options entrypoint.
 *
 * Formats and logs unhandled exceptions to aid diagnostics in the extension
 * console.
 *
 * @param err - The thrown error or unknown value.
 * @param _instance - Component instance that raised the error (unused).
 * @param info - Vue lifecycle/handler information string.
 */
app.config.errorHandler = (err: unknown, _instance, info): void => {
    const message = err instanceof Error ? err.message : String(err);
    DomainUtils.log(
        "ENTRYPOINTS options: errorHandler",
        {message, info, stack: (err as Error)?.stack},
        "error"
    );
};

/**
 * Global warning handler for the Options entrypoint.
 *
 * @param msg - The warning message.
 * @param _instance - Component instance emitting the warning (unused).
 * @param trace - Component tree trace for context.
 */
app.config.warnHandler = (msg: string, _instance, trace): void => {
    DomainUtils.log("ENTRYPOINTS options: warnHandler", {msg, trace}, "warn");
};

app.use(piniaPlugin.pinia);
app.use(i18nPlugin.i18n);
app.use(vuetifyPlugin.vuetify);

app.mount("#options");

DomainUtils.log("ENTRYPOINTS options", window.location.href, "info");
