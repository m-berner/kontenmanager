/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { createApp } from "vue";
import { DomainUtils } from "@/domains/utils";
import vuetifyPlugin from "@/plugins/vuetify";
import i18nPlugin from "@/plugins/i18n";
import piniaPlugin from "@/plugins/pinia";
import OptionsIndex from "@/views/OptionsIndex.vue";

/**
 * Initializes and mounts the Options page application instance.
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
    "PAGE_SCRIPTS options.js",
    { message, info, stack: (err as Error)?.stack },
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
  DomainUtils.log("PAGE_SCRIPTS options.js", { msg, trace }, "warn");
};

app.use(vuetifyPlugin.vuetify);
app.use(i18nPlugin.i18n);
app.use(piniaPlugin.pinia);
app.mount("#options");

DomainUtils.log(
  "--- entrypoints/options.js ---",
  window.location.href,
  "info"
);
