/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createApp} from "vue";
import {DomainUtils} from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import componentsPlugin from "@/plugins/components";
import routerPlugin from "@/plugins/router";
import piniaPlugin from "@/plugins/pinia";
import AppIndex from "@/views/AppIndex.vue";
import {useBrowser} from "@/composables/useBrowser";

const {manifest} = useBrowser();

/**
 * Catch errors not handled by Vue's errorHandler.
 */
window.addEventListener("unhandledrejection", (e) => {
    DomainUtils.log("ENTRYPOINTS App: unhandledrejection", {reason: e.reason}, "error");
});

/**
 * Initializes and mounts the main application instance for the app view.
 */
const app = createApp(AppIndex);

/**
 * Global error handler for the app entrypoint.
 *
 * Captures unhandled exceptions thrown in components and logs them via
 * `DomainUtils.log` for inspection in the browser console.
 *
 * @param err - The error thrown by Vue/component code.
 * @param _instance - The component instance where the error occurred (unused).
 * @param info - Vue error info string indicating the lifecycle/handler.
 */
app.config.errorHandler = (err: unknown, _instance, info): void => {
    const message = err instanceof Error ? err.message : String(err);
    DomainUtils.log(
        "ENTRYPOINTS App: errorHandler",
        {message, info, stack: (err as Error)?.stack},
        "error"
    );
};

/**
 * Global warning handler for the app entrypoint.
 *
 * Captures Vue warnings and logs them for diagnostics.
 *
 * @param msg - The warning message.
 * @param _instance - The component instance emitting the warning (unused).
 * @param trace - Component trace with hierarchy information.
 */
app.config.warnHandler = (msg: string, _instance, trace): void => {
    DomainUtils.log("ENTRYPOINTS App: warnHandler", {msg, trace}, "warn");
};

app.use(piniaPlugin.pinia);
app.use(i18nPlugin.i18n);
app.use(routerPlugin.router);
app.use(vuetifyPlugin.vuetify);
app.use(componentsPlugin);
app.mount("#app");

DomainUtils.log(
    "ENTRYPOINTS app",
    {version: manifest.value.version, mode: import.meta.env.MODE},
    "info"
);
