/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {createI18n} from "vue-i18n";
import deDE from "@/_locales/de/gui.json";
import enUS from "@/_locales/en/gui.json";
import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import type {I18nWrapper} from "@/types";

const i18nConfig = {
    locale: "en-US", // Default, will be updated in i18nInstance or after mount
    fallbackLocale: "en-US",
    messages: {
        "de-DE": deDE,
        "en-US": enUS
    },
    datetimeFormats: {
        "de-DE": {
            numeric: {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            },
            short: {
                day: "numeric",
                month: "short",
                year: "numeric"
            },
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
            numeric: {
                year: "numeric",
                month: "numeric",
                day: "numeric"
            },
            short: {
                year: "numeric",
                month: "short",
                day: "numeric"
            },
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
            currency: {
                style: "currency",
                currency: "EUR",
                notation: "standard"
            },
            currencyUSD: {
                style: "currency",
                currency: "USD",
                notation: "standard"
            },
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
            integer: {
                style: "decimal",
                maximumFractionDigits: 0
            },
            year: {
                style: "decimal",
                maximumFractionDigits: 0,
                useGrouping: false
            },
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
            currency: {
                style: "currency",
                currency: "USD",
                notation: "standard"
            },
            currencyEUR: {
                style: "currency",
                currency: "EUR",
                notation: "standard"
            },
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
            integer: {
                style: "decimal",
                maximumFractionDigits: 0
            },
            year: {
                style: "decimal",
                maximumFractionDigits: 0,
                useGrouping: false
            },
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
 * Global Vue I18n instance configured with supported locales, number/date
 * formats, and a development-only missing-key logger.
 */
const i18nInstance = createI18n(i18nConfig);

/**
 * Exported wrapper exposing the configured I18n instance for app setup.
 */
const i18nWrapper: I18nWrapper = {
    i18n: i18nInstance
};

export default i18nWrapper;

// Set locale after initialization to avoid top-level composable issues
const {getUserLocale} = useBrowser();
i18nInstance.global.locale = getUserLocale();

DomainUtils.log("PLUGINS i18n");
