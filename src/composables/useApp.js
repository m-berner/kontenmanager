export const useApp = () => {
    let MESSAGES;
    (function (MESSAGES) {
        MESSAGES[MESSAGES["DB__DELETE_ALL"] = 0] = "DB__DELETE_ALL";
        MESSAGES[MESSAGES["DB__GET_STORES"] = 1] = "DB__GET_STORES";
        MESSAGES[MESSAGES["DB__GET_STORES__RESPONSE"] = 2] = "DB__GET_STORES__RESPONSE";
        MESSAGES[MESSAGES["DB__ADD_ACCOUNT"] = 3] = "DB__ADD_ACCOUNT";
        MESSAGES[MESSAGES["DB__ADD_ACCOUNT__RESPONSE"] = 4] = "DB__ADD_ACCOUNT__RESPONSE";
        MESSAGES[MESSAGES["DB__UPDATE_ACCOUNT"] = 5] = "DB__UPDATE_ACCOUNT";
        MESSAGES[MESSAGES["DB__UPDATE_ACCOUNT__RESPONSE"] = 6] = "DB__UPDATE_ACCOUNT__RESPONSE";
        MESSAGES[MESSAGES["DB__ADD_BOOKING"] = 7] = "DB__ADD_BOOKING";
        MESSAGES[MESSAGES["DB__UPDATE_BOOKING"] = 8] = "DB__UPDATE_BOOKING";
        MESSAGES[MESSAGES["DB__ADD_BOOKING__RESPONSE"] = 9] = "DB__ADD_BOOKING__RESPONSE";
        MESSAGES[MESSAGES["DB__ADD_BOOKING_TYPE"] = 10] = "DB__ADD_BOOKING_TYPE";
        MESSAGES[MESSAGES["DB__ADD_BOOKING_TYPE__RESPONSE"] = 11] = "DB__ADD_BOOKING_TYPE__RESPONSE";
        MESSAGES[MESSAGES["DB__UPDATE_BOOKING__RESPONSE"] = 12] = "DB__UPDATE_BOOKING__RESPONSE";
        MESSAGES[MESSAGES["DB__ADD_STOCK"] = 13] = "DB__ADD_STOCK";
        MESSAGES[MESSAGES["DB__ADD_STOCK__RESPONSE"] = 14] = "DB__ADD_STOCK__RESPONSE";
        MESSAGES[MESSAGES["DB__UPDATE_STOCK"] = 15] = "DB__UPDATE_STOCK";
        MESSAGES[MESSAGES["DB__UPDATE_STOCK__RESPONSE"] = 16] = "DB__UPDATE_STOCK__RESPONSE";
        MESSAGES[MESSAGES["DB__DELETE_ACCOUNT"] = 17] = "DB__DELETE_ACCOUNT";
        MESSAGES[MESSAGES["DB__DELETE_ACCOUNT__RESPONSE"] = 18] = "DB__DELETE_ACCOUNT__RESPONSE";
        MESSAGES[MESSAGES["DB__DELETE_BOOKING"] = 19] = "DB__DELETE_BOOKING";
        MESSAGES[MESSAGES["DB__DELETE_BOOKING__RESPONSE"] = 20] = "DB__DELETE_BOOKING__RESPONSE";
        MESSAGES[MESSAGES["DB__DELETE_BOOKING_TYPE"] = 21] = "DB__DELETE_BOOKING_TYPE";
        MESSAGES[MESSAGES["DB__DELETE_BOOKING_TYPE__RESPONSE"] = 22] = "DB__DELETE_BOOKING_TYPE__RESPONSE";
        MESSAGES[MESSAGES["DB__DELETE_STOCK"] = 23] = "DB__DELETE_STOCK";
        MESSAGES[MESSAGES["DB__DELETE_STOCK__RESPONSE"] = 24] = "DB__DELETE_STOCK__RESPONSE";
        MESSAGES[MESSAGES["DB__ADD_STORES"] = 25] = "DB__ADD_STORES";
        MESSAGES[MESSAGES["DB__ADD_STORES_25"] = 26] = "DB__ADD_STORES_25";
        MESSAGES[MESSAGES["DB__EXPORT"] = 27] = "DB__EXPORT";
        MESSAGES[MESSAGES["FETCH__COMPANY_DATA"] = 28] = "FETCH__COMPANY_DATA";
        MESSAGES[MESSAGES["FETCH__EXCHANGES_BASE_DATA"] = 29] = "FETCH__EXCHANGES_BASE_DATA";
        MESSAGES[MESSAGES["FETCH__INDEXES_DATA"] = 30] = "FETCH__INDEXES_DATA";
        MESSAGES[MESSAGES["FETCH__MATERIALS_DATA"] = 31] = "FETCH__MATERIALS_DATA";
        MESSAGES[MESSAGES["FETCH__EXCHANGES_DATA"] = 32] = "FETCH__EXCHANGES_DATA";
        MESSAGES[MESSAGES["FETCH__DAILY_CHANGES_DATA"] = 33] = "FETCH__DAILY_CHANGES_DATA";
        MESSAGES[MESSAGES["FETCH__DATES_DATA"] = 34] = "FETCH__DATES_DATA";
        MESSAGES[MESSAGES["FETCH__MIN_RATE_MAX_DATA"] = 35] = "FETCH__MIN_RATE_MAX_DATA";
    })(MESSAGES || (MESSAGES = {}));
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
                        QUOTE: 'https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/'
                    }],
                ['acheck', {
                        NAME: 'Aktien Check',
                        HOME: 'https://m.aktiencheck.de/',
                        QUOTE: 'https://m.aktiencheck.de/quotes/suche/?search='
                    }],
                ['ard', {
                        NAME: 'ARD',
                        HOME: 'https://www.tagesschau.de/wirtschaft/boersenkurse/',
                        QUOTE: 'https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff='
                    }]
            ]),
            TGATE: {
                NAME: 'Tradegate',
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
                CHANGES: { SMALL: 34, BIG: 41 }
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
            ],
            INDEXES: new Map([
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
            MATERIALS: new Map([
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
            HTML_ENTITY: '(&auml|&Auml;|&ouml;|&Ouml;|&uuml;|&Uuml;|&amp;|&eacute;|&Eacute;|&ecirc;|&Ecirc;|&oacute;|&Oacute;|&aelig;|&Aelig;)',
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
            ONCE: { once: true }
        }
    });
    const valIbanRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 13) || msgArray[1],
            (v) => v.match(/^(^[A-Z]{2}[0-9]{3,12})/g) !== null || msgArray[2]
        ];
    };
    const valNameRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 32) || msgArray[1],
            (v) => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgArray[2]
        ];
    };
    const valSwiftRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length < 13) || msgArray[1],
            (v) => v.match(/[^a-zA-Z0-9]/g) === null || msgArray[2]
        ];
    };
    const valDateRules = (msgArray) => {
        return [
            (v) => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgArray[0]
        ];
    };
    const valCurrencyCodeRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0],
            (v) => (v !== null && v.length === 3) || msgArray[1],
            (v) => v.match(/[^a-zA-Z]/g) === null || msgArray[2]
        ];
    };
    const valRequiredRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0]
        ];
    };
    const valPositiveIntegerRules = (msgArray) => {
        return [
            (v) => v > 0 || msgArray[0]
        ];
    };
    const valBrandNameRules = (msgArray) => {
        return [
            (v) => v !== null || msgArray[0]
        ];
    };
    const getUI = () => {
        const result = {
            lang: '',
            region: '',
            locale: '',
            currency: '',
            curUsd: '',
            curEur: '',
            fontSize: ''
        };
        const uiLang = (typeof browser !== 'undefined' && browser.i18n?.getUILanguage?.())
            ? browser.i18n.getUILanguage().toLowerCase()
            : CONS.DEFAULTS.LOCALE;
        if (uiLang.includes('-')) {
            result.lang = uiLang.split('-')[0];
            result.region = uiLang.split('-')[1].toUpperCase();
            result.locale = uiLang;
            result.currency = CONS.CURRENCIES.CODE.get(uiLang.split('-')[1]) ?? CONS.DEFAULTS.CURRENCY;
        }
        else {
            result.lang = uiLang;
            result.region = uiLang.toUpperCase();
            result.locale = uiLang + '-' + uiLang.toUpperCase();
            result.currency = CONS.CURRENCIES.CODE.get(uiLang) ?? CONS.DEFAULTS.CURRENCY;
        }
        result.curEur = result.currency + CONS.CURRENCIES.EUR;
        result.curUsd = result.currency + CONS.CURRENCIES.USD;
        result.fontSize = window
            .getComputedStyle(document.body, null)
            .getPropertyValue('font-size');
        return result;
    };
    const notice = async (messages) => {
        const msg = messages.join('\n');
        const notificationOption = {
            type: 'basic',
            iconUrl: 'assets/icon16.png',
            title: 'KontenManager',
            message: msg
        };
        await browser.notifications.create(notificationOption);
    };
    const utcDate = (iso) => {
        return new Date(`${iso}T00:00:00.000`);
    };
    const toISODate = (ms) => {
        return new Date(ms).toISOString().substring(0, 10);
    };
    const toNumber = (str) => {
        let result = 0;
        if (str !== null && str !== undefined) {
            const a = str.toString().replace(/,$/g, '');
            const b = a.split(',');
            if (b.length === 2) {
                const tmp2 = a
                    .trim()
                    .replace(/\s|\.|\t|%/g, '')
                    .replace(',', '.');
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2);
            }
            else if (b.length > 2) {
                let tmp = '';
                for (let i = b.length - 1; i > 0; i--) {
                    tmp += b[i];
                }
                const tmp2 = tmp + '.' + b[0];
                result = Number.isNaN(Number.parseFloat(tmp2))
                    ? 0
                    : Number.parseFloat(tmp2);
            }
            else {
                result = Number.isNaN(parseFloat(b[0])) ? 0 : Number.parseFloat(b[0]);
            }
        }
        return result;
    };
    const mean = (nar) => {
        let sum = 0;
        let len = nar.length;
        for (const n of nar) {
            if (n !== 0 && !Number.isNaN(n)) {
                sum += n;
            }
            else {
                len--;
            }
        }
        return len > 0 ? sum / len : 0;
    };
    const log = (msg, mode) => {
        const localDebug = localStorage.getItem(CONS.STORAGE.PROPS.DEBUG);
        if (Number.parseInt(localDebug ?? '0') > 0) {
            if (mode?.info !== undefined) {
                console.info(msg, mode?.info);
            }
            else {
                console.log(msg);
            }
        }
    };
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
    };
};
