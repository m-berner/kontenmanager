/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createApp} from "vue";

import {log} from "@/domain/utils/utils";

import {createAdapters} from "@/adapters/container";
import {provideAdapters} from "@/adapters/context";
import {installUnhandledRejectionLogger, installVueGlobalHandlers} from "@/adapters/ui/entrypoints/errorHandling";
import {ensureSingleAppTab} from "@/adapters/ui/entrypoints/singleTabGuard";
import componentsPlugin from "@/adapters/ui/plugins/components";
import {createI18nPlugin} from "@/adapters/ui/plugins/i18n";
import {createAppPinia} from "@/adapters/ui/plugins/pinia";
import routerPlugin from "@/adapters/ui/plugins/router";
import {startThemeSync} from "@/adapters/ui/plugins/themeSync";
import vuetifyPlugin from "@/adapters/ui/plugins/vuetify";
import {attachStoreTranslate} from "@/adapters/ui/stores/deps";
import AppIndex from "@/adapters/ui/views/AppIndex.vue";

log("ENTRYPOINTS app: module start");

installUnhandledRejectionLogger("app");

/**
 * Initializes and mounts the main application instance for the app view,
 * unless another app tab is already open — see `ensureSingleAppTab()`.
 */
async function bootstrap(): Promise<void> {
    const adapters = createAdapters();

    if (!(await ensureSingleAppTab(adapters.browserAdapter))) {
        log("ENTRYPOINTS app: another app tab is already open, not mounting");
        return;
    }

    const app = createApp(AppIndex);
    const i18n = createI18nPlugin(adapters.browserAdapter);
    const pinia = createAppPinia(adapters); // inject adapters into pinia
    attachStoreTranslate(pinia, i18n.global.t); // wire the translation function into stores (see stores/deps.ts)

    provideAdapters(app, adapters); // inject adapters into vue

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
}

/**
 * Renders a minimal, dependency-free failure notice with a retry.
 *
 * `AppIndex` went to real trouble over startup failures — `hasInitError` plus a
 * retry button, added because "a transient IndexedDB or storage failure used to
 * leave `isInitialized` false forever: one error toast over an indeterminate
 * spinner, with no retry and no way forward but a manual reload." That safety
 * net only covers failures **after** `app.mount()`. Anything throwing between
 * `createAdapters()` and `mount` left the page with no Vue app at all — no
 * spinner, no alert, no retry: the user saw white. It was never silent to a
 * *developer* (`installUnhandledRejectionLogger` is installed first, precisely
 * so the rejection reaches `console.error`), but nothing reached the user.
 *
 * Built with DOM calls rather than a template string because at this point
 * nothing can be assumed: not Vue, not Vuetify, not i18n, not the store deps.
 * `browser.i18n.getMessage` is the one translation source available pre-mount,
 * and it is read defensively for the same reason `domain/errors.ts` avoids the
 * free `browser` variable.
 *
 * Deliberately NOT reached when `ensureSingleAppTab` returns `false`. That path
 * also ends in an unmounted page, and `focusThenClose`'s comment explicitly
 * accepts "stuck open and unmounted (blank page)" as the price of never
 * mounting twice — showing a "startup failed, retry" button there would invite
 * the user to defeat single-tab enforcement. The distinction is structural
 * rather than a flag: that path returns, this handler only sees a throw.
 */
function renderBootstrapFailure(err: unknown): void {
    const root = document.querySelector("#app");
    if (!root) return;

    const i18n = (globalThis as unknown as {
        browser?: { i18n?: { getMessage?: (_key: string) => string } };
    }).browser?.i18n;
    const translate = (key: string, fallback: string): string => {
        try {
            const message = i18n?.getMessage?.(key);
            return message && message.trim() !== "" ? message : fallback;
        } catch {
            return fallback;
        }
    };

    root.replaceChildren();

    const container = document.createElement("div");
    container.setAttribute("role", "alert");
    container.style.cssText = "padding:2rem;font-family:system-ui,sans-serif;text-align:center";

    const heading = document.createElement("h1");
    heading.style.cssText = "font-size:1.25rem;margin:0 0 .5rem";
    heading.textContent = translate("xx_startup_failed_title", "KontenManager could not start");

    const detail = document.createElement("p");
    detail.style.cssText = "margin:0 0 1.5rem";
    detail.textContent = translate(
        "xx_startup_failed_message",
        "Something went wrong while starting up. Please try again."
    );

    const retry = document.createElement("button");
    retry.type = "button";
    retry.style.cssText = "padding:.5rem 1.5rem;font:inherit;cursor:pointer";
    retry.textContent = translate("xx_startup_failed_retry", "Retry");
    retry.addEventListener("click", () => {
        globalThis.location.reload();
    });

    container.append(heading, detail, retry);
    root.append(container);

    log("ENTRYPOINTS app: bootstrap failed before mount", err, "error");
}

void bootstrap().catch(renderBootstrapFailure);
