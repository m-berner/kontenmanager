/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {createI18n, type I18n} from 'vue-i18n'
import {useAppApi} from '@/pages/background'
import deDE from '@/locales/de-DE.json'
import enUS from '@/locales/en-US.json'

type MessageSchema = typeof deDE

interface II18n {
  i18n: I18n
}

interface IBrowserUI {
  lang: string
  region: string
  locale: string
}

const {CONS, log} = useAppApi()
const getUI = (): IBrowserUI => {
  const result = {
    lang: '',
    region: '',
    locale: ''
  }
  const uiLang = browser.i18n.getUILanguage().toLowerCase() ?? CONS.DEFAULTS.LOCALE
  if (uiLang.includes('-')) {
    result.lang = uiLang.split('-')[0]
    result.region = uiLang.split('-')[1].toUpperCase()
    result.locale = uiLang
  } else {
    result.lang = uiLang
    result.region = uiLang.toUpperCase()
    result.locale = uiLang + '-' + uiLang.toUpperCase()
  }
  return result
}

export default <II18n>{
  i18n: createI18n<[MessageSchema], 'de-DE' | 'en-US'>({
    locale: getUI().locale,
    fallbackLocale: 'en-US',
    globalInjection: true,
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
}

log('--- PLUGINS i18n.js ---')
