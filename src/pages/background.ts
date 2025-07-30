/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
// NOTE: an extensions background script runs before a html page gets loaded.
// That is a multipage extension runs background multiple times
declare global {
  namespace Stockmanager {
    interface IStock {
      cID: number
      cCompany: string
      cISIN: string
      cWKN: string
      cSym: string
      cMeetingDay: number
      cQuarterDay: number
      cFadeOut: number
      cFirstPage: number
      cURL: string
    }

    interface ITransfer {
      cID: number
      cStockID: number
      cDate: number
      cExDay: number
      cUnitQuotation: number
      cAmount: number
      cCount: number
      cFees: number
      cSTax: number
      cFTax: number
      cTax: number
      cSoli: number
      cMarketPlace: string
      cDescription: string
      cType: number
    }
  }
  namespace FetchedResources {
    type TIdIsin = {
      id: number
      isin: string
    }

    interface ICompanyData {
      company: string
      wkn: string
      symbol: string
    }

    interface IMinRateMaxData {
      id: number,
      isin: string,
      rate: string,
      min: string,
      max: string,
      cur: string
    }

    interface IDailyChangesData {
      key: string
      value: {
        percentChange: string,
        change: number,
        stringChange: string
      }
    }

    interface IExchangesData {
      key: string,
      value: number
    }

    interface IMaterialData {
      key: string,
      value: number
    }

    interface IIndexData {
      key: string,
      value: number
    }

    interface IDatesData {
      key: number | undefined
      value: {
        qf: number
        gm: number
      }
    }
  }

  interface IAccount {
    // NOTE: correlates with CONS.DB.STORES.ACCOUNTS.FIELDS
    cID: number
    cSwift: string
    cNumber: string
    cLogoUrl: string
    cStockAccount: boolean
  }

  interface IBookingType {
    // NOTE: correlates with CONS.DB.STORES.BOOKING_TYPES.FIELDS
    cID: number
    cName: string
    cAccountNumberID: number
  }

  interface IBooking {
    // NOTE: correlates with CONS.DB.STORES.BOOKING.FIELDS
    cID: number
    cDate: string
    cExDate: string
    cDebit: number
    cCredit: number
    cDescription: string
    cCount: number
    cBookingTypeID: number
    cAccountNumberID: number
    cStockID: number
    cSoli: number
    cTax: number
    cFee: number
    cSourceTax: number
    cTransactionTax: number
    cMarketPlace: string
  }

  interface IStock {
    // NOTE: correlates with CONS.DB.STORES.STOCK.FIELDS
    cID: number
    cCompany: string
    cISIN: string
    cWKN: string
    cSymbol: string
    cFirstPage: number
    cFadeOut: number
    cMeetingDay: string
    cQuarterDay: string
    cURL: string
    cAccountNumberID: number
  }

  interface IStockStore {
    cID: number
    cCompany: string
    cISIN: string
    cWKN: string
    cSymbol: string
    cMeetingDay: string
    cQuarterDay: string
    cFadeOut: number
    cFirstPage: number
    cURL: string
    cAccountNumberID: number
    mPortfolio: number
    mChange: number
    mBuyValue: number
    mEuroChange: number
    mMin: number
    mValue: number
    mMax: number
  }

  interface IBackup {
    sm: {
      cVersion: number
      cDBVersion: number
      cEngine: string
    }
    accounts: IAccount[]
    bookings: IBooking[]
    booking_types: IBookingType[]
    stocks: IStock[] & Stockmanager.IStock[]
    transfers?: IBooking[] & Stockmanager.ITransfer[]
  }

  interface IStoresDB {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStock[]
  }

  interface IStores {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStockStore[]
  }

  interface IDrawerControls {
    id: number
    title: string
    value: string
    class: string
  }

  interface IStorageLocal {
    sActiveAccountId: number
    sBookingsPerPage: number
    sStocksPerPage: number
    sPartner: boolean
    sSkin: string
    sService: string
    sExchanges: string[]
    sMaterials: string[]
    sIndexes: string[]
    sMarkets: string[]
  }
}

type TValidator = (v: string) => string | boolean

interface IService {
  NAME: string
  HOME: string
  QUOTE: string
}

interface IBrowserUI {
  lang: string
  region: string
  locale: string
  currency: string
  curEur: string
  curUsd: string
  fontSize: string
}

interface IUrlWithId {
  url: string
  id: number
}

