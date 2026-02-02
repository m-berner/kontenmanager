/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { createApp } from "vue";
import { UtilsService } from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import componentsPlugin from "@/plugins/components";
import routerPlugin from "@/plugins/router";
import piniaPlugin from "@/plugins/pinia";
import AppIndex from "@/views/AppIndex.vue";

/**
 * Initializes and mounts the main application instance for the popup/app view.
 */
const app = createApp(AppIndex);

/**
 * Global error handler for the app entrypoint.
 *
 * Captures unhandled exceptions thrown in components and logs them via
 * `UtilsService.log` for inspection in the browser console.
 *
 * @param err - The error thrown by Vue/component code.
 * @param _instance - The component instance where the error occurred (unused).
 * @param info - Vue error info string indicating the lifecycle/handler.
 */
app.config.errorHandler = (err: unknown, _instance, info): void => {
  UtilsService.log("APP: errorHandler", { err, info }, "error");
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
  UtilsService.log("APP: warnHandler", { msg, trace }, "warn");
};

app.use(vuetifyPlugin.vuetify);
app.use(componentsPlugin);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.use(routerPlugin.router);
app.mount("#app");

UtilsService.log("--- entrypoints/app.js ---");
