/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createI18n, type I18n} from 'vue-i18n'
import {useApp} from '@/apis/useApp'
import deDE from '@/locales/de-DE.json'
import enUS from '@/locales/en-US.json'

type MessageSchema = typeof deDE

interface II18n {
    i18n: I18n<{ 'de-DE': MessageSchema, 'en-US': MessageSchema }>
}

const {log, getUI} = useApp()

const getInitialLocale = (): 'de-DE' | 'en-US' => {
    const uiLocale = getUI().locale
    // Map common locale variations to supported locales
    if (uiLocale.startsWith('de')) {
        return 'de-DE'
    }
    return 'en-US' // Default fallback
}

const i18nInstance = createI18n<[MessageSchema], 'de-DE' | 'en-US'>({
    locale: getInitialLocale(),
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
})

const i18nConfig: II18n = {
    i18n: i18nInstance
}

export default i18nConfig

log('--- PLUGINS i18n.js ---')
