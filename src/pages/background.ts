/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
declare global {
  interface IAccount {
    // NOTE: correlates with CONS.DB.STORES.ACCOUNTS.FIELDS
    cID: number
    cSwift: string
    cNumber: string
    cLogoUrl: string
    cLogoSearchName: string
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
    cDescription?: string
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

  interface IBackup {
    sm: {
      cVersion: number
      cDBVersion: number
      cEngine: string
    }
    accounts: IAccount[]
    bookings: IBooking[]
    booking_types: IBookingType[]
    stocks: IStock[]
  }

  interface IStores {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStock[]
  }

  interface IStorageLocal {
    sActiveAccountId: number
    sBookingsPerPage: number
    sStocksPerPage: number
    sStockmanagerDbImported: boolean
    sPartner: boolean
    sSkin: string
    sService: string
    sExchanges: string[]
    sMaterials: string[]
    sIndexes: string[]
    sMarkets: string[]
  }
}
declare namespace FetchedResources {
  interface ICompanyData {
    company: string
    wkn: string
    symbol: string
  }
}

interface IUseAppApi {
  CONS: Readonly<{
    DATE: {
      DEFAULT: number
      DEFAULT_ISO: string
      DEFAULT_YEAR: number
      MILLI_PER_DAY: number
      MILLI_PER_MIN: number
    }
    DB: {
      NAME: string
      STORES: {
        ACCOUNTS: {
          NAME: string
          FIELDS: {
            ID: keyof IAccount
            SWIFT: keyof IAccount
            LOGO_URL: keyof IAccount
            LOGO_SEARCH_NAME: keyof IAccount
            NUMBER: keyof IAccount
            STOCK_ACCOUNT: keyof IAccount
          }
        }
        BOOKINGS: {
          NAME: string
          FIELDS: {
            ID: keyof IBooking
            DATE: keyof IBooking
            EX_DATE: keyof IBooking
            COUNT: keyof IBooking
            CREDIT: keyof IBooking
            DEBIT: keyof IBooking
            DESCRIPTION: keyof IBooking
            BOOKING_TYPE_ID: keyof IBooking
            ACCOUNT_NUMBER_ID: keyof IBooking
            STOCK_ID: keyof IBooking
            SOLI: keyof IBooking
            MARKET_PLACE: keyof IBooking
            TAX: keyof IBooking
            FEE: keyof IBooking
            SOURCE_TAX: keyof IBooking
            TRANSACTION_TAX: keyof IBooking
          }
        }
        BOOKING_TYPES: {
          NAME: string
          FIELDS: {
            ID: keyof IBookingType
            NAME: keyof IBookingType
            ACCOUNT_NUMBER_ID: keyof IBookingType
          }
        }
        STOCKS: {
          NAME: string
          FIELDS: {
            ID: keyof IStock
            ISIN: keyof IStock
            SYMBOL: keyof IStock
            FADE_OUT: keyof IStock
            FIRST_PAGE: keyof IStock
            URL: keyof IStock
            MEETING_DAY: keyof IStock
            QUARTER_DAY: keyof IStock
            WKN: keyof IStock
            COMPANY: keyof IStock
            ACCOUNT_NUMBER_ID: keyof IStock
          }
        }
      }
      IMPORT_MIN_VERSION: number
      CURRENT_VERSION: number
    }
    DEFAULTS: {
      BACKGROUND: string
      CURRENCY: string
      LANG: string
      LOCALE: string
      DATE: string
      YEAR: number
      STORAGE: {
        ACTIVE_ACCOUNT_ID: number
        BOOKINGS_PER_PAGE: number
        STOCKS_PER_PAGE: number
        PARTNER: boolean
        DEBUG: boolean
        SKIN: string
        SERVICE: string
        EXCHANGES: string[]
        MATERIALS: string[]
        INDEXES: string[]
        MARKETS: string[]
      }
    }
    DIALOGS: {
      ADD_ACCOUNT: string
      UPDATE_ACCOUNT: string
      DELETE_ACCOUNT: string
      ADD_STOCK: string
      UPDATE_STOCK: string
      DELETE_STOCK: string
      ADD_BOOKING_TYPE: string
      ADD_BOOKING: string
      DELETE_BOOKING: string
      DELETE_BOOKING_TYPE: string
      EXPORT_DATABASE: string
      IMPORT_DATABASE: string
      SHOW_ACCOUNTING: string
      SETTING: string
    }
    LOGOS: {
      NO_LOGO: string
    }
    EVENTS: {
      ABORT: string
      BEFOREUNLOAD: string
      CHANGE: string
      CLICK: string
      COMP: string
      DOM: string
      ERR: string
      INP: string
      KEYDOWN: string
      LOAD: string
      FOCUS: string
      BLUR: string
      SUC: string
      UPG: string
    }
    MESSAGES: {
      DB__CLOSE: string
      DB__TO_STORE: string
      DB__TO_STORE__RESPONSE: string
      DB__ADD_ACCOUNT: string
      DB__ADD_ACCOUNT__RESPONSE: string
      DB__UPDATE_ACCOUNT: string
      DB__UPDATE_ACCOUNT__RESPONSE: string
      DB__ADD_BOOKING: string
      DB__ADD_BOOKING__RESPONSE: string
      DB__ADD_BOOKING_TYPE: string
      DB__ADD_BOOKING_TYPE__RESPONSE: string
      DB__ADD_STOCK: string
      DB__ADD_STOCK__RESPONSE: string
      DB__UPDATE_STOCK: string
      DB__UPDATE_STOCK__RESPONSE: string
      DB__DELETE_ACCOUNT: string
      DB__DELETE_ACCOUNT__RESPONSE: string
      DB__DELETE_BOOKING: string
      DB__DELETE_BOOKING__RESPONSE: string
      DB__DELETE_BOOKING_TYPE: string
      DB__DELETE_BOOKING_TYPE__RESPONSE: string
      DB__DELETE_STOCK: string
      DB__DELETE_STOCK__RESPONSE: string
      APP__INIT_SETTINGS: string
      APP__INIT_SETTINGS__RESPONSE: string
      DB__ADD_STORES: string
      OPTIONS__SET_SKIN: string
      OPTIONS__SET_SERVICE: string
      OPTIONS__SET_INDEXES: string
      OPTIONS__SET_MATERIALS: string
      OPTIONS__SET_EXCHANGES: string
      OPTIONS__SET_MARKETS: string
      DB__EXPORT: string
      STORAGE__SET_ID: string
      STORAGE__SET_ID__RESPONSE: string
      OPTIONS__SET_SKIN__RESPONSE: string
      OPTIONS__SET_SERVICE__RESPONSE: string
      OPTIONS__SET_INDEXES__RESPONSE: string
      OPTIONS__SET_MATERIALS__RESPONSE: string
      OPTIONS__SET_EXCHANGES__RESPONSE: string
      OPTIONS__SET_MARKETS__RESPONSE: string
      OPTIONS__INIT_SETTINGS: string
      OPTIONS__INIT_SETTINGS__RESPONSE: string
      FETCH__COMPANY_DATA: string
      FETCH__COMPANY_DATA__RESPONSE: string
    }
    SERVICES: {
      [p: string]: Partial<{
        NAME: string
        HOME: string
        QUOTE: string
        INDEXES: string
        DATES: string
        MATERIALS: string
        GM: string
        QF: string
        CHS_URL: string
        CHB_URL: string
        CHS: string[]
        CHB: string[]
        EXCHANGE: string
        DELAY: number
      }>
    }
    STATES: {
      DONE: string
      SRV: number
      SUCCESS: number
      PAUSE: string
      MUTATE: string
      NO_RENDER: string
    }
    SETTINGS: {
      ITEMS_PER_PAGE_OPTIONS: {
        value: number
        title: string
      }[]
      MARKETS_TAB: string
      EXCHANGES_TAB: string
      INDEXES: Record<string, string>
      MATERIALS: Record<string, string>
      MATERIALS_ORG: Map<string, string>
    }
    RESOURCES: {
      LICENSE: string
      INDEX: string
      ROOT: string
    }
    RESULTS: {
      ERROR: string
      SUCCESS: string
    }
    SYSTEM: {
      COPYRIGHT: string
      MAILTO: string
      GET: string
      HTML_ENTITY: string
      KEYS: {
        ENTER: string
        TAB: string
        T: string
        V: string
        Z: string
      }
      ERRORS: {
        CURR: string
        ERR: string
        INVALID: string
        NO_CASE: string
        NO_DEL: string
        REQ: string
        SRV: string
        WRONG_PARAM: string
        SEND: string
        PORT: string
      }
      ONCE: {
        once: boolean
      }
    }
  }>
  VALIDATORS: Readonly<{
    ibanRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
    nameRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
    swiftRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
    dateRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
    currencyCodeRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
    requiredRule: (msgArray: string[]) => ((v: string) => string | boolean)[]
    brandNameRules: (msgArray: string[]) => ((v: string) => string | boolean)[]
  }>

  notice(msgArray: string[]): Promise<void>

  utcDate(iso: string): Date

  toISODate(ms: number): string

  log(msg: string, mode?: { info: unknown }): void
}

// TODO
// in settings new tab, concat backup data, stockmanager data
// input exported backup_file, stockmanager
// migrate transfers to bookings, stocks to stocks
// find max ID, start with max + 1
// result file that could be imported
export const useAppApi = (): IUseAppApi => {
  return {
    CONS: Object.freeze({
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
        CURRENCY: 'EUR',
        LANG: 'de',
        LOCALE: 'de-DE',
        DATE: '1970-01-01',
        YEAR: 9999,
        STORAGE: {
          ACTIVE_ACCOUNT_ID: -1,
          BOOKINGS_PER_PAGE: 9,
          STOCKS_PER_PAGE: 9,
          DEBUG: false,
          SKIN: 'ocean',
          MATERIALS: ['au', 'brent'],
          INDEXES: ['dax', 'dow'],
          EXCHANGES: ['EURUSD'],
          MARKETS: ['Frankfurt', 'XETRA'],
          SERVICE: 'wstreet',
          PARTNER: false
        }
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
        DELETE_BOOKING: 'DeleteBooking',
        EXPORT_DATABASE: 'ExportDatabase',
        IMPORT_DATABASE: 'ImportDatabase',
        SHOW_ACCOUNTING: 'ShowAccounting',
        SETTING: 'setting'
      },
      LOGOS: {
        NO_LOGO: 'https://cdn.brandfetch.io/brandfetch.com/w/48/h/48?c=1idV74s2UaSDMRIQg-7'
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
      MESSAGES: {
        DB__CLOSE: '12001',
        DB__TO_STORE: '12002',
        DB__TO_STORE__RESPONSE: '12003',
        DB__ADD_ACCOUNT: '12004',
        DB__ADD_ACCOUNT__RESPONSE: '12005',
        DB__UPDATE_ACCOUNT: '13005',
        DB__UPDATE_ACCOUNT__RESPONSE: '13006',
        DB__ADD_BOOKING: '12006',
        DB__ADD_BOOKING__RESPONSE: '12007',
        DB__ADD_BOOKING_TYPE: '12008',
        DB__ADD_BOOKING_TYPE__RESPONSE: '12009',
        DB__ADD_STOCK: '12010',
        DB__ADD_STOCK__RESPONSE: '13003',
        DB__UPDATE_STOCK: '13001',
        DB__UPDATE_STOCK__RESPONSE: '13002',
        DB__DELETE_ACCOUNT: '12012',
        DB__DELETE_ACCOUNT__RESPONSE: '12013',
        DB__DELETE_BOOKING: '12014',
        DB__DELETE_BOOKING__RESPONSE: '12015',
        DB__DELETE_BOOKING_TYPE: '12016',
        DB__DELETE_BOOKING_TYPE__RESPONSE: '12017',
        DB__DELETE_STOCK: '12018',
        DB__DELETE_STOCK__RESPONSE: '12019',
        APP__INIT_SETTINGS: '12021',
        APP__INIT_SETTINGS__RESPONSE: '12022',
        DB__ADD_STORES: '12023',
        OPTIONS__SET_SKIN: '12024',
        OPTIONS__SET_SERVICE: '12025',
        OPTIONS__SET_INDEXES: '12026',
        OPTIONS__SET_MATERIALS: '12027',
        OPTIONS__SET_EXCHANGES: '12028',
        OPTIONS__SET_MARKETS: '12029',
        DB__EXPORT: '12031',
        STORAGE__SET_ID: '12032',
        STORAGE__SET_ID__RESPONSE: '12033',
        OPTIONS__SET_SKIN__RESPONSE: '12034',
        OPTIONS__SET_SERVICE__RESPONSE: '12035',
        OPTIONS__SET_INDEXES__RESPONSE: '12036',
        OPTIONS__SET_MATERIALS__RESPONSE: '12037',
        OPTIONS__SET_MARKETS__RESPONSE: '12038',
        OPTIONS__SET_EXCHANGES__RESPONSE: '12039',
        OPTIONS__INIT_SETTINGS: '13012',
        OPTIONS__INIT_SETTINGS__RESPONSE: '13013',
        FETCH__COMPANY_DATA: '13014',
        FETCH__COMPANY_DATA__RESPONSE: '13015'
      },
      SERVICES: {
        goyax: {
          NAME: 'Goyax',
          HOME: 'https://www.goyax.de/',
          QUOTE: 'https://www.goyax.de/aktien/',
          DELAY: 50
        },
        fnet: {
          NAME: 'Finanzen.Net',
          HOME: 'https://www.finanzen.net/aktienkurse/',
          INDEXES: 'https://www.finanzen.net/indizes/',
          QUOTE: 'https://www.finanzen.net/suchergebnis.asp?_search=',
          DATES: 'https://www.finanzen.net/termine/',
          MATERIALS: 'https://www.finanzen.net/rohstoffe/',
          GM: 'Hauptversammlung',
          QF: 'Quartalszahlen',
          DELAY: 750
        },
        wstreet: {
          NAME: 'Wallstreet-Online',
          HOME: 'https://www.wallstreet-online.de',
          QUOTE:
            'https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/',
          DELAY: 50
        },
        acheck: {
          NAME: 'Aktien Check',
          HOME: 'https://m.aktiencheck.de/',
          QUOTE: 'https://m.aktiencheck.de/quotes/suche/?search=',
          DELAY: 50
        },
        ard: {
          NAME: 'ARD',
          HOME: 'https://www.tagesschau.de/wirtschaft/boersenkurse/',
          QUOTE:
            'https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff=',
          DELAY: 50
        },
        tgate: {
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
          ]
        },
        fx: {
          NAME: 'fx-rate',
          HOME: 'https://fx-rate.net/qwsaq',
          EXCHANGE: 'https://fx-rate.net/calculator/?c_input=',
          DELAY: 50
        }
      },
      STATES: {
        DONE: 'complete',
        SRV: 500,
        SUCCESS: 200,
        PAUSE: 'resting',
        MUTATE: 'mutation',
        NO_RENDER: 'no_render'
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
        MARKETS_TAB: 'markets',
        EXCHANGES_TAB: 'exchanges',
        INDEXES: {
          dax: 'DAX',
          dow: 'Dow Jones',
          nasdaq: 'NASDAQ Comp.',
          nikkei: 'NIKKEI 225',
          hang: 'Hang Seng',
          ibex: 'IBEX 35',
          straits: 'Straits Times',
          asx: 'Australia All Ordinaries',
          rts: 'RTS',
          bovespa: 'BOVESPA',
          sensex: 'SENSEX',
          sci: 'Shanghai Composite',
          ftse: 'FTSE 100',
          smi: 'SMI',
          cac: 'CAC 40',
          stoxx: 'Euro Stoxx 50',
          tsx: 'S&P/TSX',
          sp: 'S&P 500'
        },
        MATERIALS: {
          au: 'Goldpreis',
          ag: 'Silberpreis',
          brent: 'Ölpreis (Brent)',
          wti: 'Ölpreis (WTI)',
          cu: 'Kupferpreis',
          pt: 'Platinpreis',
          al: 'Aluminiumpreis',
          ni: 'Nickelpreis',
          sn: 'Zinnpreis',
          pb: 'Bleipreis',
          pd: 'Palladiumpreis'
        },
        MATERIALS_ORG: new Map([
          ['Goldpreis', 'au'],
          ['Silberpreis', 'ag'],
          ['Ölpreis (Brent)', 'brent'],
          ['Ölpreis (WTI)', 'wti'],
          ['Kupferpreis', 'cu'],
          ['Platinpreis', 'pt'],
          ['Aluminiumpreis', 'al'],
          ['Nickelpreis', 'ni'],
          ['Zinnpreis', 'sn'],
          ['Bleipreis', 'pb'],
          ['Palladiumpreis', 'pd']
        ]),
      },
      RESOURCES: {
        LICENSE: 'license.html',
        INDEX: 'pages/app.html',
        ROOT: '/'
      },
      RESULTS: {
        ERROR: 'ERR',
        SUCCESS: 'SUCCESS'
      },
      SYSTEM: {
        COPYRIGHT: '2013-2025 Martin Berner',
        MAILTO: 'mailto:kontenmanager@gmx.de',
        GET: 'GET',
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
    VALIDATORS: Object.freeze({
      ibanRules: msgArray => {
        return [
          v => v !== null || msgArray[0],
          v => (v !== null && v.length < 37) || msgArray[1],
          v => v.match(/^(^[A-Z]{2}[0-9|\s]{20,36})/g) !== null || msgArray[2]
        ]
      },
      nameRules: msgArray => {
        return [
          v => v !== null || msgArray[0],
          v => (v !== null && v.length < 32) || msgArray[1],
          v => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ]
      },
      swiftRules: msgArray => {
        return [
          v => v !== null || msgArray[0],
          v => (v !== null && v.length < 13) || msgArray[1],
          v => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
        ]
      },
      dateRules: msgArray => {
        return [
          v => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ]
      },
      currencyCodeRules: msgArray => {
        return [
          v => v !== null || msgArray[0],
          v => (v !== null && v.length === 3) || msgArray[1],
          v => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ]
      },
      requiredRule: msgArray => {
        return [
          v => v !== null || msgArray[0]
        ]
      },
      brandNameRules: msgArray => {
        return [
          v => v !== null || msgArray[0]
        ]
      }
    }),
    notice: async (messages) => {
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
    utcDate: (iso) => {
      return new Date(`${iso}T00:00:00.000`)
    },
    toISODate: (ms) => {
      return new Date(ms).toISOString().substring(0, 10)
    },
    log: (msg, mode = {info: null}) => {
      const localDebug = localStorage.getItem('sDebug')
      if (Number.parseInt(localDebug ?? '0') > 0) {
        if (mode.info !== null) {
          console.info(msg, mode.info)
        } else {
          console.log(msg)
        }
      }
    }
  }
}

const {CONS, log, notice} = useAppApi()

if (window.location.href.includes(CONS.DEFAULTS.BACKGROUND)) {
  interface IUseDatabaseApi {
    open(): Promise<string>

    exportDatabase(fn: string): Promise<string>

    toStores(): Promise<IStores | string>

    addAccount(record: Omit<IAccount, 'cID'>): Promise<string | number>

    updateAccount(record: IAccount): Promise<string>

    deleteAccount(ident: number): Promise<string>

    addBookingType(record: Omit<IBookingType, 'cID'>): Promise<string | number>

    deleteBookingType(ident: number): Promise<string>

    addBooking(record: Omit<IBooking, 'cID'>): Promise<string | number>

    deleteBooking(ident: number): Promise<string>

    addStores(stores: IStores): Promise<string>

    deleteStock(ident: number): Promise<string>

    addStock(record: Omit<IStock, 'cID'>): Promise<string | number>

    updateStock(record: IStock): Promise<string>
  }

  interface IUseFetchApi {
    fetchCompanyData(isin: string): Promise<FetchedResources.ICompanyData>
  }

  const useDatabaseApi = (): IUseDatabaseApi => {
    return {
      exportDatabase: async (filename: string) => {
        log('BACKGROUND: exportDatabase')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStock[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onComplete = async (): Promise<void> => {
              log('BACKGROUND: exportDatabase: data read!')
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
              resolve('BACKGROUND: exportDatabase: done!')
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
      toStores: async () => {
        log('BACKGROUND: toStores')
        const accounts: IAccount[] = []
        const bookings: IBooking[] = []
        const stocks: IStock[] = []
        const bookingTypes: IBookingType[] = []
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const storage = await browser.storage.local.get(['sActiveAccountId'])
            const onComplete = async (): Promise<void> => {
              log('BACKGROUND: toStores: all database records sent to frontend!')
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
                if (ev.target.result.value.cAccountNumberID === storage.sActiveAccountId) {
                  bookingTypes.push(ev.target.result.value)
                }
                ev.target.result.continue()
              }
            }
            const onSuccessBookingOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                if (ev.target.result.value.cAccountNumberID === storage.sActiveAccountId) {
                  bookings.push(ev.target.result.value)
                }
                ev.target.result.continue()
              }
            }
            const onSuccessStockOpenCursor = (ev: Event): void => {
              if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                if (ev.target.result.value.cAccountNumberID === storage.sActiveAccountId) {
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
      open: async () => {
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
      addAccount: async (record) => {
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
      updateAccount: async (record) => {
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
      updateStock: async (record) => {
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = async (ev: Event): Promise<void> => {
              if (ev.target instanceof IDBRequest) {
                resolve('Stock updated')
              }
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.STOCKS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestUpdate = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).put(record)
            requestUpdate.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestUpdate.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      deleteAccount: async (ident) => {
        // const indexOfAccount = this._accounts.findIndex((account: IAccount) => {
        //   return account.cID === ident
        // })
        // TODO only allowed for accounts with no bookings, stocks, bookingTypes
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              //this._accounts.splice(indexOfAccount, 1)
              //backendAppMessagePort.get(CONS.MESSAGES.DB__DELETE_ACCOUNT)?.postMessage({type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE, data: ident})
              resolve('Account deleted')
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).delete(ident)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addBookingType: async (record) => {
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
      deleteBookingType: async (ident) => {
        // const indexOfBookingType = this._booking_types.all.findIndex((bookingType: IBookingType) => {
        //   return bookingType.cID === ident
        // })
        // const indexOfBookingTypePerAccount = this._booking_types.per_account.findIndex((bookingType: IBookingType) => {
        //   return bookingType.cID === ident
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
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).delete(ident)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addBooking: async (record) => {
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
      deleteBooking: async (ident) => {
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === ident
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
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(ident)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addStock: async (record) => {
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
      deleteStock: async (ident) => {
        // const indexOfBooking = this._bookings.all.findIndex((booking: IBooking) => {
        //   return booking.cID === ident
        // })
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onSuccess = (): void => {
              //this._bookings.all.splice(indexOfBooking, 1)
              //backendAppMessagePort.postMessage({type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE, data: ident})
              //this.sumBookings()
              resolve('Stock deleted')
            }
            const onError = (ev: Event): void => {
              if (ev instanceof ErrorEvent) {
                reject(ev.message)
              }
            }
            const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite')
            requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(ident)
            requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE)
            requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE)
          }
        })
      },
      addStores: async (stores) => {
        log('BACKGROUND: addStores', {info: dbi})
        return new Promise(async (resolve, reject) => {
          if (dbi != null) {
            const onComplete = async (): Promise<void> => {
              await notice(['All memory records are added to the database!'])
              resolve('BACKGROUND: addStores: all memory records are added to the database!')
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
            const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear()
            requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE)
            const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear()
            requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE)
            const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear()
            requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE)
          }
        })
      }
    }
  }

  const useFetchApi = (): IUseFetchApi => {
    return {
      fetchCompanyData: async (isin) => {
        return new Promise(async (resolve, reject) => {
          let sDocument: Document
          let company = ''
          let child: ChildNode | undefined
          let wkn: string
          let symbol: string
          let tables: NodeListOf<HTMLTableRowElement>
          let result = {
            company: '',
            wkn: '',
            symbol: ''
          }
          const firstResponse = await fetch(CONS.SERVICES.tgate.QUOTE + isin)
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
        })
      }
    }
  }

  let dbi: IDBDatabase
  const {
    exportDatabase,
    addAccount,
    updateAccount,
    deleteAccount,
    addBooking,
    deleteBooking,
    addBookingType,
    deleteBookingType,
    addStock,
    updateStock,
    toStores,
    addStores,
    deleteStock,
    open
  } = useDatabaseApi()
  const {
    fetchCompanyData
  } = useFetchApi()
  // NOTE: onInstall runs at addon install, addon update and firefox update
  const onInstall = async (): Promise<void> => {
    console.log('BACKGROUND: onInstall')
    const installStorageLocal = async () => {
      const storageLocal: Partial<IStorageLocal> = await browser.storage.local.get()
      if (storageLocal.sSkin === undefined) {
        await browser.storage.local.set({sSkin: CONS.DEFAULTS.STORAGE.SKIN})
      }
      if (storageLocal.sActiveAccountId === undefined) {
        await browser.storage.local.set({sActiveAccountId: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID})
      }
      if (storageLocal.sBookingsPerPage === undefined) {
        await browser.storage.local.set({sBookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE})
      }
      if (storageLocal.sStocksPerPage === undefined) {
        await browser.storage.local.set({sStocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE})
      }
      if (storageLocal.sPartner === undefined) {
        await browser.storage.local.set({sPartner: CONS.DEFAULTS.STORAGE.PARTNER})
      }
      if (storageLocal.sService === undefined) {
        await browser.storage.local.set({sService: CONS.DEFAULTS.STORAGE.SERVICE})
      }
      if (storageLocal.sExchanges === undefined) {
        await browser.storage.local.set({sExchanges: CONS.DEFAULTS.STORAGE.EXCHANGES})
      }
      if (storageLocal.sIndexes === undefined) {
        await browser.storage.local.set({sIndexes: CONS.DEFAULTS.STORAGE.INDEXES})
      }
      if (storageLocal.sMarkets === undefined) {
        await browser.storage.local.set({sMarkets: CONS.DEFAULTS.STORAGE.MARKETS})
      }
      if (storageLocal.sMaterials === undefined) {
        await browser.storage.local.set({sMaterials: CONS.DEFAULTS.STORAGE.MATERIALS})
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
    const foundTabs = await browser.tabs.query({url: `${browser.runtime.getURL(CONS.RESOURCES.INDEX)}`})
    // NOTE: any async webextension API call which triggers a corresponding event listener will reload background.js.
    if (foundTabs.length === 0) {
      const extensionTab = await browser.tabs.create({
        url: browser.runtime.getURL(CONS.RESOURCES.INDEX),
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
        case CONS.MESSAGES.APP__INIT_SETTINGS:
          const storageLocal1 = await browser.storage.local.get()
          response = JSON.stringify({
            type: CONS.MESSAGES.APP__INIT_SETTINGS__RESPONSE,
            data: storageLocal1
          })
          resolve(response)
          break
        case CONS.MESSAGES.OPTIONS__INIT_SETTINGS:
          const storageLocal2 = await browser.storage.local.get()
          response = JSON.stringify({
            type: CONS.MESSAGES.OPTIONS__INIT_SETTINGS__RESPONSE,
            data: storageLocal2
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__CLOSE:
          dbi.close()
          resolve('DB closed')
          break
        case CONS.MESSAGES.DB__EXPORT:
          await exportDatabase(appMessage.data)
          resolve('DB exported')
          break
        case CONS.MESSAGES.STORAGE__SET_ID:
          await browser.storage.local.set({sActiveAccountId: appMessage.data})
          await toStores()
          resolve('ID set')
          break
        case CONS.MESSAGES.DB__TO_STORE:
          const stores = await toStores()
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__TO_STORE__RESPONSE,
            data: stores
          })
          resolve(response)
          break
        case CONS.MESSAGES.DB__ADD_STORES:
          const addStoresData: IStores = appMessage.data
          await addStores(addStoresData)
          await browser.storage.local.set({sActiveAccountId: addStoresData.accounts[0].cID})
          resolve('Stores added')
          break
        case CONS.MESSAGES.DB__ADD_ACCOUNT:
          const addAccountData: Omit<IAccount, 'cID'> = appMessage.data
          const addAccountID = await addAccount(addAccountData)
          if (typeof addAccountID === 'number') {
            const completeAccount: IAccount = {cID: addAccountID, ...addAccountData}
            response = JSON.stringify({
              type: CONS.MESSAGES.DB__ADD_ACCOUNT__RESPONSE,
              data: completeAccount
            })
            await browser.storage.local.set({sActiveAccountId: addAccountID})
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
          await updateStock(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.DB__UPDATE_STOCK__RESPONSE
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
        case CONS.MESSAGES.FETCH__COMPANY_DATA:
          const fetchedCompanyData: FetchedResources.ICompanyData = await fetchCompanyData(appMessage.data)
          response = JSON.stringify({
            type: CONS.MESSAGES.FETCH__COMPANY_DATA__RESPONSE,
            data: fetchedCompanyData
          })
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

  console.info('--- PAGE_SCRIPT background.js --- onInstalled, onConnect, onClicked ---', window.location.href)
}

log('--- PAGE_SCRIPT background.js ---')
