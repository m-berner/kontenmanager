import { createI18n } from "vue-i18n";
import deDE from "@/_locales/de/gui.json";
import enUS from "@/_locales/en/gui.json";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
const { getUserLocale } = useBrowser();
const i18nConfig = {
    locale: getUserLocale(),
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
};
const i18nInstance = createI18n(i18nConfig);
const i18nWrapper = {
    i18n: i18nInstance
};
export default i18nWrapper;
DomainUtils.log("PLUGINS I18n");
