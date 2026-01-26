import { createI18n } from 'vue-i18n';
import deDE from '@/locales/de-DE.json';
import enUS from '@/locales/en-US.json';
import { UtilsService } from '@/domains/utils';
import { useBrowser } from '@/composables/useBrowser';
const { locale5 } = useBrowser();
const i18nInstance = createI18n({
    locale: locale5.value,
    fallbackLocale: 'en-US',
    messages: {
        'de-DE': deDE,
        'en-US': enUS
    },
    datetimeFormats: {
        'de-DE': {
            numeric: {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            },
            short: {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            },
            long: {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: 'numeric'
            }
        },
        'en-US': {
            numeric: {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            },
            short: {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            },
            long: {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: 'numeric'
            }
        }
    },
    numberFormats: {
        'de-DE': {
            currency5: {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 5,
                maximumFractionDigits: 5,
                notation: 'standard'
            },
            currency3: {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
                notation: 'standard'
            },
            currency: {
                style: 'currency',
                currency: 'EUR',
                notation: 'standard'
            },
            currencyUSD: {
                style: 'currency',
                currency: 'USD',
                notation: 'standard'
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            decimal3: {
                style: 'decimal',
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            },
            integer: {
                style: 'decimal',
                maximumFractionDigits: 0
            },
            year: {
                style: 'decimal',
                maximumFractionDigits: 0,
                useGrouping: false
            },
            percent: {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
                useGrouping: false
            }
        },
        'en-US': {
            currency: {
                style: 'currency',
                currency: 'USD',
                notation: 'standard'
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            },
            percent: {
                style: 'percent',
                useGrouping: false
            }
        }
    }
});
const i18nConfig = {
    i18n: i18nInstance
};
export default i18nConfig;
UtilsService.log('--- plugins/i18n.js ---');
