/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createApp} from "vue";

import {log} from "@/domain/utils/utils";

import {createAdapters} from "@/adapters/container";
import {provideAdapters} from "@/adapters/context";
import {installUnhandledRejectionLogger, installVueGlobalHandlers} from "@/adapters/primary/entrypoints/errorHandling";
import componentsPlugin from "@/adapters/primary/plugins/components";
import {createI18nPlugin} from "@/adapters/primary/plugins/i18n";
import {createAppPinia} from "@/adapters/primary/plugins/pinia";
import routerPlugin from "@/adapters/primary/plugins/router";
import {startThemeSync} from "@/adapters/primary/plugins/themeSync";
import vuetifyPlugin from "@/adapters/primary/plugins/vuetify";
import AppIndex from "@/adapters/primary/views/AppIndex.vue";

log("ENTRYPOINTS app: module start");

installUnhandledRejectionLogger("app");

/**
 * Initializes and mounts the main application instance for the app view.
 */
const app = createApp(AppIndex);
const adapters = createAdapters();
const pinia = createAppPinia(adapters); // inject services into pinia
const i18n = createI18nPlugin(adapters.browserAdapter);

provideAdapters(app, adapters); // inject services into vue

installVueGlobalHandlers(app, "app");

app.use(pinia);
app.use(i18n);
app.use(routerPlugin);
app.use(vuetifyPlugin);
app.use(componentsPlugin);

// Keep theme changes (including cross-context storage updates) in the UI layer.
startThemeSync(pinia, vuetifyPlugin);
app.mount("#app");

log(
    "ENTRYPOINTS app",
    {version: adapters.browserAdapter.manifest().version, mode: import.meta.env.MODE},
    "info"
);
