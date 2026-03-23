/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import deDE from "@/adapters/primary/_locales/de/gui.json";
import enUS from "@/adapters/primary/_locales/en/gui.json";
import type {BrowserAdapter} from "@/adapters/secondary/types";

const i18nConfig = {
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
        "de-DE": {
            currency5: {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 5,
                maximumFractionDigits: 5,
                notation: "standard"
            },
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
            currency5: {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 5,
                maximumFractionDigits: 5,
                notation: "standard"
            },
            currency3: {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
                notation: "standard"
            },
            currency: {style: "currency", currency: "USD", notation: "standard"},
            currencyEUR: {style: "currency", currency: "EUR", notation: "standard"},
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
    browserService: Pick<BrowserAdapter, "getUserLocale">
) {
    const i18nInstance = createI18n(i18nConfig);
    i18nInstance.global.locale = browserService.getUserLocale();
    log("PLUGINS i18n");
    return i18nInstance;
}

export type I18nPlugin = ReturnType<typeof createI18nPlugin>;
