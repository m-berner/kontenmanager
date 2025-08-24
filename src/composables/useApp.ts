/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
type TStringValidator = (v: string) => boolean | string
type TNumberValidator = (v: number) => boolean | string

interface IBrowserUI {
    lang: string
    region: string
    locale: string
    currency: string
    curEur: string
    curUsd: string
    fontSize: string
}

export const useApp = () => {
    enum MESSAGES {
        DB__DELETE_ALL,
        // DB__CLOSE,
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
        //STORAGE__GET_ALL,
        //STORAGE__GET_ALL__RESPONSE,
        DB__ADD_STORES,
        DB__ADD_STORES_25,
        OPTIONS__SET_SKIN,
        OPTIONS__SET_SERVICE,
        OPTIONS__SET_INDEXES,
        OPTIONS__SET_MATERIALS,
        OPTIONS__SET_EXCHANGES,
        OPTIONS__SET_MARKETS,
        DB__EXPORT,
        //STORAGE__SET_ID,
        //STORAGE__SET_ID__RESPONSE,
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
    } // TODO use symbols?

    const CONS = Object.freeze({
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
                    NAME: 'bookingTypes',
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
        COMPONENTS: {
            TITLE_BAR: {
                LOGO: '../assets/icon64.png'
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
            }
        },
        PAGES: {
            BACKGROUND: 'background.html',
            APP: 'app.html',
            OPTIONS: 'options.html',
        },
        DYNAMIC_LIST: {
            TYPES: {
                MARKETS: Symbol.for('markets'),
                EXCHANGES: Symbol.for('exchanges')
            }
        },
        CHECKBOX_GRID: {
            TYPES: {
                INDEXES: Symbol.for('indexes'),
                MATERIALS: Symbol.for('materials')
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
            MAP: new Map<string, Record<string, string>>([
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
    })
    const valIbanRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 13) || msgArray[1],
            (v: string) => v.match(/^(^[A-Z]{2}[0-9]{3,12})/g) !== null || msgArray[2]
        ]
    }
    const valNameRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 32) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ]
    }
    const valSwiftRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length < 13) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
        ]
    }
    const valDateRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ]
    }
    const valCurrencyCodeRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0],
            (v: string) => (v !== null && v.length === 3) || msgArray[1],
            (v: string) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ]
    }
    const valRequiredRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0]
        ]
    }
    const valPositiveIntegerRules = (msgArray: string[]): TNumberValidator[] => {
        return [
            (v: number) => v > 0 || msgArray[0]
        ]
    }
    const valBrandNameRules = (msgArray: string[]): TStringValidator[] => {
        return [
            (v: string) => v !== null || msgArray[0]
        ]
    }
    const getUI = (): IBrowserUI => {
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
    }
    const notice = async (messages: string[]): Promise<void> => {
        const msg = messages.join('\n')
        const notificationOption: browser.notifications.CreateNotificationOptions =
            {
                type: 'basic',
                iconUrl: 'assets/icon16.png',
                title: 'KontenManager',
                message: msg
            }
        await browser.notifications.create(notificationOption)
    }
    const utcDate = (iso: string): Date => {
        return new Date(`${iso}T00:00:00.000`)
    }
    const toISODate = (ms: number): string => {
        return new Date(ms).toISOString().substring(0, 10)
    }
    const toNumber = (str: string | boolean | number | undefined | null): number => {
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
    }
    const mean = (nar: number[]): number => {
        let sum = 0
        let len: number = nar.length
        for (const n of nar) {
            if (n !== 0 && !Number.isNaN(n)) {
                sum += n
            } else {
                len--
            }
        }
        return len > 0 ? sum / len : 0
    }
    const log = (msg: string, mode?: { info: unknown }) => {
        const localDebug = localStorage.getItem(CONS.STORAGE.PROPS.DEBUG)
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                console.info(msg, mode?.info)
            } else {
                console.log(msg)
            }
        }
    }
    return {
        CONS,
        valIbanRules,
        valNameRules,
        valSwiftRules,
        valDateRules,
        valCurrencyCodeRules,
        valRequiredRules,
        valPositiveIntegerRules,
        valBrandNameRules,
        getUI,
        notice,
        utcDate,
        toISODate,
        toNumber,
        mean,
        log
    }
}
