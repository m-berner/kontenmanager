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

const app = createApp(AppIndex);

app.config.errorHandler = (err: unknown, _instance, info): void => {
  UtilsService.log("APP: errorHandler", { err, info }, "error");
};

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