export const useApp = () => {
  enum MESSAGES {
    DB__DELETE_ALL,
    DB__CLOSE,
    DB__GET_STORES,
    DB__GET_STORES__RESPONSE,
    DB__ADD_ACCOUNT,
    DB__ADD_ACCOUNT__RESPONSE,
    DB__UPDATE_ACCOUNT,
    DB__UPDATE_ACCOUNT__RESPONSE,
    DB__ADD_BOOKING,
    DB__UPDATE_BOOKING,
    DB__ADD_BOOKING__RESPONSE,
    DB__ADD_BOOKING_TYPE,
    DB__ADD_BOOKING_TYPE__RESPONSE,
    DB__UPDATE_BOOKING__RESPONSE,
    DB__ADD_STOCK,
    DB__ADD_STOCK__RESPONSE,
    DB__UPDATE_STOCK,
    DB__UPDATE_STOCK__RESPONSE,
    DB__DELETE_ACCOUNT,
    DB__DELETE_ACCOUNT__RESPONSE,
    DB__DELETE_BOOKING,
    DB__DELETE_BOOKING__RESPONSE,
    DB__DELETE_BOOKING_TYPE,
    DB__DELETE_BOOKING_TYPE__RESPONSE,
    DB__DELETE_STOCK,
    DB__DELETE_STOCK__RESPONSE,
    STORAGE__GET_ALL,
    STORAGE__GET_ALL__RESPONSE,
    DB__ADD_STORES,
    DB__ADD_STORES_25,
    OPTIONS__SET_SKIN,
    OPTIONS__SET_SERVICE,
    OPTIONS__SET_INDEXES,
    OPTIONS__SET_MATERIALS,
    OPTIONS__SET_EXCHANGES,
    OPTIONS__SET_MARKETS,
    DB__EXPORT,
    STORAGE__SET_ID,
    STORAGE__SET_ID__RESPONSE,
    OPTIONS__SET_SKIN__RESPONSE,
    OPTIONS__SET_SERVICE__RESPONSE,
    OPTIONS__SET_INDEXES__RESPONSE,
    OPTIONS__SET_MATERIALS__RESPONSE,
    OPTIONS__SET_MARKETS__RESPONSE,
    OPTIONS__SET_EXCHANGES__RESPONSE,
    FETCH__COMPANY_DATA,
    FETCH__EXCHANGES_BASE_DATA,
    FETCH__INDEXES_DATA,
    FETCH__MATERIALS_DATA,
    FETCH__EXCHANGES_DATA,
    FETCH__DAILY_CHANGES_DATA,
    FETCH__DATES_DATA,
    FETCH__MIN_RATE_MAX_DATA
  }

  return {
    CONS: Object.freeze({
      CURRENCIES: {
        EUR: 'EUR',
        USD: 'USD',
        CODE: new Map([
          ['ar', 'ARS'],
          ['at', 'EUR'],
          ['au', 'AUD'],
          ['be', 'EUR'],
          ['bg', 'BGN'],
          ['bo', 'BOB'],
          ['br', 'BRL'],
          ['bz', 'BZD'],
          ['ca', 'CAD'],
          ['ch', 'CHF'],
          ['cl', 'CLP'],
          ['chs', 'CNY'],
          ['cht', 'CNY'],
          ['co', 'COU'],
          ['cr', 'CRC'],
          ['cs', 'CZK'],
          ['cy', 'EUR'],
          ['da', 'DKK'],
          ['de', 'EUR'],
          ['do', 'DOP'],
          ['ec', 'USD'],
          ['ee', 'EUR'],
          ['el', 'EUR'],
          ['es', 'EUR'],
          ['et', 'EUR'],
          ['fi', 'EUR'],
          ['fr', 'EUR'],
          ['gb', 'GBP'],
          ['gr', 'EUR'],
          ['gt', 'GTQ'],
          ['hk', 'HKD'],
          ['hn', 'HNL'],
          ['hu', 'HUF'],
          ['ie', 'EUR'],
          ['in', 'INR'],
          ['is', 'ISK'],
          ['it', 'EUR'],
          ['ja', 'JPY'],
          ['jm', 'JMD'],
          ['ko', 'KRW'],
          ['li', 'EUR'],
          ['lt', 'EUR'],
          ['lu', 'EUR'],
          ['mc', 'EUR'],
          ['mo', 'MOP'],
          ['mt', 'EUR'],
          ['mx', 'MXN'],
          ['ni', 'NIO'],
          ['nl', 'EUR'],
          ['no', 'NOK'],
          ['nz', 'NZD'],
          ['pa', 'PAB'],
          ['pe', 'PEN'],
          ['ph', 'PHP'],
          ['pl', 'PLN'],
          ['pr', 'USD'],
          ['pt', 'EUR'],
          ['py', 'PYG'],
          ['ro', 'RON'],
          ['ru', 'RUB'],
          ['se', 'SEK'],
          ['sg', 'SGD'],
          ['sk', 'EUR'],
          ['sl', 'EUR'],
          ['sp', 'RSD'],
          ['sv', 'USD'],
          ['tr', 'TRY'],
          ['tt', 'TTD'],
          ['tw', 'TWD'],
          ['uy', 'UYU'],
          ['ve', 'VES'],
          ['za', 'ZAR'],
          ['zw', 'ZWD']
        ])
      },
      DATE: {
        DEFAULT: 0,
        DEFAULT_ISO: '1970-01-01',
        DEFAULT_YEAR: 1970,
        MILLI_PER_DAY: 86400000,
        MILLI_PER_MIN: 60000
      },
      DB: {
        NAME: 'kontenmanager.db',
        STORES: {
          ACCOUNTS: {
            NAME: 'accounts',
            FIELDS: {
              ID: 'cID',
              SWIFT: 'cSwift',
              LOGO_URL: 'cLogoUrl',
              LOGO_SEARCH_NAME: 'cLogoSearchName',
              NUMBER: 'cNumber',
              STOCK_ACCOUNT: 'cStockAccount'
            }
          },
          BOOKINGS: {
            NAME: 'bookings',
            FIELDS: {
              ID: 'cID',
              DATE: 'cDate',
              EX_DATE: 'cExDate',
              COUNT: 'cCount',
              CREDIT: 'cCredit',
              DEBIT: 'cDebit',
              DESCRIPTION: 'cDescription',
              BOOKING_TYPE_ID: 'cBookingTypeID',
              ACCOUNT_NUMBER_ID: 'cAccountNumberID',
              STOCK_ID: 'cStockID',
              SOLI: 'cSoli',
              MARKET_PLACE: 'cMarketPlace',
              TAX: 'cTax',
              FEE: 'cFee',
              SOURCE_TAX: 'cSourceTax',
              TRANSACTION_TAX: 'cTransactionTax'
            }
          },
          BOOKING_TYPES: {
            NAME: 'booking_types',
            FIELDS: {
              ID: 'cID',
              NAME: 'cName',
              ACCOUNT_NUMBER_ID: 'cAccountNumberID'
            }
          },
          STOCKS: {
            NAME: 'stocks',
            FIELDS: {
              ID: 'cID',
              ISIN: 'cISIN',
              SYMBOL: 'cSymbol',
              FADE_OUT: 'cFadeOut',
              FIRST_PAGE: 'cFirstPage',
              URL: 'cURL',
              MEETING_DAY: 'cMeetingDay',
              QUARTER_DAY: 'cQuarterDay',
              WKN: 'cWKN',
              COMPANY: 'cCompany',
              ACCOUNT_NUMBER_ID: 'cAccountNumberID'
            }
          }
        },
        IMPORT_MIN_VERSION: 25,
        CURRENT_VERSION: 26
      },
      DEFAULTS: {
        BACKGROUND: '_generated_background_page.html',
        APP: 'app.html',
        OPTIONS: 'options.html',
        CURRENCY: 'EUR',
        LANG: 'de',
        LOCALE: 'de-DE',
        DATE: '1970-01-01',
        YEAR: 9999,
        STORAGE: {
          ACTIVE_ACCOUNT_ID: -1, //localStorage
          BOOKINGS_PER_PAGE: 9, // localStorage
          STOCKS_PER_PAGE: 9, // localStorage
          DEBUG: false, //localStorage
          // sExtensionId sesseionStorage
          SKIN: 'ocean',
          MATERIALS: ['au', 'brent'],
          INDEXES: ['dax', 'dow'],
          EXCHANGES: ['EURUSD'],
          MARKETS: ['Frankfurt', 'XETRA'],
          SERVICE: 'wstreet',
          PARTNER: false
        },
        DRAWER_KEYS: [
          'winloss',
          'earnings',
          'deposits',
          'dividends',
          'withdrawals',
          'fees',
          'taxes',
          'account',
          'depot'
        ],
        DRAWER_CONTROLS: [
          {
            id: 0,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 1,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 2,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 3,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 4,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 5,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 6,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 7,
            title: '',
            value: '0',
            class: ''
          },
          {
            id: 8,
            title: '',
            value: '0',
            class: ''
          }
        ]
      },
      DIALOGS: {
        ADD_ACCOUNT: 'AddAccount',
        UPDATE_ACCOUNT: 'UpdateAccount',
        DELETE_ACCOUNT: 'DeleteAccount',
        ADD_STOCK: 'AddStock',
        UPDATE_STOCK: 'UpdateStock',
        DELETE_STOCK: 'DeleteStock',
        ADD_BOOKING_TYPE: 'AddBookingType',
        DELETE_BOOKING_TYPE: 'DeleteBookingType',
        ADD_BOOKING: 'AddBooking',
        UPDATE_BOOKING: 'UpdateBooking',
        DELETE_BOOKING: 'DeleteBooking',
        EXPORT_DATABASE: 'ExportDatabase',
        IMPORT_DATABASE: 'ImportDatabase',
        SHOW_ACCOUNTING: 'ShowAccounting',
        SETTING: 'setting'
      },
      DYNAMIC_LIST: {
        TYPES: {
          MARKETS: Symbol.for('markets'),
          EXCHANGES: Symbol.for('exchanges')
        }
      },
      EVENTS: {
        ABORT: 'abort',
        BEFOREUNLOAD: 'beforeunload',
        CHANGE: 'change',
        CLICK: 'click',
        COMP: 'complete',
        DOM: 'DOMContentLoaded',
        ERR: 'error',
        INP: 'input',
        KEYDOWN: 'keydown',
        LOAD: 'load',
        FOCUS: 'focus',
        BLUR: 'blur',
        SUC: 'success',
        UPG: 'upgradeneeded'
      },
      LOGOS: {
        NO_LOGO: 'https://cdn.brandfetch.io/brandfetch.com/w/48/h/48?c=1idV74s2UaSDMRIQg-7'
      },
      MESSAGES: MESSAGES,
      RECORDS: {
        CONTROLLER: {
          TOTAL: {
            efficiency: 0,
            returnRate: 0,
            buy: 0,
            sell: 0,
            dividends: 0,
            deposits: 0,
            withdrawals: 0,
            taxes: 0,
            fees: 0,
            earnings: 0,
            account: 0,
            depot: 0,
            winLoss: 0,
            winLossPercent: 0,
            depotBuyValue: 0
          }
        }
      },
      SERVICES: {
        MAP: new Map([
          ['goyax', {
            NAME: 'Goyax',
            HOME: 'https://www.goyax.de/',
            QUOTE: 'https://www.goyax.de/aktien/'
          }],
          ['fnet', {
            NAME: 'Finanzen.Net',
            HOME: 'https://www.finanzen.net/aktienkurse/',
            QUOTE: 'https://www.finanzen.net/suchergebnis.asp?_search=',
            INDEXES: 'https://www.finanzen.net/indizes/',
            DATES: 'https://www.finanzen.net/termine/',
            MATERIALS: 'https://www.finanzen.net/rohstoffe/',
            GM: 'Hauptversammlung',
            QF: 'Quartalszahlen'
          }],
          ['wstreet', {
            NAME: 'Wallstreet-Online',
            HOME: 'https://www.wallstreet-online.de',
            QUOTE:
              'https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/'
          }],
          ['acheck', {
            NAME: 'Aktien Check',
            HOME: 'https://m.aktiencheck.de/',
            QUOTE: 'https://m.aktiencheck.de/quotes/suche/?search='
          }],
          ['ard', {
            NAME: 'ARD',
            HOME: 'https://www.tagesschau.de/wirtschaft/boersenkurse/',
            QUOTE:
              'https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff='
          }]
        ]),
        TGATE: {
          NAME: 'Tradegate', // changes list, new stock
          HOME: 'https://www.tradegate.de/',
          QUOTE: 'https://www.tradegate.de/orderbuch.php?isin=',
          CHS_URL: 'https://www.tradegate.de/indizes.php?index=',
          CHB_URL: 'https://www.tradegate.de/indizes.php?buchstabe=',
          CHS: [
            'DE000A1EXRV0',
            'DE000A1EXRY4',
            'DE000A1EXRW8',
            'DE000A1EXRX6',
            'EU0009658145',
            'DE000A0SNK21',
            'US0000000002'
          ],
          CHB: [
            '1',
            '2',
            '3',
            '4',
            '5',
            '7',
            '8',
            '9',
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            'Ö'
          ],
          CHANGES: {SMALL: 34, BIG: 41}
        },
        FX: {
          NAME: 'fx-rate',
          HOME: 'https://fx-rate.net/qwsaq',
          QUOTE: 'https://fx-rate.net/calculator/?c_input=',
        }
      },
      SETTINGS: {
        ITEMS_PER_PAGE_OPTIONS: [
          {
            value: 5,
            title: '5'
          },
          {
            value: 7,
            title: '7'
          },
          {
            value: 9,
            title: '9'
          },
          {
            value: 11,
            title: '11'
          }
          // {
          //   value: -1,
          //   title: 'Alle'
          // }
        ],
        INDEXES: new Map<string, string>([
          ['dax', 'DAX'],
          ['dow', 'Dow Jones'],
          ['nasdaq', 'NASDAQ Comp.'],
          ['nikkei', 'NIKKEI 225'],
          ['hang', 'Hang Seng'],
          ['ibex', 'IBEX 35'],
          ['straits', 'Straits Times'],
          ['asx', 'Australia All Ordinaries'],
          ['rts', 'RTS'],
          ['bovespa', 'BOVESPA'],
          ['sensex', 'SENSEX'],
          ['sci', 'Shanghai Composite'],
          ['ftse', 'FTSE 100'],
          ['smi', 'SMI'],
          ['cac', 'CAC 40'],
          ['stoxx', 'Euro Stoxx 50'],
          ['tsx', 'S&P/TSX'],
          ['sp', 'S&P 500']
        ]),
        MATERIALS: new Map<string, string>([
          ['au', 'Goldpreis'],
          ['ag', 'Silberpreis'],
          ['brent', 'Ölpreis (Brent)'],
          ['wti', 'Ölpreis (WTI)'],
          ['cu', 'Kupferpreis'],
          ['pt', 'Platinpreis'],
          ['al', 'Aluminiumpreis'],
          ['ni', 'Nickelpreis'],
          ['sn', 'Zinnpreis'],
          ['pb', 'Bleipreis'],
          ['pd', 'Palladiumpreis']
        ]),
      },
      STATES: {
        DONE: 'complete',
        SRV: 500,
        SUCCESS: 200,
        PAUSE: 'resting',
        MUTATE: 'mutation',
        NO_RENDER: 'no_render'
      },
      STORAGE: {
        PROPS: {
          SKIN: 'sSkin',
          SERVICE: 'sService',
          INDEXES: 'sIndexes',
          MARKETS: 'sMarkets',
          MATERIALS: 'sMaterials',
          EXCHANGES: 'sExchanges',
          PARTNER: 'sPartner',
          DEBUG: 'sDebug',
          ACTIVE_ACCOUNT_ID: 'sActiveAccountId',
          BOOKINGS_PER_PAGE: 'sBookingsPerPage',
          STOCKS_PER_PAGE: 'sStocksPerPage'
        }
      },
      SYSTEM: {
        COPYRIGHT: '2013-2025 Martin Berner',
        MAILTO: 'mailto:kontenmanager@gmx.de',
        GET: 'GET',
        INDEX: 'pages/app.html',
        HTML_ENTITY:
          '(&auml|&Auml;|&ouml;|&Ouml;|&uuml;|&Uuml;|&amp;|&eacute;|&Eacute;|&ecirc;|&Ecirc;|&oacute;|&Oacute;|&aelig;|&Aelig;)',
        KEYS: {
          ENTER: 'Enter',
          TAB: 'Tab',
          T: 'T',
          V: 'V',
          Z: 'Z'
        },
        ERRORS: {
          CURR: 'Missing current record!',
          ERR: 'System error!',
          INVALID: 'Invalid Range!',
          NO_CASE: 'Missing case!',
          NO_DEL: 'Deletion off memory failed!',
          REQ: 'Request failed!',
          SRV: 'Remote Server error!',
          WRONG_PARAM: 'Wrong parameter!',
          SEND: 'Send message failed!',
          PORT: 'Message port is missing!'
        },
        ONCE: {once: true}
      }
    }),
    valIbanRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0],
        (v: string) => (v !== null && v.length < 13) || msgArray[1],
        (v: string) => v.match(/^(^[A-Z]{2}[0-9]{3,12})/g) !== null || msgArray[2]
      ]
    },
    valNameRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0],
        (v: string) => (v !== null && v.length < 32) || msgArray[1],
        (v: string) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
      ]
    },
    valSwiftRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0],
        (v: string) => (v !== null && v.length < 13) || msgArray[1],
        (v: string) => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
      ]
    },
    valDateRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
      ]
    },
    valCurrencyCodeRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0],
        (v: string) => (v !== null && v.length === 3) || msgArray[1],
        (v: string) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
      ]
    },
    valRequiredRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0]
      ]
    },
    valBrandNameRules: (msgArray: string[]): TValidator[] => {
      return [
        (v: string) => v !== null || msgArray[0]
      ]
    },
    getUI: (): IBrowserUI => {
      const result = {
        lang: '',
        region: '',
        locale: '',
        currency: '',
        curUsd: '',
        curEur: '',
        fontSize: ''
      }
      // Check if browser.i18n is available (browser extension context)
      const uiLang = (typeof browser !== 'undefined' && browser.i18n?.getUILanguage?.())
        ? browser.i18n.getUILanguage().toLowerCase()
        : CONS.DEFAULTS.LOCALE

      if (uiLang.includes('-')) {
        result.lang = uiLang.split('-')[0]
        result.region = uiLang.split('-')[1].toUpperCase()
        result.locale = uiLang
        result.currency = CONS.CURRENCIES.CODE.get(uiLang.split('-')[1]) ?? CONS.DEFAULTS.CURRENCY
      } else {
        result.lang = uiLang
        result.region = uiLang.toUpperCase()
        result.locale = uiLang + '-' + uiLang.toUpperCase()
        result.currency = CONS.CURRENCIES.CODE.get(uiLang) ?? CONS.DEFAULTS.CURRENCY
      }
      result.curEur = result.currency + CONS.CURRENCIES.EUR
      result.curUsd = result.currency + CONS.CURRENCIES.USD
      result.fontSize = window
        .getComputedStyle(document.body, null)
        .getPropertyValue('font-size')
      return result
    },
    notice: async (messages: string[]): Promise<void> => {
      const msg = messages.join('\n')
      const notificationOption: browser.notifications.CreateNotificationOptions =
        {
          type: 'basic',
          iconUrl: 'assets/icon16.png',
          title: 'KontenManager',
          message: msg
        }
      await browser.notifications.create(notificationOption)
    },
    utcDate: (iso: string): Date => {
      return new Date(`${iso}T00:00:00.000`)
    },
    toISODate: (ms: number): string => {
      return new Date(ms).toISOString().substring(0, 10)
    },
    toNumber: (str: string | boolean | number | undefined | null): number => {
      let result = 0
      if (str !== null && str !== undefined) {
        const a = str.toString().replace(/,$/g, '')
        const b = a.split(',')
        if (b.length === 2) {
          const tmp2 = a
            .trim()
            .replace(/\s|\.|\t|%/g, '')
            .replace(',', '.')
          result = Number.isNaN(Number.parseFloat(tmp2))
            ? 0
            : Number.parseFloat(tmp2)
        } else if (b.length > 2) {
          let tmp: string = ''
          for (let i = b.length - 1; i > 0; i--) {
            tmp += b[i]
          }
          const tmp2 = tmp + '.' + b[0]
          result = Number.isNaN(Number.parseFloat(tmp2))
            ? 0
            : Number.parseFloat(tmp2)
        } else {
          result = Number.isNaN(parseFloat(b[0])) ? 0 : Number.parseFloat(b[0])
        }
      }
      return result
    },
    mean: (nar: number[]): number => {
      let sum = 0
      let len: number = nar.length
      let n: number
      for (n of nar) {
        if (n !== 0 && !Number.isNaN(n)) {
          sum += n
        } else {
          len--
        }
      }
      return len > 0 ? sum / len : 0
    },
    log: (msg: string, mode?: { info: unknown }) => {
      const localDebug = localStorage.getItem(CONS.STORAGE.PROPS.DEBUG)
      if (Number.parseInt(localDebug ?? '0') > 0) {
        if (mode?.info !== '') {
          console.info(msg, mode?.info)
        } else {
          console.log(msg)
        }
      }
    }
  }
}

