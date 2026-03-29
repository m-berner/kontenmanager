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
import {createI18nPlugin} from "@/adapters/primary/plugins/i18n";
import {createAppPinia} from "@/adapters/primary/plugins/pinia";
import {startThemeSync} from "@/adapters/primary/plugins/themeSync";
import vuetifyPlugin from "@/adapters/primary/plugins/vuetify";
import {useSettingsStore} from "@/adapters/primary/stores/settings";
import OptionsIndex from "@/adapters/primary/views/OptionsIndex.vue";

installUnhandledRejectionLogger("options");

/**
 * Initializes and mounts the options application instance for the options view.
 */
const app = createApp(OptionsIndex);
const adapters = createAdapters();
const pinia = createAppPinia(adapters);
const i18n = createI18nPlugin(adapters.browserAdapter);

provideAdapters(app, adapters);

installVueGlobalHandlers(app, "options");

app.use(pinia);
app.use(i18n);
app.use(vuetifyPlugin);

// Options page does not run the full app bootstrap; initialize settings here.
// pinia is passed explicitly because this runs outside of Vue's setup() context,
// where no active Pinia instance is available automatically.
void useSettingsStore(pinia).load();

startThemeSync(pinia, vuetifyPlugin);
app.mount("#options");

log("ENTRYPOINTS options", window.location.href, "info");
