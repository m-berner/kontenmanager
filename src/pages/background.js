export const useAppApi = () => {
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
                            COMPANY: 'cCompany'
                        }
                    }
                },
                MIN_VERSION: 21,
                START_VERSION: 25
            },
            DEFAULTS: {
                BACKGROUND: '_generated_background_page.html',
                CURRENCY: 'EUR',
                LANG: 'de',
                LOCALE: 'de-DE',
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
                DELETE_ACCOUNT: 'DeleteAccount',
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
                PORT__APP: 'app',
                PORT__OPTIONS: 'optionsMessagePort',
                DB__CLOSE: 12001,
                DB__INTO_STORE: 12002,
                DB__INTO_STORE__RESPONSE: 12003,
                DB__ADD_ACCOUNT: 12004,
                DB__ADD_ACCOUNT__RESPONSE: 12005,
                DB__ADD_BOOKING: 12006,
                DB__ADD_BOOKING__RESPONSE: 12007,
                DB__ADD_BOOKING_TYPE: 12008,
                DB__ADD_BOOKING_TYPE__RESPONSE: 12009,
                DB__ADD_STOCK: 12010,
                DB__ADD_STOCK__RESPONSE: 12011,
                DB__DELETE_ACCOUNT: 12012,
                DB__DELETE_ACCOUNT__RESPONSE: 12013,
                DB__DELETE_BOOKING: 12014,
                DB__DELETE_BOOKING__RESPONSE: 12015,
                DB__DELETE_BOOKING_TYPE: 12016,
                DB__DELETE_BOOKING_TYPE__RESPONSE: 12017,
                DB__DELETE_STOCK: 12018,
                DB__DELETE_STOCK__RESPONSE: 12019,
                DB__CLEAN: 12020,
                STORES__INIT_SETTINGS: 12021,
                STORES__INIT_SETTINGS__RESPONSE: 12022,
                STORES__INTO_DATABASE: 12023,
                OPTIONS__SET_SKIN: 12024,
                OPTIONS__SET_SERVICE: 12025,
                OPTIONS__SET_INDEXES: 12026,
                OPTIONS__SET_MATERIALS: 12027,
                OPTIONS__SET_EXCHANGES: 12028,
                OPTIONS__SET_MARKETS: 12029
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
                    QUOTE: 'https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/',
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
                    QUOTE: 'https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff=',
                    DELAY: 50
                },
                tgate: {
                    NAME: 'Tradegate',
                    HOME: 'https://www.tradegate.de/',
                    QUOTE: 'https://www.tradegate.de/orderbuch.php?isin=',
                    CHSURL: 'https://www.tradegate.de/indizes.php?index=',
                    CHBURL: 'https://www.tradegate.de/indizes.php?buchstabe=',
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
                SRC: 'assets',
                OK: 'ok.png',
                OKD: 'ok-dark.png',
                CANCEL: 'cancel.png',
                CANCELD: 'cancel-dark.png',
                ICON32: 'icon32.png',
                LOGO16: 'logo16.png',
                LOGO256: 'logo256.png',
                MAG: 'magnifier.png',
                CALENDAR: 'calendar.png',
                RENEW: 'renew.png',
                FIRST: 'first.png',
                NEXT: 'next.png',
                PREV: 'previous.png',
                LAST: 'last.png',
                CB: 'home.png',
                UP: 'update.png',
                NS: 'addAccount.png',
                DS: 'deletestock.png',
                FI: 'fadein.png',
                IT: 'intransfer.png',
                OT: 'outtransfer.png',
                CHS: 'changes.png',
                CHB: 'allchanges.png',
                BK: 'backup.png',
                RE: 'restore.png',
                OB: 'orderbook.png',
                TB: 'transferbook.png',
                PY: 'peryear.png',
                CO: 'clean.png',
                SE: 'settings.png',
                RESET: 'reset.png',
                ADD: 'add.png',
                CHANGE: 'change.png',
                DEL: 'delete.png',
                NO: 'neworder.png',
                BUY: 'buy.png',
                SELL: 'sell.png',
                ND: 'newdividend.png',
                SD: 'showdividends.png',
                CONF: 'config.png',
                HTTP: 'http.png',
                HELP: 'help.json',
                PRIVACY: 'privacy.json',
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
                    NOCASE: 'Missing case!',
                    NODEL: 'Deletion off memory failed!',
                    REQ: 'Request failed!',
                    SRV: 'Remote Server error!',
                    WRONGPARAM: 'Wrong parameter!',
                    SEND: 'Send message failed!',
                    PORT: 'Message port is missing!'
                },
                ONCE: { once: true }
            }
        }),
        VALIDATORS: Object.freeze({
            ibanRules: msgs => {
                return [
                    v => v !== null || msgs[0],
                    v => (v !== null && v.length < 37) || msgs[1],
                    v => v.match(/^(^[A-Z]{2}[0-9|\s]{20,36})/g) !== null || msgs[2]
                ];
            },
            nameRules: msgs => {
                return [
                    v => v !== null || msgs[0],
                    v => (v !== null && v.length < 32) || msgs[1],
                    v => v.match(/[^a-zA-Z\-äöüÄÖÜ]/g) === null || msgs[2]
                ];
            },
            swiftRules: msgs => {
                return [
                    v => v !== null || msgs[0],
                    v => (v !== null && v.length < 13) || msgs[1],
                    v => v.match(/[^a-zA-Z0-9]/g) === null || msgs[2]
                ];
            },
            dateRules: msgs => {
                return [
                    v => (v !== null && v.match(/^([1-2])?[0-9]{3}-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/g) !== null) || msgs[0]
                ];
            },
            currencyCodeRules: msgs => {
                return [
                    v => v !== null || msgs[0],
                    v => (v !== null && v.length === 3) || msgs[1],
                    v => v.match(/[^a-zA-Z]/g) === null || msgs[2]
                ];
            },
            requiredRule: msgs => {
                return [
                    v => v !== null || msgs[0]
                ];
            },
            brandNameRules: msgs => {
                return [
                    v => v !== null || msgs[0]
                ];
            }
        }),
        notice: async (messages) => {
            const msg = messages.join('\n');
            const notificationOption = {
                type: 'basic',
                iconUrl: 'assets/icon16.png',
                title: 'KontenManager',
                message: msg
            };
            await browser.notifications.create(notificationOption);
        },
        utcDate: (iso) => {
            return new Date(`${iso}T00:00:00.000`);
        },
        toISODate: (ms) => {
            return new Date(ms).toISOString().substring(0, 10);
        },
        log: async (msg, mode = { info: null }) => {
            const storageLocal = await browser.storage.local.get(['sDebug']);
            if (storageLocal.sDebug) {
                if (mode.info !== null) {
                    console.info(msg, mode.info);
                }
                else {
                    console.log(msg);
                }
            }
        }
    };
};
const { CONS, log, notice } = useAppApi();
if (window.location.href.includes(CONS.DEFAULTS.BACKGROUND)) {
    let backendAppMessagePort;
    let backendOptionsMessagePort;
    let dbi;
    const useIndexedDatabaseApi = () => {
        return {
            clean: async () => {
                log('BACKGROUND: clean');
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const onComplete = () => {
                            resolve('BACKGROUND: all stores (databases and memory) are clean!');
                        };
                        const onSuccessClearBookings = () => {
                            log('BACKGROUND: bookings dropped');
                        };
                        const onSuccessClearAccounts = () => {
                            log('BACKGROUND: accounts dropped');
                        };
                        const onSuccessClearBookingTypes = () => {
                            log('BACKGROUND: booking types dropped');
                        };
                        const onSuccessClearStocks = () => {
                            log('BACKGROUND: stocks dropped');
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestClearBookings = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).clear();
                        requestClearBookings.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookings, CONS.SYSTEM.ONCE);
                        const requestClearAccount = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).clear();
                        requestClearAccount.addEventListener(CONS.EVENTS.SUC, onSuccessClearAccounts, CONS.SYSTEM.ONCE);
                        const requestClearBookingTypes = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).clear();
                        requestClearBookingTypes.addEventListener(CONS.EVENTS.SUC, onSuccessClearBookingTypes, CONS.SYSTEM.ONCE);
                        const requestClearStocks = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).clear();
                        requestClearStocks.addEventListener(CONS.EVENTS.SUC, onSuccessClearStocks, CONS.SYSTEM.ONCE);
                    }
                });
            },
            intoStore: async (p) => {
                log('BACKGROUND: intoStore');
                const accounts = [];
                const bookings = [];
                const stocks = [];
                const bookingTypes = [];
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onComplete = async () => {
                            log('BACKGROUND: intoStore: all database records sent to frontend!');
                            p.postMessage({
                                type: CONS.MESSAGES.DB__INTO_STORE__RESPONSE,
                                data: { accounts, bookings, bookingTypes, stocks }
                            });
                            if (accounts.length > 0) {
                                await browser.storage.local.set({ sActiveAccountID: accounts[0].cID });
                            }
                            resolve('BACKGROUND: intoStore: all database records sent to frontend!');
                        };
                        const onAbort = () => {
                            reject(requestTransaction.error);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME, CONS.DB.STORES.ACCOUNTS.NAME, CONS.DB.STORES.BOOKING_TYPES.NAME, CONS.DB.STORES.STOCKS.NAME], 'readonly');
                        requestTransaction.addEventListener(CONS.EVENTS.COMP, onComplete, CONS.SYSTEM.ONCE);
                        requestTransaction.addEventListener(CONS.EVENTS.ABORT, onAbort, CONS.SYSTEM.ONCE);
                        const onSuccessAccountOpenCursor = (ev) => {
                            if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                                accounts.push(ev.target.result.value);
                                ev.target.result.continue();
                            }
                        };
                        const onSuccessBookingTypeOpenCursor = (ev) => {
                            if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                                if (ev.target.result.value.cAccountNumberID === 1) {
                                    bookingTypes.push(ev.target.result.value);
                                }
                                ev.target.result.continue();
                            }
                        };
                        const onSuccessBookingOpenCursor = (ev) => {
                            if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                                if (ev.target.result.value.cAccountNumberID === 1) {
                                    bookings.push(ev.target.result.value);
                                }
                                ev.target.result.continue();
                            }
                        };
                        const onSuccessStockOpenCursor = (ev) => {
                            if (ev.target instanceof IDBRequest && ev.target.result instanceof IDBCursorWithValue) {
                                stocks.push(ev.target.result.value);
                                ev.target.result.continue();
                            }
                        };
                        const requestAccountOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).openCursor();
                        requestAccountOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessAccountOpenCursor, false);
                        const requestBookingTypeOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).openCursor();
                        requestBookingTypeOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingTypeOpenCursor, false);
                        const requestBookingOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).openCursor();
                        requestBookingOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessBookingOpenCursor, false);
                        const requestStockOpenCursor = requestTransaction.objectStore(CONS.DB.STORES.STOCKS.NAME).openCursor();
                        requestStockOpenCursor.addEventListener(CONS.EVENTS.SUC, onSuccessStockOpenCursor, false);
                    }
                });
            },
            open: async () => {
                return new Promise(async (resolve, reject) => {
                    const onError = (ev) => {
                        reject(ev);
                    };
                    const onSuccess = (ev) => {
                        if (ev.target instanceof IDBOpenDBRequest) {
                            dbi = ev.target.result;
                            const onVersionChangeSuccess = () => {
                                if (dbi != null) {
                                    dbi.close();
                                    notice(['Database is outdated, please reload the page.']);
                                }
                            };
                            dbi.addEventListener('versionchange', onVersionChangeSuccess, CONS.SYSTEM.ONCE);
                            resolve('BACKGROUND: database opened successfully!');
                        }
                    };
                    const openDBRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.START_VERSION);
                    openDBRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    openDBRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                });
            },
            addAccount: async (record) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = async (ev) => {
                            if (ev.target instanceof IDBRequest) {
                                const memRecord = {
                                    ...record,
                                    cID: ev.target.result
                                };
                                backendAppMessagePort.postMessage({ type: CONS.MESSAGES.DB__ADD_ACCOUNT__RESPONSE, data: memRecord });
                                resolve(ev.target.result);
                            }
                            else {
                                reject(CONS.RESULTS.ERROR);
                            }
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).add(record);
                        requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            deleteAccount: async (ident) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = () => {
                            backendAppMessagePort.postMessage({ type: CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE, data: ident });
                            resolve('Account deleted');
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.ACCOUNTS.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.ACCOUNTS.NAME).delete(ident);
                        requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            addBookingType: async (record) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = (ev) => {
                            if (ev.target instanceof IDBRequest) {
                                const memRecord = {
                                    ...record,
                                    cID: ev.target.result
                                };
                                backendAppMessagePort.postMessage({
                                    type: CONS.MESSAGES.DB__ADD_BOOKING_TYPE__RESPONSE,
                                    data: memRecord
                                });
                                resolve(CONS.RESULTS.SUCCESS);
                            }
                            else {
                                reject(CONS.RESULTS.ERROR);
                            }
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).add(record);
                        requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            deleteBookingType: async (ident) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = () => {
                            backendAppMessagePort.postMessage({ type: CONS.MESSAGES.DB__DELETE_BOOKING_TYPE__RESPONSE, data: ident });
                            resolve('Booking type deleted');
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKING_TYPES.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKING_TYPES.NAME).delete(ident);
                        requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            addBooking: async (record) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = (ev) => {
                            if (ev.target instanceof IDBRequest) {
                                const memRecord = {
                                    ...record,
                                    cID: ev.target.result
                                };
                                backendAppMessagePort.postMessage({ type: CONS.MESSAGES.DB__ADD_BOOKING__RESPONSE, data: memRecord });
                                resolve(CONS.RESULTS.SUCCESS);
                            }
                            else {
                                reject(CONS.RESULTS.ERROR);
                            }
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestAdd = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).add(record);
                        requestAdd.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            deleteBooking: async (ident) => {
                return new Promise(async (resolve, reject) => {
                    if (dbi != null) {
                        const onSuccess = () => {
                            backendAppMessagePort.postMessage({ type: CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE, data: ident });
                            resolve('Booking deleted');
                        };
                        const onError = (ev) => {
                            reject(ev);
                        };
                        const requestTransaction = dbi.transaction([CONS.DB.STORES.BOOKINGS.NAME], 'readwrite');
                        requestTransaction.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        const requestDelete = requestTransaction.objectStore(CONS.DB.STORES.BOOKINGS.NAME).delete(ident);
                        requestDelete.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
                        requestDelete.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
                    }
                });
            },
            intoDatabase: async (stores) => {
                console.error(stores);
            }
        };
    };
    const { clean, intoStore, open } = useIndexedDatabaseApi();
    const onInstall = async () => {
        console.log('BACKGROUND: onInstall');
        const installStorageLocal = async () => {
            const storageLocal = await browser.storage.local.get();
            if (storageLocal.sSkin === undefined) {
                await browser.storage.local.set({ sSkin: CONS.DEFAULTS.STORAGE.SKIN });
            }
            if (storageLocal.sActiveAccountId === undefined) {
                await browser.storage.local.set({ sActiveAccountId: CONS.DEFAULTS.STORAGE.ACTIVE_ACCOUNT_ID });
            }
            if (storageLocal.sBookingsPerPage === undefined) {
                await browser.storage.local.set({ sBookingsPerPage: CONS.DEFAULTS.STORAGE.BOOKINGS_PER_PAGE });
            }
            if (storageLocal.sStocksPerPage === undefined) {
                await browser.storage.local.set({ sStocksPerPage: CONS.DEFAULTS.STORAGE.STOCKS_PER_PAGE });
            }
            if (storageLocal.sPartner === undefined) {
                await browser.storage.local.set({ sPartner: CONS.DEFAULTS.STORAGE.PARTNER });
            }
            if (storageLocal.sService === undefined) {
                await browser.storage.local.set({ sService: CONS.DEFAULTS.STORAGE.SERVICE });
            }
            if (storageLocal.sDebug === undefined) {
                await browser.storage.local.set({ sDebug: CONS.DEFAULTS.STORAGE.DEBUG });
            }
            if (storageLocal.sExchanges === undefined) {
                await browser.storage.local.set({ sExchanges: CONS.DEFAULTS.STORAGE.EXCHANGES });
            }
            if (storageLocal.sIndexes === undefined) {
                await browser.storage.local.set({ sIndexes: CONS.DEFAULTS.STORAGE.INDEXES });
            }
            if (storageLocal.sMarkets === undefined) {
                await browser.storage.local.set({ sMarkets: CONS.DEFAULTS.STORAGE.MARKETS });
            }
            if (storageLocal.sMaterials === undefined) {
                await browser.storage.local.set({ sMaterials: CONS.DEFAULTS.STORAGE.MATERIALS });
            }
            console.log('BACKGROUND: installStorageLocal: DONE');
        };
        const onSuccess = (ev) => {
            if (ev.target instanceof IDBRequest) {
                ev.target.result.close();
            }
            console.info('BACKGROUND: onInstall: onSuccess', ev);
        };
        const onError = (ev) => {
            console.error('BACKGROUND: onError: ', ev);
        };
        const onUpgradeNeeded = async (ev) => {
            if (ev instanceof IDBVersionChangeEvent) {
                console.info('BACKGROUND: onInstall: onUpgradeNeeded', ev.newVersion);
                const createDB = () => {
                    console.log('BACKGROUND: onInstall: onUpgradeNeeded: createDB');
                    const requestCreateAccountStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.ACCOUNTS.NAME, {
                        keyPath: CONS.DB.STORES.ACCOUNTS.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateBookingStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.BOOKINGS.NAME, {
                        keyPath: CONS.DB.STORES.BOOKINGS.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateBookingTypeStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.BOOKING_TYPES.NAME, {
                        keyPath: CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID,
                        autoIncrement: true
                    });
                    const requestCreateStockStore = dbOpenRequest.result.createObjectStore(CONS.DB.STORES.STOCKS.NAME, {
                        keyPath: CONS.DB.STORES.STOCKS.FIELDS.ID,
                        autoIncrement: true
                    });
                    requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk1`, CONS.DB.STORES.ACCOUNTS.FIELDS.ID, { unique: true });
                    requestCreateAccountStore.createIndex(`${CONS.DB.STORES.ACCOUNTS.NAME}_uk2`, CONS.DB.STORES.ACCOUNTS.FIELDS.NUMBER, { unique: true });
                    requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_uk1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ID, { unique: true });
                    requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k1`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.NAME, { unique: false });
                    requestCreateBookingTypeStore.createIndex(`${CONS.DB.STORES.BOOKING_TYPES.NAME}_k2`, CONS.DB.STORES.BOOKING_TYPES.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_uk1`, CONS.DB.STORES.BOOKINGS.FIELDS.ID, { unique: true });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k1`, CONS.DB.STORES.BOOKINGS.FIELDS.DATE, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k2`, CONS.DB.STORES.BOOKINGS.FIELDS.BOOKING_TYPE_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k3`, CONS.DB.STORES.BOOKINGS.FIELDS.ACCOUNT_NUMBER_ID, { unique: false });
                    requestCreateBookingStore.createIndex(`${CONS.DB.STORES.BOOKINGS.NAME}_k4`, CONS.DB.STORES.BOOKINGS.FIELDS.STOCK_ID, { unique: false });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk1`, CONS.DB.STORES.STOCKS.FIELDS.ID, { unique: true });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk2`, CONS.DB.STORES.STOCKS.FIELDS.ISIN, { unique: true });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_uk3`, CONS.DB.STORES.STOCKS.FIELDS.SYMBOL, { unique: true });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k1`, CONS.DB.STORES.STOCKS.FIELDS.FADE_OUT, { unique: false });
                    requestCreateStockStore.createIndex(`${CONS.DB.STORES.STOCKS.NAME}_k2`, CONS.DB.STORES.STOCKS.FIELDS.FIRST_PAGE, { unique: false });
                };
                if (ev.oldVersion === 0) {
                    createDB();
                }
                else if (ev.oldVersion > 25) {
                }
                await installStorageLocal();
            }
        };
        const dbOpenRequest = indexedDB.open(CONS.DB.NAME, CONS.DB.START_VERSION);
        dbOpenRequest.addEventListener(CONS.EVENTS.ERR, onError, CONS.SYSTEM.ONCE);
        dbOpenRequest.addEventListener(CONS.EVENTS.SUC, onSuccess, CONS.SYSTEM.ONCE);
        dbOpenRequest.addEventListener(CONS.EVENTS.UPG, onUpgradeNeeded, CONS.SYSTEM.ONCE);
    };
    const onClick = async () => {
        log('BACKGROUND: onClick');
        await open();
        const foundTabs = await browser.tabs.query({ url: `${browser.runtime.getURL(CONS.RESOURCES.INDEX)}` });
        if (foundTabs.length === 0) {
            await browser.tabs.create({
                url: browser.runtime.getURL(CONS.RESOURCES.INDEX),
                active: true
            });
        }
        else {
            await browser.windows.update(foundTabs[0].windowId ?? 0, {
                focused: true
            });
            await browser.tabs.update(foundTabs[0].id ?? 0, { active: true });
        }
    };
    const onConnect = async (p) => {
        log('BACKGROUND: onConnect', { info: p.name });
        if (p.name === CONS.MESSAGES.PORT__APP) {
            backendAppMessagePort = p;
            const onAppDisconnected = () => {
                backendAppMessagePort.disconnect();
                log('BACKGROUND: onDisconnected', { info: 'App disconnected!' });
            };
            const onAppRequest = async (m) => {
                switch (Object.values(m)[0]) {
                    case CONS.MESSAGES.DB__INTO_STORE:
                        await intoStore(backendAppMessagePort);
                        break;
                    case CONS.MESSAGES.DB__CLEAN:
                        await clean();
                        break;
                    case CONS.MESSAGES.DB__CLOSE:
                        dbi.close();
                        break;
                    case CONS.MESSAGES.STORES__INTO_DATABASE:
                        console.error('STORESSSS', Object.values(m)[1]);
                        break;
                    case CONS.MESSAGES.STORES__INIT_SETTINGS:
                        backendAppMessagePort.postMessage({
                            type: CONS.MESSAGES.STORES__INIT_SETTINGS__RESPONSE,
                            data: await browser.storage.local.get()
                        });
                        break;
                    default:
                }
            };
            backendAppMessagePort.onMessage.addListener(onAppRequest);
            backendAppMessagePort.onDisconnect.addListener(onAppDisconnected);
        }
        else {
            backendOptionsMessagePort = p;
            const onOptionsDisconnected = () => {
                backendOptionsMessagePort.disconnect();
                log('BACKGROUND: onDisconnected', { info: 'Options tab disconnected!' });
            };
            const onOptionsRequest = async (m) => {
                log('BACKGROUND: onOptionsRequest', { info: Object.values(m) });
                switch (Object.values(m)[0]) {
                    case CONS.MESSAGES.STORES__INIT_SETTINGS:
                        backendOptionsMessagePort.postMessage({
                            type: CONS.MESSAGES.STORES__INIT_SETTINGS__RESPONSE,
                            data: await browser.storage.local.get()
                        });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_INDEXES:
                        await browser.storage.local.set({ sIndexes: Object.values(m)[1] });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_MATERIALS:
                        await browser.storage.local.set({ sMaterials: Object.values(m)[1] });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_SKIN:
                        await browser.storage.local.set({ sSkin: Object.values(m)[1] });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_SERVICE:
                        await browser.storage.local.set({ sService: Object.values(m)[1] });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_MARKETS:
                        await browser.storage.local.set({ sMarkets: Object.values(m)[1] });
                        break;
                    case CONS.MESSAGES.OPTIONS__SET_EXCHANGES:
                        await browser.storage.local.set({ sExchanges: Object.values(m)[1] });
                        break;
                    default:
                }
            };
            backendOptionsMessagePort.onMessage.addListener(onOptionsRequest);
            backendOptionsMessagePort.onDisconnect.addListener(onOptionsDisconnected);
        }
    };
    browser.runtime.onInstalled.addListener(onInstall);
    browser.action.onClicked.addListener(onClick);
    browser.runtime.onConnect.addListener(onConnect);
    console.info('--- PAGE_SCRIPT background.js --- onInstalled, onConnect, onClicked ---', window.location.href);
}
log('--- PAGE_SCRIPT background.js ---');
