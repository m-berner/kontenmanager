/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import type {BrowserAdapter} from "@/adapters/driven/types";
import deDE from "@/adapters/ui/_locales/de/gui.json";
import enUS from "@/adapters/ui/_locales/en/gui.json";

const i18nConfig = {
    // Composition mode, declared explicitly.
    //
    // Without this option vue-i18n's `initFeatureFlags()` defaults
    // `__VUE_I18N_LEGACY_API__` to `true` (nothing defines it in vite.config.js),
    // and `createI18n` resolves `__legacyMode = true`. So the app ran on the
    // Legacy API path — deprecated in v11 and removed in v12 — purely by
    // omission, while every component uses the Composition API via `useI18n()`.
    //
    // The reason this is written down rather than just flipped: the switch is
    // NOT free, and the obvious one-line deprecation cleanup would have broken
    // the locale silently. In Legacy mode `i18n.global` is a `VueI18n` whose
    // `locale` is a real accessor pair, so a bare `i18n.global.locale = "de-DE"`
    // worked. In Composition mode `i18n.global` is a **Composer**, whose
    // `locale` is a `WritableComputedRef` — the bare assignment would *replace
    // the ref with a string*, the locale would stay at the configured default
    // "en-US", and nothing would throw or log. That is not merely an English
    // UI: `locale` also selects the `datetimeFormats` block below. Hence
    // `.locale.value` at the assignment, and the `.numberFormats.value` the
    // plugin's test now reads.
    //
    // `as const` is load-bearing. `createI18n`'s return type branches on
    // `(typeof options)["legacy"] extends false`, so a widened `boolean` would
    // land on neither branch and hand back `Composer | VueI18n`.
    legacy: false as const,
    locale: "en-US", // Default, will be updated after creation
    fallbackLocale: "en-US",
    messages: {
        "de-DE": deDE,
        "en-US": enUS
    },
    datetimeFormats: {
        "de-DE": {
            numeric: {day: "numeric", month: "numeric", year: "numeric"},
            short: {day: "numeric", month: "short", year: "numeric"},
            long: {
                day: "numeric",
                month: "short",
                year: "numeric",
                weekday: "short",
                hour: "numeric",
                minute: "numeric"
            }
        },
        "en-US": {
            numeric: {year: "numeric", month: "numeric", day: "numeric"},
            short: {year: "numeric", month: "short", day: "numeric"},
            long: {
                year: "numeric",
                month: "short",
                day: "numeric",
                weekday: "short",
                hour: "numeric",
                minute: "numeric"
            }
        }
    },
    numberFormats: {
        // Both locale blocks must define the SAME key set. `currencyUSD` used to
        // exist only here, while InfoBar.vue uses it unconditionally — and
        // `fallbackLocale` is "en-US", so on an en-US install there was no
        // second source to fall back to: vue-i18n warned and formatted the
        // value with default options, dropping the currency style. The
        // commodity row then read "1234.56 / $1,234.56" — the left half
        // unlabelled, both halves the same number (the en-US divisor is 1).
        "de-DE": {
            currency3: {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
                notation: "standard"
            },
            currency: {style: "currency", currency: "EUR", notation: "standard"},
            currencyUSD: {style: "currency", currency: "USD", notation: "standard"},
            decimal: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            decimal3: {
                style: "decimal",
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            },
            integer: {style: "decimal", maximumFractionDigits: 0},
            year: {style: "decimal", maximumFractionDigits: 0, useGrouping: false},
            percent: {
                style: "percent",
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
                useGrouping: false
            }
        },
        "en-US": {
            currency3: {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
                notation: "standard"
            },
            currency: {style: "currency", currency: "USD", notation: "standard"},
            // Same absolute currency in both blocks, deliberately: this key
            // means "format as USD" regardless of locale (commodity prices are
            // quoted in USD), unlike `currency`, which follows the locale.
            currencyUSD: {style: "currency", currency: "USD", notation: "standard"},
            decimal: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            decimal3: {
                style: "decimal",
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            },
            integer: {style: "decimal", maximumFractionDigits: 0},
            year: {style: "decimal", maximumFractionDigits: 0, useGrouping: false},
            percent: {
                style: "percent",
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
                useGrouping: false
            }
        }
    }
} satisfies Parameters<typeof createI18n>[0];

/**
 * Creates the global Vue I18n instance configured with supported locales,
 * number/date formats, and a missing-key logger.
 */
export function createI18nPlugin(
    browserAdapter: Pick<BrowserAdapter, "getUserLocale">
) {
    const i18nInstance = createI18n(i18nConfig);
    // `.value`, not a bare assignment — see the `legacy` note on `i18nConfig`.
    i18nInstance.global.locale.value = browserAdapter.getUserLocale();
    log("PLUGINS i18n");
    return i18nInstance;
}

export type I18nPlugin = ReturnType<typeof createI18nPlugin>;