const {CONS, log, mean, notice, toNumber} = useApp()

if (window.location.href.includes(CONS.DEFAULTS.BACKGROUND)) {
  const useDatabase = () => {
    return {
      truncateTables: async (): Promise<string> => {
        log('BACKGROUND: truncateTables')
        return new Promise(async (resolve, reject) => {
          if (dbi !== null) {
            const onComplete = async (): Promise<void> => {
              await notice(['Database is empty!'])
              resolve('BACKGROUND: database is empty!')
            }
            const onAbort = (): void => {
              reject(requestTransaction.error)
            }
            const onError = (): void => {
              reject(requestTransaction.error)
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
            const onSuccessClearBookings = (): void => {
              log('BACKGROUND: bookings dropped')
            }
            const onSuccessClearAccounts = (): void => {
              log('BACKGROUND: accounts dropped')
            }
            const onSuccessClearBookingTypes = (): void => {
              log('BACKGROUND: booking types dropped')
            }
            const onSuccessClearStocks = (): void => {
              log('BACKGROUND: stocks dropped')
            }
            const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear()
            requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE)
            const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
            requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
            const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
            requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
            const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
            requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
          }
        })
      },
      exportToFile: async (filename: string): Promise<string> => {
        log('BACKGROUND: exportToFile')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStock[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
          if (dbi !== null) {
            const onComplete = async (): Promise<void> => {
              log('BACKGROUND: exportToFile: data read!')
              const stringifyDB = (): string => {
                let buffer: string
                let i: number
                buffer = '"accounts":[\n'
                for (i = 0; i < accounts.length; i++) {
                  buffer += JSON.stringify(accounts[i])
                  if (i === accounts.length - 1) {
                    buffer += '\n],\n'
                  } else {
                    buffer += ',\n'
                  }
                }
                buffer += i === 0 ? '],\n' : ''

                buffer += '"stocks":[\n'
                for (i = 0; i < stocks.length; i++) {
                  buffer += JSON.stringify(stocks[i])
                  if (i === stocks.length - 1) {
                    buffer += '\n],\n'
                  } else {
                    buffer += ',\n'
                  }
                }
                buffer += i === 0 ? '],\n' : ''
                buffer += '"booking_types":[\n'
                for (i = 0; i < bookingTypes.length; i++) {
                  buffer += JSON.stringify(bookingTypes[i])
                  if (i === bookingTypes.length - 1) {
                    buffer += '\n],\n'
                  } else {
                    buffer += ',\n'
                  }
                }
                buffer += i === 0 ? '],\n' : ''
                buffer += '"bookings":[\n'
                for (i = 0; i < bookings.length; i++) {
                  buffer += JSON.stringify(bookings[i])
                  if (i === bookings.length - 1) {
                    buffer += '\n]\n'
                  } else {
                    buffer += ',\n'
                  }
                }
                return buffer
              }
              let buffer = `{\n"sm": {"cVersion":${browser.runtime.getManifest().version.replace(/\./g, '')}, "cDBVersion":${
                CONS.DB.CURRENT_VERSION
              }, "cEngine":"indexeddb"},\n`
              buffer += stringifyDB()
              buffer += '}'
              const blob = new Blob([buffer], {type: 'application/json'}) // create blob object with all stores data
              const blobUrl = URL.createObjectURL(blob) // create url reference for blob object
              const op: browser.downloads._DownloadOptions = {
                url: blobUrl,
                filename: filename
              }
              const onDownloadChange = (change: browser.downloads._OnChangedDownloadDelta): void => {
                log('BACKGROUND: onDownloadChange')
                browser.downloads.onChanged.removeListener(onDownloadChange)
                if (
                  (change.state !== undefined && change.id > 0) ||
                  (change.state !== undefined && change.state.current === CONS.EVENTS.COMP)
                ) {
                  URL.revokeObjectURL(blobUrl) // release blob object
                }
              }
              browser.downloads.onChanged.addListener(onDownloadChange) // listener to clean up blob object after download.
              await browser.downloads.download(op) // writing blob object into download file
              await notice(['Database exported!'])
              resolve('BACKGROUND: exportToFile: done!')
            }
            const onAbort = (): void => {
              reject(requestTransaction.error)
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly')
            requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
            const onSuccessAccountOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                accounts.push(ev.target.result.value)
                ev.target.result.continue()
              }
            }
            const onSuccessBookingTypeOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                bookingTypes.push(ev.target.result.value)
                ev.target.result.continue()
              }
            }
            const onSuccessBookingOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                bookings.push(ev.target.result.value)
                ev.target.result.continue()
              }
            }
            const onSuccessStockOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                stocks.push(ev.target.result.value)
                ev.target.result.continue()
              }
            }
            const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor()
            requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false)
            const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor()
            requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false)
            const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor()
            requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false)
            const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor()
            requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false)
          }
        })
      },
      exportToStores: async (aid: number): Promise<IStores | string> => {
        log('BACKGROUND: exportToStores')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStockStore[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            //const storage = await browser.storage.local.get([CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID])
            const onComplete = async (): Promise<void> => {
              log('BACKGROUND: exportToStores: all database records sent to frontend!')
              resolve({accounts, bookings, stocks, bookingTypes})
            }
            const onAbort = (): void => {
              reject(requestTransaction.error)
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly')
            requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
            const onSuccessAccountOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                accounts.push(ev.target.result.value)
                ev.target.result.continue()
              }
            }
            const onSuccessBookingTypeOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                if (ev.target.result.value.cAccountNumberID === aid) {
                  bookingTypes.push(ev.target.result.value)
                }
                ev.target.result.continue()
              }
            }
            const onSuccessBookingOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                if (ev.target.result.value.cAccountNumberID === aid) {
                  bookings.push(ev.target.result.value)
                }
                ev.target.result.continue()
              }
            }
            const onSuccessStockOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                if (ev.target.result.value.cAccountNumberID === aid) {
                  stocks.push(ev.target.result.value)
                }
                ev.target.result.continue()
              }
            }
            const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor()
            requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false)
            const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor()
            requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false)
            const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor()
            requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false)
            const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor()
            requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false)
          }
        })
      },
      importStores: async (stores: IStores, all = true) => {
        log('BACKGROUND: importStores', {info: dbi})
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onComplete = async (): Promise<void> => {
              await notice(['All memory records are added to the database!'])
              resolve('BACKGROUND: importStores: all memory records are added to the database!')
            }
            const onAbort = (): void => {
              reject(requestTransaction.error)
            }
            const onError = (ev: Event): void => {
              reject(ev)
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onError, CONS.SYSTEM.ONCE)
            requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE)
            const onSuccessClearBookings = (): void => {
              log('BACKGROUND: bookings dropped')
              for (let i = 0; i < stores.bookings.length; i++) {
                requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add({...stores.bookings[i]})
              }
            }
            const onSuccessClearAccounts = (): void => {
              log('BACKGROUND: accounts dropped')
              for (let i = 0; i < stores.accounts.length; i++) {
                requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add({...stores.accounts[i]})
              }
            }
            const onSuccessClearBookingTypes = (): void => {
              log('BACKGROUND: booking types dropped')
              for (let i = 0; i < stores.bookingTypes.length; i++) {
                requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add({...stores.bookingTypes[i]})
              }
            }
            const onSuccessClearStocks = (): void => {
              log('BACKGROUND: stocks dropped')
              for (let i = 0; i < stores.stocks.length; i++) {
                requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add({...stores.stocks[i]})
              }
            }
            const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear()
            requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE)
            if (all) {
              const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
              requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
            }
            const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
            requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
            const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
            requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
          }
        })
      },
      open: async (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          const onError = (ev: Event): void => {
            reject(ev)
          }
          const onSuccess = (ev: Event): void => {
            if (ev.target instanceof IDBOpenDBRequest) {
              dbi = ev.target.result
              const onVersionChangeSuccess = (): void => {
                if (dbi != null) {
                  dbi.close()
                  notice(['Database is outdated, please reload the page.'])
                }
              }
              dbi.addEventListener('versionchange', onVersionChangeSuccess, CONS.SYSTEM.ONCE)
              resolve('BACKGROUND: database opened successfully!')
            }
          }
          const openDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION)
          log('BACKGROUND: open: database ready', {info: dbi})
          openDBRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          openDBRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
        })
      },
      addAccount: async (record: Omit<IAccount, 'cID'>) => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = async (ev: Event) => {
              if (ev.target instanceof IDBRequest) {
                resolve(ev.target.result)
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add(record)
            requestAdd.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      updateAccount: async (record: IAccount): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = async (ev: Event): Promise<void> => {
              if (ev.target instanceof IDBRequest) {
                resolve('Account updated')
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).put(record)
            requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      deleteAccount: async (id: number): Promise<string> => {
        // const indexOfAccount = this._accounts.findIndex((account: IAccount) => {
        //   return account.cID === id
        // })
        // TODO only allowed for accounts with no bookings, stocks, bookingTypes
        // TODO replace tm(
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              //this._accounts.splice(indexOfAccount, 1)
              //backendAppMessagePort.get(CONS.MESSAGES.DB__DELETE_ACCOUNT)?.postMessage({type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE, data: id})
              resolve('Account deleted')
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).delete(id)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addBookingType: async (record: Omit<IBookingType, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (ev: Event): void => {
              if (ev.target instanceof IDBRequest) {
                resolve(ev.target.result)
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add(record)
            requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      deleteBookingType: async (id: number): Promise<string> => {
        // const indexOfBookingType = this._booking_types.all.findIndex((bookingType: IBookingType) => {
        //   return bookingType.cID === id
        // })
        // const indexOfBookingTypePerAccount = this._booking_types.per_account.findIndex((bookingType: IBookingType) => {
        //   return bookingType.cID === id
        // })
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              resolve('Booking type deleted')
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).delete(id)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addBooking: async (record: Omit<IBooking, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (ev: Event): void => {
              if (ev.target instanceof IDBRequest) {
                resolve(ev.target.result)
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add(record)
            requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      deleteBooking: async (id: number): Promise<string> => {
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === id
        // })
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              resolve('Booking deleted')
            }
            const onError = (ev: Event): void => {
              reject(ev)
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(id)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addStock: async (record: Omit<IStock, 'cID'>): Promise<string | number> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (ev: Event): void => {
              if (ev.target instanceof IDBRequest) {
                resolve(ev.target.result)
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).add(record)
            requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      updateStock: async (record: IStock): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = async (ev: Event): Promise<void> => {
              if (ev.target instanceof IDBRequest) {
                resolve('Stock updated')
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).put(record)
            requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      updateBooking: async (record: IBooking): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = async (ev: Event): Promise<void> => {
              if (ev.target instanceof IDBRequest) {
                resolve('Booking updated')
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
            const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).put(record)
            requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      deleteStock: async (id: number): Promise<string> => {
        log('BACKGROUND: deleteStock')
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === id
        // })
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              //this._bookings.all.splice(indexOfBooking, 1)
              //backendAppMessagePort.postMessage({type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE, data: id})
              //this.sumBookings()
              console.error('SFDASF--------------')
              resolve('Stock deleted')
              return
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
              return
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).delete(id)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      }
    }
  }
  const useFetch = () => {
    return {
      fetchCompanyData: async (isin: string): Promise<FetchedResources.ICompanyData> => {
        return new Promise(async (resolve, reject) => {
          let sDocument: Document
          let company = ''
          let child: ChildNode | undefined
          let wkn: string
          let symbol: string
          const service: IService | undefined = CONS.SERVICES.TGATE
          let tables: NodeListOf<HTMLTableRowElement>
          let firstResponse: Response
          let result: FetchedResources.ICompanyData = {
            company: '',
            wkn: '',
            symbol: ''
          }
          if (service !== undefined) {
            firstResponse = await fetch(service.QUOTE + isin)
            if (
              firstResponse.url.length === 0 ||
              !firstResponse.ok ||
              firstResponse.status >= CONS.STATES.SRV ||
              (firstResponse.status > 0 &&
                firstResponse.status < CONS.STATES.SUCCESS)
            ) {
              await notice(['First request failed'])
              reject('First request failed')
            } else {
              const secondResponse = await fetch(firstResponse.url)
              if (
                !secondResponse.ok ||
                secondResponse.status >= CONS.STATES.SRV ||
                (secondResponse.status > 0 &&
                  secondResponse.status < CONS.STATES.SUCCESS)
              ) {
                await notice(['Second request failed'])
                reject('Second request failed')
              } else {
                const secondResponseText = await secondResponse.text()
                sDocument = new DOMParser().parseFromString(
                  secondResponseText,
                  'text/html'
                )
                tables = sDocument.querySelectorAll('table > tbody tr')
                child = sDocument?.querySelector('#col1_content')?.childNodes[1]
                company =
                  child?.textContent !== null
                    ? child?.textContent.split(',')[0].trim() ?? ''
                    : ''
                if (
                  !company.includes('Die Gattung wird') &&
                  tables[1].cells !== null &&
                  tables.length > 0
                ) {
                  wkn = tables[1].cells[0].textContent ?? ''
                  symbol = tables[1].cells[1].textContent ?? ''
                  result = {
                    company,
                    wkn,
                    symbol
                  }
                  resolve(result)
                } else {
                  reject('Unexpected error occurred')
                }
              }
            }
          }
        })
      },
      fetchMinRateMaxData: async (storageOnline: FetchedResources.TIdIsin[]): Promise<FetchedResources.IMinRateMaxData[]> => {
        console.log('BACKGROUND: fetchMinRateMaxData')
        return new Promise(async (resolve, reject) => {
          const storageService = await browser.storage.local.get(CONS.STORAGE.PROPS.SERVICE)
          const serviceName = storageService[CONS.STORAGE.PROPS.SERVICE].name
          const _fnet = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url) // .then(async (firstResponse) => {
                const secondResponse = await fetch(firstResponse.url)
                const secondResponseText = await secondResponse.text()
                const onlineDocument = new DOMParser().parseFromString(
                  secondResponseText,
                  'text/html'
                )
                const onlineNodes = onlineDocument.querySelectorAll(
                  '#snapshot-value-fst-current-0 > span'
                )
                const onlineArticleNodes = onlineDocument.querySelectorAll(
                  'main div[class=accordion__content]'
                )
                let onlineMin = '0'
                let onlineMax = '0'
                let onlineCurrency = 'EUR'
                let onlineRate = '0'
                if (onlineArticleNodes.length > 0) {
                  const onlineMmNodes =
                    onlineArticleNodes[0].querySelectorAll('table > tbody > tr')
                  for (let i = 0; i < onlineMmNodes.length; i++) {
                    if (onlineMmNodes[i].textContent?.includes('1 Jahr')) {
                      const tr = onlineMmNodes[i].querySelectorAll('td')
                      onlineMin =
                        tr[3].textContent ?? '0'
                      onlineMax =
                        tr[4].textContent ?? '0'
                    }
                  }
                }
                if (onlineNodes.length > 1) {
                  onlineCurrency = onlineNodes[1].textContent ?? ''
                  onlineRate = onlineNodes[0].textContent ?? ''
                }
                return {
                  id: urlObj.id,
                  isin: '',
                  rate: onlineRate,
                  min: onlineMin,
                  max: onlineMax,
                  cur: onlineCurrency
                }
              })
            )
          }
          const _ard = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url) // .then(async (firstResponse) => {
                const firstResponseText = await firstResponse.text()
                const firstResponseDocument = new DOMParser().parseFromString(
                  firstResponseText,
                  'text/html'
                )
                const firstResponseRows = firstResponseDocument.querySelectorAll(
                  '#desktopSearchResult > table > tbody > tr'
                )
                if (firstResponseRows.length > 0) {
                  const url = firstResponseRows[0].getAttribute('onclick') ?? ''
                  const secondResponse = await fetch(
                    url.replace('document.location=\'', '').replace('\';', '')
                  )
                  const secondResponseText = await secondResponse.text()
                  const onlineDocument = new DOMParser().parseFromString(
                    secondResponseText,
                    'text/html'
                  )
                  const onlineCurrency = 'EUR'
                  const ardRows: NodeListOf<HTMLTableRowElement> =
                    onlineDocument.querySelectorAll(
                      '#USFkursdaten table > tbody tr'
                    )
                  const onlineRate = (
                    ardRows[0].cells[1].textContent ?? '0'
                  ).replace('€', '')
                  const onlineMin = (
                    ardRows[6].cells[1].textContent ?? '0'
                  ).replace('€', '')
                  const onlineMax = (
                    ardRows[7].cells[1].textContent ?? '0'
                  ).replace('€', '')
                  return {
                    id: urlObj.id,
                    isin: '',
                    rate: onlineRate,
                    min: onlineMin,
                    max: onlineMax,
                    cur: onlineCurrency
                  }
                } else {
                  return {
                    id: urlObj.id,
                    isin: '',
                    rate: '0',
                    min: '0',
                    max: '0',
                    cur: 'EUR'
                  }
                }
              })
            )
          }
          const _wstreet = async (urls: IUrlWithId[], homeUrl: string): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url)
                const firstResponseJson = await firstResponse.json()
                const url2 = homeUrl + firstResponseJson.result[0].link
                const secondResponse = await fetch(url2)
                const secondResponseText = await secondResponse.text()
                const onlineDocument = new DOMParser().parseFromString(
                  secondResponseText,
                  'text/html'
                )
                const onlineRates = onlineDocument.querySelectorAll('div.c2 table')
                const onlineMinMax = onlineDocument.querySelectorAll('div.fundamental > div > div.float-start')
                let onlineCurrency = ''
                const onlineRate =
                  onlineRates[0]
                    ?.querySelectorAll('tr')[1]
                    ?.querySelectorAll('td')[1].textContent ?? '0'
                const onlineMax = onlineMinMax[1].textContent?.split('Hoch')[1]
                const onlineMin = onlineMinMax[1].textContent?.split('Hoch')[0].split('WochenTief')[1]
                if (onlineRate.includes('USD')) {
                  onlineCurrency = 'USD'
                } else if (onlineRate.includes('EUR')) {
                  onlineCurrency = 'EUR'
                }
                return {
                  id: urlObj.id ?? 0,
                  isin: '',
                  rate: onlineRate,
                  min: onlineMin ?? '',
                  max: onlineMax ?? '',
                  cur: onlineCurrency
                }
              })
            )
          }
          const _goyax = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url) // .then(async (firstResponse) => {
                const secondResponse = await fetch(firstResponse.url)
                const secondResponseText = await secondResponse.text()
                const onlineDocument = new DOMParser().parseFromString(
                  secondResponseText,
                  'text/html'
                )
                const onlineNodes = onlineDocument.querySelectorAll(
                  'div#instrument-ueberblick > div'
                )
                const onlineRateNodes =
                  onlineNodes[1].querySelectorAll('ul.list-rows')
                const onlineRateAll =
                  onlineRateNodes[1].querySelectorAll('li')[3].textContent ?? '0'
                const onlineRate = onlineRateAll.split(')')[1] ?? '0'
                const onlineStatisticRows = onlineNodes[0]
                  .querySelectorAll('table')[1]
                  .querySelectorAll('tr')
                const onlineMax =
                  onlineStatisticRows[4].querySelectorAll('td')[3].textContent ??
                  '0'
                const onlineMin =
                  onlineStatisticRows[5].querySelectorAll('td')[3].textContent ??
                  '0'
                const onlineCurrency = 'EUR'
                return {
                  id: urlObj.id,
                  isin: '',
                  rate: onlineRate,
                  min: onlineMin,
                  max: onlineMax,
                  cur: onlineCurrency
                }
              })
            )
          }
          const _acheck = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url) // .then(async (firstResponse) => {
                let onlineCurrency = ''
                const secondResponse = await fetch(firstResponse.url)
                const secondResponseText = await secondResponse.text()
                const onlineDocument = new DOMParser().parseFromString(
                  secondResponseText,
                  'text/html'
                )
                const onlineTables =
                  onlineDocument.querySelectorAll('#content table')
                if (onlineTables.length > 1) {
                  const onlineRate =
                    onlineTables[0]
                      .querySelectorAll('tr')[1]
                      .querySelectorAll('td')[1].textContent ?? '0'
                  const findCurrency =
                    onlineTables[0]
                      .querySelectorAll('tr')[1]
                      .querySelectorAll('td')[2].textContent ?? '0'
                  const onlineMin =
                    onlineTables[2]
                      .querySelectorAll('tr')[3]
                      .querySelectorAll('td')[2].textContent ?? '0'
                  const onlineMax =
                    onlineTables[2]
                      .querySelectorAll('tr')[3]
                      .querySelectorAll('td')[1].textContent ?? '0'
                  if (findCurrency.includes('$')) {
                    onlineCurrency = 'USD'
                  } else if (findCurrency.includes('€')) {
                    onlineCurrency = 'EUR'
                  }
                  return {
                    id: urlObj.id,
                    isin: '',
                    rate: onlineRate,
                    min: onlineMin,
                    max: onlineMax,
                    cur: onlineCurrency
                  }
                } else {
                  return {
                    id: -1,
                    isin: '',
                    rate: '0',
                    min: '0',
                    max: '0',
                    cur: 'EUR'
                  }
                }
              })
            )
          }
          const _tgate = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return await Promise.all(
              urls.map(async (urlObj: IUrlWithId): Promise<FetchedResources.IMinRateMaxData> => {
                const firstResponse = await fetch(urlObj.url)
                const onlineCurrency = 'EUR'
                const onlineMax = '0'
                const onlineMin = '0'
                const onlineDocument = new DOMParser().parseFromString(
                  await firstResponse.text(),
                  'text/html'
                )
                const resultask =
                  onlineDocument.querySelector('#ask') !== null
                    ? onlineDocument.querySelector('#ask')?.textContent
                    : '0'
                const resultbid =
                  onlineDocument.querySelector('#bid') !== null
                    ? onlineDocument.querySelector('#bid')?.textContent
                    : '0'
                const quote = mean([toNumber(resultbid), toNumber(resultask)])
                const onlineRate = quote.toString()
                return {
                  id: urlObj.id,
                  isin: '',
                  rate: onlineRate,
                  min: onlineMin,
                  max: onlineMax,
                  cur: onlineCurrency
                }
              })
            )
          }
          const _select = async (urls: IUrlWithId[]): Promise<FetchedResources.IMinRateMaxData[]> => {
            return new Promise(async (resolve, reject) => {
              const service = CONS.SERVICES.MAP.get(serviceName)
              switch (serviceName) {
                case 'fnet':
                  resolve(await _fnet(urls))
                  break
                case 'ard':
                  resolve(await _ard(urls))
                  break
                case 'wstreet':
                  if (service !== undefined) {
                    resolve(await _wstreet(urls, service.HOME))
                  } else {
                    reject('Undefined service constant!')
                  }
                  break
                case 'goyax':
                  resolve(await _goyax(urls))
                  break
                case 'acheck':
                  resolve(await _acheck(urls))
                  break
                case 'tgate':
                  resolve(await _tgate(urls))
                  break
                default:
                  throw new Error('ONLINE: fetchMinRateMaxData: unknown service!')
              }
            })
          }
          const urls: IUrlWithId[] = []
          if (storageOnline.length > 0) {
            for (let i = 0; i < storageOnline.length; i++) {
              const service = CONS.SERVICES.MAP.get(serviceName)
              const isin = storageOnline[i].isin
              if (isin !== undefined && service !== undefined && service !== null) {
                urls.push({
                  url: service.QUOTE + isin,
                  id: storageOnline[i].id ?? -1
                })
              }
            }
          } else {
            reject('System Error')
          }
          resolve(await _select(urls))
        })
      },
      fetchDailyChangeData: async (table: string, mode = CONS.SERVICES.TGATE.CHANGES.SMALL): Promise<FetchedResources.IDailyChangesData[]> => {
        console.log('BACKGROUND: fetchDailyChangesData')
        let valuestr: string
        let company: string
        let sDocument: Document
        let trCollection: NodeListOf<HTMLTableRowElement>
        let url = CONS.SERVICES.TGATE.CHB_URL ?? '' + table
        let selector = '#kursliste_abc > tr'
        if (mode === CONS.SERVICES.TGATE.CHANGES.SMALL) {
          url = CONS.SERVICES.TGATE.CHS_URL ?? '' + table
          selector = '#kursliste_daten > tr'
        }
        const convertHTMLEntities = (str: string | null): string => {
          const entities = new Map([
            ['aum', 'ä'],
            ['Aum', 'Ä'],
            ['oum', 'ö'],
            ['Oum', 'Ö'],
            ['uum', 'ü'],
            ['Uum', 'Ü'],
            ['amp', '&'],
            ['eac', 'é'],
            ['Eac', 'É'],
            ['eci', 'ê'],
            ['Eci', 'Ê'],
            ['oac', 'ó'],
            ['Oac', 'Ó'],
            ['ael', 'æ'],
            ['Ael', 'Æ']
          ])
          const fMatch = (match: string): string => {
            return entities.get(match.substring(1, 4)) ?? ''
          }
          let result = ''
          if (str !== null) {
            result = str
              .trim()
              .replace(new RegExp(CONS.SYSTEM.HTML_ENTITY, 'g'), fMatch)
          }
          return result
        }
        const entry: FetchedResources.IDailyChangesData = {
          key: '',
          value: {
            percentChange: '',
            change: 0,
            stringChange: ''
          }
        }
        const firstResponse = await fetch(url)
        const _changes: FetchedResources.IDailyChangesData[] = []
        if (
          firstResponse.url.length === 0 ||
          !firstResponse.ok ||
          firstResponse.status >= CONS.STATES.SRV ||
          (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)
        ) {
          await notice(['Request failed'])
        } else {
          const firstResponseText = await firstResponse.text()
          sDocument = new DOMParser().parseFromString(
            firstResponseText,
            'text/html'
          )
          trCollection = sDocument.querySelectorAll(selector)
          for (let i = 0; i < trCollection.length; i++) {
            valuestr = trCollection[i].childNodes[11].textContent ?? ''
            company = convertHTMLEntities(
              trCollection[i].childNodes[1].textContent ?? ''
            ).replace('<wbr>', '')
            entry.key = company.toUpperCase()
            entry.value = {
              percentChange: valuestr.replace(/\t/g, ''),
              change: toNumber(valuestr),
              stringChange: toNumber(valuestr).toString()
            }
            _changes.push({...entry})
          }
          console.error(trCollection, _changes)
        }
        return _changes
      },
      fetchExchangesData: async (exchangeCodes: string[]): Promise<FetchedResources.IExchangesData[]> => {
        console.log('BACKGROUND: fetchExchangesData')
        const service = CONS.SERVICES.FX
        const fExUrl = (code: string): string => {
          if (service !== undefined) {
            return `${service.QUOTE}${code.substring(0, 3)}&cp_input=${code.substring(3, 6)}&amount_from=1`
          } else {
            throw new Error('Undefined service constant!')
          }
        }
        return new Promise(async (resolve, reject): Promise<FetchedResources.IExchangesData[]> => {
          const result: FetchedResources.IExchangesData[] = []
          for (let i = 0; i < exchangeCodes.length; i++) {
            const firstResponse = await fetch(fExUrl(exchangeCodes[i]))
            if (
              !firstResponse.ok ||
              firstResponse.status >= CONS.STATES.SRV ||
              (firstResponse.status > 0 &&
                firstResponse.status < CONS.STATES.SUCCESS)
            ) {
              await notice([firstResponse.statusText])
              reject('System Error')
            }
            const firstResponseText = await firstResponse.text()
            const resultDocument: Document = new DOMParser().parseFromString(
              firstResponseText,
              'text/html'
            )
            const resultTr = resultDocument.querySelector(
              'form#formcalculator.formcalculator > div'
            )
            if (resultTr !== undefined && resultTr !== null) {
              const resultString = resultTr.getAttribute('data-rate') //?.textContent ?? ''
              const resultMatchArray = resultString?.match(/[0-9]*\.?[0-9]+/g) ?? ['1']
              const exchangeRate = Number.parseFloat(resultMatchArray[0])
              // noinspection JSUnresolvedReference
              result.push({key: exchangeCodes[i], value: exchangeRate})
            }
          }
          resolve(result)
          return result
        })
      },
      fetchMaterialData: async (): Promise<FetchedResources.IMaterialData[]> => {
        console.log('BACKGROUND: fetchMaterialData')
        return new Promise(async (resolve, reject) => {
          const materials: FetchedResources.IMaterialData[] = []
          const firstResponse = await fetch(CONS.SERVICES.MAP.get('fnet')?.MATERIALS ?? '')
          if (
            !firstResponse.ok ||
            firstResponse.status >= CONS.STATES.SRV ||
            (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)
          ) {
            await notice([firstResponse.statusText])
            reject('System error')
          }
          const firstResponseText = await firstResponse.text()
          const resultDocument: Document = new DOMParser().parseFromString(
            firstResponseText,
            'text/html'
          )
          const resultTr = resultDocument.querySelectorAll(
            '#commodity_prices > table > tbody tr'
          )
          for (let i = 0; i < resultTr.length; i++) {
            const material = CONS.SETTINGS.MATERIALS.get(resultTr[i].children[0].textContent ?? '')
            if (
              resultTr[i].children[0].tagName === 'TD' &&
              material !== undefined
            ) {
              materials.push({
                key: material,
                value: toNumber(resultTr[i].children[1].textContent)
              })
            }
          }
          resolve(materials)
        })
      },
      fetchIndexData: async (): Promise<FetchedResources.IIndexData[]> => {
        console.log('BACKGROUND: fetchIndexData')
        return new Promise(async (resolve, reject) => {
          const indexes: FetchedResources.IIndexData[] = []
          const indexesKeys = Object.keys(CONS.SETTINGS.INDEXES)
          const indexesValues: string[] = Object.values(CONS.SETTINGS.INDEXES)
          const firstResponse = await fetch(CONS.SERVICES.MAP.get('fnet')?.INDEXES ?? '')
          if (
            !firstResponse.ok ||
            firstResponse.status >= CONS.STATES.SRV ||
            (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)
          ) {
            await notice([firstResponse.statusText])
            reject(firstResponse.statusText)
          }
          const firstResponseText = await firstResponse.text()
          const resultDocument: Document = new DOMParser().parseFromString(
            firstResponseText,
            'text/html'
          )
          const resultTr = resultDocument.querySelectorAll('.index-world-map a')
          for (let i = 0; i < indexesKeys.length; i++) {
            for (let j = 0; j < resultTr.length; j++) {
              if (
                indexesValues[i].includes(
                  resultTr[j].getAttribute('title') ?? ''
                ) &&
                resultTr[j].children[0].textContent !== undefined
              ) {
                indexes.push({
                  key: indexesKeys[i],
                  value: toNumber(resultTr[j].children[0].textContent)
                })
              }
            }
          }
          resolve(indexes)
        })
      },
      fetchDateData: async (obj: FetchedResources.TIdIsin): Promise<FetchedResources.IDatesData> => {
        console.log('BACKGROUND: fetchDatesData')
        const gmqf = {gm: 0, qf: 0}
        const parseGermanDate = (germanDateString: string): number => {
          const parts = germanDateString.match(/(\d+)/g) ?? ['01', '01', '1970']
          const year =
            parts.length === 3 && parts[2].length === 4 ? parts[2] : '1970'
          const month = parts.length === 3 ? parts[1].padStart(2, '0') : '01'
          const day = parts.length === 3 ? parts[0].padStart(2, '0') : '01'
          return new Date(`${year}-${month}-${day}`).getTime()
        }
        const firstResponse = await fetch(
          'https://www.finanzen.net/suchergebnis.asp?_search=' + obj.isin
        )
        if (
          firstResponse.url.length === 0 ||
          !firstResponse.ok ||
          firstResponse.status >= CONS.STATES.SRV ||
          (firstResponse.status > 0 && firstResponse.status < CONS.STATES.SUCCESS)
        ) {
          console.error('BACKGROUND: fetchDatesData: First request failed')
        } else {
          const atoms = firstResponse.url.split('/')
          const stockName = atoms[atoms.length - 1].replace('-aktie', '')
          const secondResponse = await fetch(
            'https://www.finanzen.net/termine/' + stockName
          )
          if (
            !secondResponse.ok ||
            secondResponse.status >= CONS.STATES.SRV ||
            (secondResponse.status > 0 &&
              secondResponse.status < CONS.STATES.SUCCESS)
          ) {
            console.error('BACKGROUND: fetchDatesData: Second request failed')
          } else {
            const secondResponseText = await secondResponse.text()
            const qfgmDocument = new DOMParser().parseFromString(secondResponseText, 'text/html')
            const tables = qfgmDocument.querySelectorAll('.table')
            const rows = tables[1].querySelectorAll('tr')
            let stopGm = false
            let stopQf = false
            const gmqfString = {gm: '01.01.1970', qf: '01.01.1970'}
            for (let j = 0; j < rows.length && !!(rows[j].cells[3]); j++) {
              const row = rows[j].cells[3].textContent?.replaceAll('(e)*', '').trim() ?? '01.01.1970'
              if (
                rows[j].cells[0].textContent === 'Quartalszahlen' &&
                row !== '01.01.1970' &&
                row.length === 10 &&
                !stopQf
              ) {
                gmqfString.qf = row
                stopQf = true
              } else if (
                rows[j].cells[0].textContent === 'Hauptversammlung' &&
                row !== '01.01.1970' &&
                row.length === 10 &&
                !stopGm
              ) {
                gmqfString.gm = row
                stopGm = true
              }
              if (stopQf && stopGm) break
            }
            gmqf.qf =
              gmqfString.qf !== undefined && gmqfString.qf !== ''
                ? parseGermanDate(gmqfString.qf)
                : 0
            gmqf.gm =
              gmqfString.gm !== undefined && gmqfString.gm !== ''
                ? parseGermanDate(gmqfString.gm)
                : 0
          }
        }
        return {key: obj.id, value: gmqf}
      }
    }
  }

  const {
    truncateTables,
    exportToFile,
    addAccount,
    updateAccount,
    deleteAccount,
    addBooking,
    deleteBooking,
    addBookingType,
    deleteBookingType,
    addStock,
    updateStock,
    updateBooking,
    exportToStores,
    importStores,
    deleteStock,
    open
  } = useDatabase()
  const {
    fetchCompanyData,
    fetchMinRateMaxData,
    fetchDailyChangeData,
    fetchExchangesData,
    fetchMaterialData,
    fetchIndexData,
    fetchDateData
  } = useFetch()
  let dbi: IDBDatabase

  // NOTE: onInstall runs at addon install, addon update and firefox update
  const onInstall = async (): Promise<void> => {
    console.log('BACKGROUND: onInstall')
    const installStorageLocal = async () => {
      const storageLocal = await browser.storage.local.get()
      if (storageLocal[CONS.STORAGE.PROPS.SKIN] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.SKIN]]: CONS.DEFAULTS.STORAGE.SKIN})
      }
      if (storageLocal[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]]: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID})
      }
      if (storageLocal[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.BOOKINGS_PER_PAGE]]: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE})
      }
      if (storageLocal[CONS.STORAGE.PROPS.STOCKS_PER_PAGE] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.STOCKS_PER_PAGE]]: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE})
      }
      if (storageLocal[CONS.STORAGE.PROPS.PARTNER] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.PARTNER]]: CONS.DEFAULTS.STORAGE.PARTNER})
      }
      if (storageLocal[CONS.STORAGE.PROPS.SERVICE] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.SERVICE]]: CONS.DEFAULTS.STORAGE.SERVICE})
      }
      if (storageLocal[CONS.STORAGE.PROPS.EXCHANGES] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.EXCHANGES]]: CONS.DEFAULTS.STORAGE.EXCHANGES})
      }
      if (storageLocal[CONS.STORAGE.PROPS.INDEXES] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.INDEXES]]: CONS.DEFAULTS.STORAGE.INDEXES})
      }
      if (storageLocal[CONS.STORAGE.PROPS.MARKETS] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.MARKETS]]: CONS.DEFAULTS.STORAGE.MARKETS})
      }
      if (storageLocal[CONS.STORAGE.PROPS.MATERIALS] === undefined) {
        await browser.storage.local.set({[storageLocal[CONS.STORAGE.PROPS.MATERIALS]]: CONS.DEFAULTS.STORAGE.MATERIALS})
      }
      console.log('BACKGROUND: installStorageLocal: DONE')
    }
    const onSuccess = (ev: Event): void => {
      if (ev.target instanceof IDBRequest) {
        ev.target.result.close()
      }
      console.log('BACKGROUND: onInstall: DONE')
    }
    const onError = (ev: Event): void => {
      console.error('BACKGROUND: onError: ', ev)
    }
    const onUpgradeNeeded = async (ev: Event): Promise<void> => {
      if (ev instanceof IDBVersionChangeEvent) {
        console.info('BACKGROUND: onInstall: onUpgradeNeeded', ev.newVersion)
        const createDB = (): void => {
          console.log('BACKGROUND: onInstall: onUpgradeNeeded: createDB')
          const requestCreateAccountStore = dbOpenRequest.result.createObjectStore(
            CONS.DB.STORES.ACCOUNTS.NAME,
            {
              keyPath: CONS.DB.STORES.ACCOUNTS.FIELDS.ID,
              autoIncrement: true
            })
          const requestCreateBookingStore = dbOpenRequest.result.createObjectStore(
            CONS.DB.STORES.BOOKINGS.NAME,
            {
              keyPath: CONS.DB.STORES.BOOKINGS.FIELDS.ID,
              autoIncrement: true
            }
          )
          const requestCreateBookingTypeStore = dbOpenRequest.result.createObjectStore(
            CONS.DB.STORES.BOOKING_TYPES.NAME,
            {
              keyPath: CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID,
              autoIncrement: true
            }
          )
          const requestCreateStockStore = dbOpenRequest.result.createObjectStore(
            CONS.DB.STORES.STOCKS.NAME,
            {
              keyPath: CONS.DB.STORES.STOCKS.FIELDS.ID,
              autoIncrement: true
            }
          )
          requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER, {unique: true})
          requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
          requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k1`, CONS.DB.STORES.BOOKINGS.FIELDS.DATE, {unique: false})
          requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k2`, CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, {unique: false})
          requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k3`, CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, {unique: false})
          requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k4`, CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID, {unique: false})
          requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk1`, CONS.DB.STORES.STOCKS.FIELDS.ISIN, {unique: true})
          requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk2`, CONS.DB.STORES.STOCKS.FIELDS.SYMBOL, {unique: true})
          requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k1`, CONS.DB.STORES.STOCKS.FIELDS.FADE_OUT, {unique: false})
          requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k2`, CONS.DB.STORES.STOCKS.FIELDS.FIRST_PAGE, {unique: false})
        }
        // const updateDB = (): void => {
        //   log('BACKGROUND: onInstall: onUpgradeNeeded: updateDB')
        //   // const optFalse: IDBIndexParameters = {unique: false}
        //   // const onSuccessStocks = (ev: TIDBRequestEvent): void => {
        //   //   log(
        //   //     'BACKGROUND: onInstall: onUpgradeNeeded: createDB: onSuccessStocks'
        //   //   )
        //   //   const cursor: IDBCursorWithValue | null = ev.target.result
        //   //   if (cursor !== null) {
        //   //     const stock: IStock = cursor.value
        //   //     cursor.update(migrateStock({...stock}))
        //   //     cursor.continue()
        //   //   } else {
        //   //     stocksOpenCursorRequest?.removeEventListener(
        //   //       CONS.EVENTS.SUC,
        //   //       onSuccessStocks,
        //   //       false
        //   //     )
        //   //     const onSuccessTransfers = (ev: TIDBRequestEvent): void => {
        //   //       log(
        //   //         'BACKGROUND: onUpgradeNeeded: fCreateDB: onSuccessTransfers'
        //   //       )
        //   //       const cursor: IDBCursorWithValue | null = ev.target.result
        //   //       if (cursor !== null) {
        //   //         const transfer: ITransfer = cursor.value
        //   //         cursor.update(migrateTransfer({...transfer}))
        //   //         cursor.continue()
        //   //       } else {
        //   //         stocksOpenCursorRequest?.removeEventListener(
        //   //           CONS.EVENTS.SUC,
        //   //           onSuccessTransfers,
        //   //           false
        //   //         )
        //   //       }
        //   //     }
        //   //     if (dbOpenRequest?.transaction === null) {
        //   //       console.error('BACKGROUND: open database error')
        //   //     } else if (
        //   //       !dbOpenRequest.transaction
        //   //         ?.objectStore(CONS.DB.STORES.S)
        //   //         .indexNames.contains('stocks_k2')
        //   //     ) {
        //   //       dbOpenRequest.transaction
        //   //         ?.objectStore(CONS.DB.STORES.S)
        //   //         .createIndex('stocks_k2', 'cFadeOut', optFalse)
        //   //     }
        //   //     const requestTransfersOpenCursor:
        //   //       | IDBRequest<IDBCursorWithValue | null>
        //   //       | undefined = dbOpenRequest.transaction?.objectStore(CONS.DB.STORES.T).openCursor()
        //   //     requestTransfersOpenCursor?.addEventListener(
        //   //       CONS.EVENTS.SUC,
        //   //       onSuccessTransfers,
        //   //       false
        //   //     )
        //   //   }
        //   // }
        //   // const onErrorStocks = (err: ErrorEvent): void => {
        //   //   stocksOpenCursorRequest?.removeEventListener(
        //   //     CONS.EVENTS.ERR,
        //   //     onError,
        //   //     false
        //   //   )
        //   //   console.error(err.message)
        //   // }
        //   // const stocksOpenCursorRequest:
        //   //   | IDBRequest<IDBCursorWithValue | null>
        //   //   | undefined = dbOpenRequest?.transaction?.objectStore(CONS.DB.STORES.S).openCursor()
        //   // stocksOpenCursorRequest?.addEventListener(
        //   //   CONS.EVENTS.ERR,
        //   //   onErrorStocks,
        //   //   false
        //   // )
        //   // stocksOpenCursorRequest?.addEventListener(
        //   //   CONS.EVENTS.SUC,
        //   //   onSuccessStocks,
        //   //   false
        //   // )
        //   // for (
        //   //   let i = 0;
        //   //   i < dbOpenRequest.result.objectStoreNames.length;
        //   //   i++
        //   // ) {
        //   //   if (
        //   //     dbOpenRequest.result.objectStoreNames[i] !== CONS.DB.STORES.S &&
        //   //     dbOpenRequest.result.objectStoreNames[i] !== CONS.DB.STORES.T
        //   //   ) {
        //   //     dbOpenRequest.result.deleteObjectStore(
        //   //       dbOpenRequest.result.objectStoreNames[i]
        //   //     )
        //   //   }
        //   // }
        // }
        // const updateStorageLocal = async () => {
        //   const storageKeys = Object.keys(CONS.DEFAULTS.STORAGE)
        //   const storageValues = Object.values(CONS.DEFAULTS.STORAGE)
        //   const storage: IStorageLocal = await browser.storage.local.get(storageKeys)
        //   for (let i = 0; i < storageKeys.length; i++) {
        //     if (storage[storageKeys[i]] === undefined) {
        //       await browser.storage.local.set({
        //         [storageKeys[i]]: storageValues[i]
        //       })
        //     }
        //   }
        // }
        //
        if (ev.oldVersion === 0) {
          createDB()
        } else if (ev.oldVersion > 25) {
          // updateDB()
        }
        await installStorageLocal()
      }
    }
    const dbOpenRequest: IDBOpenDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.CURRENT_VERSION)
    dbOpenRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
    dbOpenRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
    dbOpenRequest.addEventListener(CONS.EVENTS.UPG, onUpgradeNeeded, CONS.SYSTEM.ONCE)
  }
  const onClick = async (): Promise<void> => {
    log('BACKGROUND: onClick')
    await open()
    const foundTabs = await browser.tabs.query({url: `${browser.runtime.getURL(CONS.SYSTEM.INDEX)}`})
    // NOTE: any async webextension API call which triggers a corresponding event listener will reload background.js.
    if (foundTabs.length === 0) {
      const extensionTab = await browser.tabs.create({
        url: browser.runtime.getURL(CONS.SYSTEM.INDEX),
        active: true
      })
      const extensionTabIdStr = (extensionTab.id ?? -1).toString()
      sessionStorage.setItem('sExtensionTabId', extensionTabIdStr)
    } else {
      await browser.windows.update(foundTabs[0].windowId ?? 0, {
        focused: true
      })
      await browser.tabs.update(foundTabs[0].id ?? 0, {active: true})
    }
  }
  const onAppMessage = async (appMsg: string): Promise<string> => {
    log('BACKGROUND: onAppMessage', {info: appMsg})
    return new Promise(async (resolve, reject) => {
      const appMessage = JSON.parse(appMsg)
      let response: string
      switch (appMessage.type) {
        case CONS.MESSAGES.STORAGE__GET_ALL:
          const storageLocal1 = await browser.storage.local.get()
          response = JSON.stringify({
            type: CONS.MESSAGES.STORAGE__GET_ALL__RESPONSE,
            data: storageLocal1
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__CLOSE:
          if (dbi !== undefined) {
            dbi.close()
            resolve('DB closed')
          } else {
            resolve('No DB open')
          }
          break
        case CONS.MESSAGES.DB__DELETE_ALL:
          await truncateTables()
          resolve('DB empty')
          break
        case CONS.MESSAGES.DB__EXPORT:
          await exportToFile(appMessage.data)
          resolve('DB exported')
          break
        case CONS.MESSAGES.STORAGE__SET_ID:
          await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: appMessage.data})
          //await exportToStores()
          resolve('ID set')
          break
        case CONS.MESSAGES.DB__GET_STORES:
          const stores = await exportToStores(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__GET_STORES__RESPONSE,
            data: stores
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__ADD_STORES_25:
          const importStoresData25: IStores = appMessage.data
          await importStores(importStoresData25, false)
          await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData25.accounts[0].cID})
          resolve('Stores added')
          break
        case CONS.MESSAGES.DB__ADD_STORES:
          const importStoresData: IStores = appMessage.data
          await importStores(importStoresData)
          await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: importStoresData.accounts[0].cID})
          resolve('Stores added')
          break
        case CONS.MESSAGES.DB__ADD_ACCOUNT:
          const addAccountData: Omit<IAccount, 'cID'> = appMessage.data
          const addAccountID = await addAccount(addAccountData)
          if (typeof addAccountID === 'number') {
            const completeAccount: IAccount = {cID: addAccountID, ...addAccountData}
            response = JSON.stringify({
              //type: CONS.MESSAGES.DB__ADD_ACCOUNT__RESPONSE,
              data: completeAccount
            })
            await browser.storage.local.set({[CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID]: addAccountID})
            resolve(response)
          }
          break
        case CONS.MESSAGES.DB__ADD_BOOKING:
          const addBookingData: Omit<IBooking, 'cID'> = appMessage.data
          const addBookingID = await addBooking(addBookingData)
          if (typeof addBookingID === 'number') {
            const completeBooking: IBooking = {cID: addBookingID, ...addBookingData}
            response = JSON.stringify({
              type: CONS.MESSAGES.DB__ADD_BOOKING__RESPONSE,
              data: completeBooking
            })
            resolve(response)
          }
          break
        case CONS.MESSAGES.DB__ADD_BOOKING_TYPE:
          const addBookingTypeData: Omit<IBookingType, 'cID'> = appMessage.data
          const addBookingTypeID = await addBookingType(addBookingTypeData)
          if (typeof addBookingTypeID === 'number') {
            const completeBookingType: IBookingType = {cID: addBookingTypeID, ...addBookingTypeData}
            response = JSON.stringify({
              type: CONS.MESSAGES.DB__ADD_BOOKING_TYPE__RESPONSE,
              data: completeBookingType
            })
            resolve(response)
          }
          break
        case CONS.MESSAGES.DB__ADD_STOCK:
          const addStockData: Omit<IStock, 'cID'> = appMessage.data
          const addStockID = await addStock(addStockData)
          if (typeof addStockID === 'number') {
            const completeStock: IStock = {cID: addStockID, ...addStockData}
            response = JSON.stringify({
              type: CONS.MESSAGES.DB__ADD_STOCK__RESPONSE,
              data: completeStock
            })
            resolve(response)
          } else {
            reject('Wrong ID type')
          }
          break
        case CONS.MESSAGES.DB__UPDATE_ACCOUNT:
          await updateAccount(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__UPDATE_ACCOUNT__RESPONSE
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__UPDATE_STOCK:
          const updateStockResponse = await updateStock(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__UPDATE_STOCK__RESPONSE,
            data: updateStockResponse
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__UPDATE_BOOKING:
          const updateBookingResponse = await updateBooking(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__UPDATE_BOOKING__RESPONSE,
            data: updateBookingResponse
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__DELETE_ACCOUNT:
          await deleteAccount(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__DELETE_STOCK:
          await deleteStock(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__DELETE_STOCK__RESPONSE
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__DELETE_BOOKING:
          await deleteBooking(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__DELETE_BOOKING_TYPE:
          await deleteBookingType(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__DELETE_BOOKING_TYPE__RESPONSE
          })
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__MIN_RATE_MAX_DATA:
          const fetchedMinRateMaxData: FetchedResources.IMinRateMaxData[] = await fetchMinRateMaxData(appMessage.data)
          response = JSON.stringify({data: fetchedMinRateMaxData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__COMPANY_DATA:
          const fetchedCompanyData: FetchedResources.ICompanyData = await fetchCompanyData(appMessage.data)
          response = JSON.stringify({data: fetchedCompanyData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__EXCHANGES_BASE_DATA:
          const fetchedExchangesBaseData: FetchedResources.IExchangesData[] = await fetchExchangesData(appMessage.data)
          response = JSON.stringify({data: fetchedExchangesBaseData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__EXCHANGES_DATA:
          const fetchedExchangesData: FetchedResources.IExchangesData[] = await fetchExchangesData(appMessage.data)
          response = JSON.stringify({data: fetchedExchangesData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__MATERIALS_DATA:
          const fetchedMaterialsData: FetchedResources.IMaterialData[] = await fetchMaterialData()
          response = JSON.stringify({data: fetchedMaterialsData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__INDEXES_DATA:
          const fetchedIndexesData: FetchedResources.IMaterialData[] = await fetchIndexData()
          response = JSON.stringify({data: fetchedIndexesData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__DATES_DATA:
          const fetchedDatesData: FetchedResources.IDatesData = await fetchDateData(appMessage.data)
          response = JSON.stringify({data: fetchedDatesData})
          resolve(response)
          break
        case CONS.MESSAGES.FETCH__DAILY_CHANGES_DATA:
          const fetchedDailyChangesData: FetchedResources.IDailyChangesData[] = await fetchDailyChangeData(appMessage.data)
          response = JSON.stringify({data: fetchedDailyChangesData})
          resolve(response)
          break
        default:
          console.error('Missing message type')
          reject('Missing message type')
      }
    })
  }

  browser.runtime.onInstalled.addListener(onInstall)
  browser.action.onClicked.addListener(onClick)
  browser.runtime.onMessage.addListener(onAppMessage)

  log('--- PAGE_SCRIPT background.js --- BACKGROUND PAGE ---', {info: window.location.href})
} else if (window.location.href.includes(CONS.DEFAULTS.APP)) {
  const keyStrokeController: string[] = []
  const onBeforeUnload = async (): Promise<void> => {
    log('BACKGROUND: onBeforeUnload')
    await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.DB__CLOSE}))
  }
  const onKeyDown = async (ev: KeyboardEvent): Promise<void> => {
    keyStrokeController.push(ev.key)
    log('BACKGROUND: onKeyDown')
    if (
      keyStrokeController.includes('Control') &&
      keyStrokeController.includes('Alt') &&
      ev.key === 'r'
    ) {
      await browser.storage.local.clear()
    }
    if (
      keyStrokeController.includes('Control') &&
      keyStrokeController.includes('Alt') &&
      ev.key === 'd' && Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0
    ) {
      localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '0')
    }
    if (
      keyStrokeController.includes('Control') &&
      keyStrokeController.includes('Alt') &&
      ev.key === 'd' && !(Number.parseInt(localStorage.getItem(CONS.STORAGE.PROPS.DEBUG) ?? '0') > 0)
    ) {
      localStorage.setItem(CONS.STORAGE.PROPS.DEBUG, '1')
    }
  }
  const onKeyUp = (ev: KeyboardEvent): void => {
    keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1)
  }

  window.addEventListener('keydown', onKeyDown, false)
  window.addEventListener('keyup', onKeyUp, false)
  window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)

  log('--- PAGE_SCRIPT background.js --- BACKGROUND PAGE ---', {info: window.location.href})
}

log('--- PAGE_SCRIPT background.js ---')
