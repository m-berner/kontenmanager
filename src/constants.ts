/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {HeaderItem, MaterialItemKeyType, MenuItemData, OptionTab, StoresConfigType} from "@/types";

export const ERROR_CATEGORY = {
    DATABASE: "database",
    NETWORK: "network",
    VALIDATION: "validation",
    BUSINESS: "business",
    BROWSER_API: "browser",
    NOTIFICATION_API: "notification",
    STORAGE_API: "storage",
    STORE: "memory"
} as const;

/**
 * Stable identifiers for validation errors.
 * These map to i18n keys.
 */
export const VALIDATION_CODES = {
    REQUIRED: "required",
    INVALID_FORMAT: "invalid_format",
    INVALID_LENGTH: "invalid_length",
    INVALID_CHECKSUM: "invalid_checksum",
    DUPLICATE: "duplicate",
    NEGATIVE_VALUE: "negative_value",
    ONE_OF_TWO_REQUIRED: "one_of_two_required",
    INVALID_COUNTRY: "invalid_country",
    INVALID_BANK: "invalid_bank",
    INVALID_REGION: "invalid_region",
    INVALID_BRANCH: "invalid_branch",
    TEST_BIC: "test_bic",
    MAX_LENGTH: "max_length",
    MUST_BEGIN_WITH_LETTER: "must_begin_with_letter"
} as const;

export const VALID_COUNTRY_CODES: ReadonlySet<string> = new Set([
    "AD",
    "AE",
    "AF",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AQ",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BT",
    "BV",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CK",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "EH",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FK",
    "FM",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GF",
    "GG",
    "GH",
    "GI",
    "GL",
    "GM",
    "GN",
    "GP",
    "GQ",
    "GR",
    "GS",
    "GT",
    "GU",
    "GW",
    "GY",
    "HK",
    "HM",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IM",
    "IN",
    "IO",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JE",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KY",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MF",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MP",
    "MQ",
    "MR",
    "MS",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NC",
    "NE",
    "NF",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NU",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PF",
    "PG",
    "PH",
    "PK",
    "PL",
    "PM",
    "PN",
    "PR",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SX",
    "SY",
    "SZ",
    "TC",
    "TD",
    "TF",
    "TG",
    "TH",
    "TJ",
    "TK",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "UM",
    "US",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VG",
    "VI",
    "VN",
    "VU",
    "WF",
    "WS",
    "XS",
    "XK",
    "YE",
    "YT",
    "ZA",
    "ZM",
    "ZW"
]);


export const DATE = {
    ISO: "1970-01-01",
    ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
    ZERO_TIME: 0
} as const;
//
export const COMPONENTS = {
    TITLE_BAR: {
        LOGO: "../assets/icon64.png"
    },
    DYNAMIC_LIST: {
        TYPES: {
            MARKETS: "markets",
            EXCHANGES: "exchanges"
        }
    },
    CHECKBOX_GRID: {
        TYPES: {
            INDEXES: "indexes",
            MATERIALS: "materials"
        }
    },
    DIALOGS: {
        FADE_IN_STOCK: "fadeInStock",
        ADD_ACCOUNT: "addAccount",
        UPDATE_ACCOUNT: "updateAccount",
        DELETE_ACCOUNT: "deleteAccount",
        ADD_STOCK: "addStock",
        UPDATE_STOCK: "updateStock",
        DELETE_STOCK: "deleteStock",
        ADD_BOOKING_TYPE: "addBookingType",
        DELETE_BOOKING_TYPE: "deleteBookingType",
        UPDATE_BOOKING_TYPE: "updateBookingType",
        ADD_BOOKING: "addBooking",
        UPDATE_BOOKING: "updateBooking",
        DELETE_BOOKING: "deleteBooking",
        EXPORT_DATABASE: "exportDatabase",
        IMPORT_DATABASE: "importDatabase",
        SHOW_ACCOUNTING: {
            NAME: "showAccounting",
            ALL_YEARS_ID: 1000
        },
        SHOW_DIVIDEND: "showDividend",
        UPDATE_QUOTE: "updateQuote",
        DELETE_ACCOUNT_CONFIRMATION: "deleteAccountConfirmation",
        OPEN_LINK: "openLink",
        PLACEHOLDER: {
            ACCOUNT_LOGO_URL: "z. B. https://www.ing.de"
        }
    }
} as const;

export const CURRENCIES = {
    EUR: "EUR",
    USD: "USD",
    CODE: new Map([
        ["ar", "ARS"],
        ["at", "EUR"],
        ["au", "AUD"],
        ["be", "EUR"],
        ["bg", "BGN"],
        ["bo", "BOB"],
        ["br", "BRL"],
        ["bz", "BZD"],
        ["ca", "CAD"],
        ["ch", "CHF"],
        ["cl", "CLP"],
        ["chs", "CNY"],
        ["cht", "CNY"],
        ["co", "COU"],
        ["cr", "CRC"],
        ["cs", "CZK"],
        ["cy", "EUR"],
        ["da", "DKK"],
        ["de", "EUR"],
        ["do", "DOP"],
        ["ec", "USD"],
        ["ee", "EUR"],
        ["el", "EUR"],
        ["en", "GBP"],
        ["es", "EUR"],
        ["et", "EUR"],
        ["fi", "EUR"],
        ["fr", "EUR"],
        ["gb", "GBP"],
        ["gr", "EUR"],
        ["gt", "GTQ"],
        ["hk", "HKD"],
        ["hn", "HNL"],
        ["hu", "HUF"],
        ["ie", "EUR"],
        ["in", "INR"],
        ["is", "ISK"],
        ["it", "EUR"],
        ["ja", "JPY"],
        ["jm", "JMD"],
        ["ko", "KRW"],
        ["li", "EUR"],
        ["lt", "EUR"],
        ["lu", "EUR"],
        ["mc", "EUR"],
        ["mo", "MOP"],
        ["mt", "EUR"],
        ["mx", "MXN"],
        ["ni", "NIO"],
        ["nl", "EUR"],
        ["no", "NOK"],
        ["nz", "NZD"],
        ["pa", "PAB"],
        ["pe", "PEN"],
        ["ph", "PHP"],
        ["pl", "PLN"],
        ["pr", "USD"],
        ["pt", "EUR"],
        ["py", "PYG"],
        ["ro", "RON"],
        ["ru", "RUB"],
        ["se", "SEK"],
        ["sg", "SGD"],
        ["sk", "EUR"],
        ["sl", "EUR"],
        ["sp", "RSD"],
        ["sv", "USD"],
        ["tr", "TRY"],
        ["tt", "TTD"],
        ["tw", "TWD"],
        ["uy", "UYU"],
        ["us", "USD"],
        ["ve", "VES"],
        ["za", "ZAR"],
        ["zw", "ZWD"]
    ])
} as const;

export const FETCH = {
    PROVIDERS: {
        goyax: {
            NAME: "Goyax",
            HOME: "https://www.goyax.de/",
            QUOTE: "https://www.goyax.de/aktien/"
        },
        fnet: {
            NAME: "Finanzen.Net",
            HOME: "https://www.finanzen.net/aktienkurse/",
            QUOTE: "https://www.finanzen.net/suchergebnis.asp?_search="
        },
        wstreet: {
            NAME: "Wallstreet-Online",
            HOME: "https://www.wallstreet-online.de",
            QUOTE:
                "https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/"
        },
        acheck: {
            NAME: "Aktien-Check",
            HOME: "https://m.aktiencheck.de/",
            QUOTE: "https://m.aktiencheck.de/quotes/suche/?search="
        },
        ard: {
            NAME: "ARD",
            HOME: "https://www.tagesschau.de/wirtschaft/boersenkurse/",
            QUOTE:
                "https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff="
        },
        tgate: {
            NAME: "Tradegate",
            HOME: "https://www.tradegate.de/",
            QUOTE: "https://www.tradegate.de/orderbuch.php?isin="
        }
    }
} as const;

export const INDEXED_DB = {
    NAME: "kontenmanager.db",
    INVALID_ID: -1,
    STORE: {
        ACCOUNTS: {
            NAME: "accounts",
            FIELDS: {
                ID: "cID",
                SWIFT: "cSwift",
                LOGO_URL: "cLogoUrl",
                IBAN: "cIban",
                WITH_DEPOT: "cWithDepot"
            }
        },
        BOOKINGS: {
            NAME: "bookings",
            FIELDS: {
                ID: "cID",
                BOOK_DATE: "cBookDate",
                EX_DATE: "cExDate",
                COUNT: "cCount",
                CREDIT: "cCredit",
                DEBIT: "cDebit",
                DESCRIPTION: "cDescription",
                BOOKING_TYPE_ID: "cBookingTypeID",
                ACCOUNT_NUMBER_ID: "cAccountNumberID",
                STOCK_ID: "cStockID",
                SOLI: "cSoli",
                MARKET_PLACE: "cMarketPlace",
                TAX: "cTax",
                FEE: "cFee",
                SOURCE_TAX: "cSourceTax",
                TRANSACTION_TAX: "cTransactionTax"
            }
        },
        BOOKING_TYPES: {
            NAME: "bookingTypes",
            FIELDS: {
                ID: "cID",
                NAME: "cName",
                ACCOUNT_NUMBER_ID: "cAccountNumberID"
            },
            NONE: -1,
            BUY: 1,
            SELL: 2,
            DIVIDEND: 3,
            CREDIT: 4,
            DEBIT: 5,
            OTHER: 4,
            FEE: 5,
            TAX: 6
        },
        STOCKS: {
            NAME: "stocks",
            FIELDS: {
                ID: "cID",
                ISIN: "cISIN",
                SYMBOL: "cSymbol",
                FADE_OUT: "cFadeOut",
                FIRST_PAGE: "cFirstPage",
                URL: "cURL",
                MEETING_DAY: "cMeetingDay",
                QUARTER_DAY: "cQuarterDay",
                COMPANY: "cCompany",
                ACCOUNT_NUMBER_ID: "cAccountNumberID"
            }
        },
        STOCK_MEMORY: {
            mPortfolio: 0,
            mInvest: 0,
            mChange: 0,
            mBuyValue: 0,
            mEuroChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDividendYielda: 0,
            mDividendYeara: 0,
            mDividendYieldb: 0,
            mDividendYearb: 0,
            mRealDividend: 0,
            mRealBuyValue: 0,
            mDeleteable: false
        }
    },
    LEGACY_IMPORT_VERSION: 25,
    CURRENT_VERSION: 27,
    MAX_FILE_SIZE: 64 * 1024 * 1024
} as const;

export const SETTINGS: StoresConfigType = {
    INDEXES: {
        dax: "DAX",
        dow: "Dow Jones",
        nasdaq: "NASDAQ Comp.",
        nikkei: "NIKKEI 225",
        hang: "Hang Seng",
        ibex: "IBEX 35",
        straits: "Straits Times",
        asx: "Australia All Ordinaries",
        rts: "RTS",
        bovespa: "BOVESPA",
        sensex: "SENSEX",
        sci: "Shanghai Composite",
        ftse: "FTSE 100",
        smi: "SMI",
        cac: "CAC 40",
        stoxx: "Euro Stoxx 50",
        tsx: "S&P/TSX",
        sp: "S&P 500"
    },
    MATERIALS: {
        au: "Goldpreis",
        ag: "Silberpreis",
        brent: "Ölpreis (Brent)",
        wti: "Ölpreis (WTI)",
        cu: "Kupferpreis",
        pt: "Platinpreis",
        al: "Aluminiumpreis",
        ni: "Nickelpreis",
        sn: "Zinnpreis",
        pb: "Bleipreis",
        pd: "Palladiumpreis"
    }
} as const;

export const BROWSER_STORAGE = {
    ACTIVE_ACCOUNT_ID: {key: "sActiveAccountId", value: -1},
    SKIN: {key: "sSkin", value: "ocean"},
    BOOKINGS_PER_PAGE: {key: "sBookingsPerPage", value: 9},
    STOCKS_PER_PAGE: {key: "sStocksPerPage", value: 9},
    DIVIDENDS_PER_PAGE: {key: "sDividendsPerPage", value: 9},
    SUMS_PER_PAGE: {key: "sSumsPerPage", value: 11},
    SERVICE: {key: "sService", value: "wstreet"},
    EXCHANGES: {key: "sExchanges", value: ["EURUSD"]},
    INDEXES: {key: "sIndexes", value: ["dax", "dow"]},
    MARKETS: {key: "sMarkets", value: ["Frankfurt", "XETRA"]},
    MATERIALS: {key: "sMaterials", value: ["au", "brent"]}
} as const;


const TRANSLATION_KEYS = {
    // Dividend
    DIVIDEND_YEAR: "components.dialogs.showDividend.yearLabel",
    DIVIDEND_SUM: "components.dialogs.showDividend.sumLabel",

    // Accounting
    ACCOUNTING_NAME: "components.dialogs.showAccounting.nameLabel",
    ACCOUNTING_SUM: "components.dialogs.showAccounting.sumLabel",

    // Themes
    THEME_EARTH: "views.optionsIndex.themeNames.earth",
    THEME_OCEAN: "views.optionsIndex.themeNames.ocean",
    THEME_SKY: "views.optionsIndex.themeNames.sky",
    THEME_MEADOW: "views.optionsIndex.themeNames.meadow",
    THEME_DARK: "views.optionsIndex.themeNames.dark",
    THEME_LIGHT: "views.optionsIndex.themeNames.light",

    // Tabs
    TAB_GE: "views.optionsIndex.tabs.ge",
    TAB_MP: "views.optionsIndex.tabs.mp",
    TAB_IND: "views.optionsIndex.tabs.ind",
    TAB_MAT: "views.optionsIndex.tabs.mat",
    TAB_EX: "views.optionsIndex.tabs.ex",

    // Home/Bookings
    HOME_ACTION: "views.homeContent.bookingsTable.headers.action",
    HOME_DATE: "views.homeContent.bookingsTable.headers.date",
    HOME_DEBIT: "views.homeContent.bookingsTable.headers.debit",
    HOME_CREDIT: "views.homeContent.bookingsTable.headers.credit",
    HOME_DESCRIPTION: "views.homeContent.bookingsTable.headers.description",
    HOME_BOOKING_TYPE: "views.homeContent.bookingsTable.headers.bookingType",
    HOME_MENU_UPDATE: "views.homeContent.bookingsTable.menuItems.update",
    HOME_MENU_DELETE: "views.homeContent.bookingsTable.menuItems.delete",

    // Company/Stocks
    COMPANY_ACTION: "views.companyContent.stocksTable.headers.action",
    COMPANY_COMPANY: "views.companyContent.stocksTable.headers.company",
    COMPANY_ISIN: "views.companyContent.stocksTable.headers.isin",
    COMPANY_QF: "views.companyContent.stocksTable.headers.qf",
    COMPANY_GM: "views.companyContent.stocksTable.headers.gm",
    COMPANY_PORTFOLIO: "views.companyContent.stocksTable.headers.portfolio",
    COMPANY_WIN_LOSS: "views.companyContent.stocksTable.headers.winLoss",
    COMPANY_52LOW: "views.companyContent.stocksTable.headers.52low",
    COMPANY_RATE: "views.companyContent.stocksTable.headers.rate",
    COMPANY_52HIGH: "views.companyContent.stocksTable.headers.52high",
    COMPANY_MENU_UPDATE: "views.companyContent.stocksTable.menuItems.update",
    COMPANY_MENU_DELETE: "views.companyContent.stocksTable.menuItems.delete",
    COMPANY_MENU_DIVIDEND: "views.companyContent.stocksTable.menuItems.dividend",
    COMPANY_MENU_LINK: "views.companyContent.stocksTable.menuItems.link",
    //
    ag: "views.optionsIndex.materials.ag",
    al: "views.optionsIndex.materials.al",
    au: "views.optionsIndex.materials.au",
    brent: "views.optionsIndex.materials.brent",
    cu: "views.optionsIndex.materials.cu",
    ni: "views.optionsIndex.materials.ni",
    pb: "views.optionsIndex.materials.pb",
    pd: "views.optionsIndex.materials.pd",
    pt: "views.optionsIndex.materials.pt",
    sn: "views.optionsIndex.materials.sn",
    wti: "views.optionsIndex.materials.wti"
} as const;

type TranslationKeyType = typeof TRANSLATION_KEYS[keyof typeof TRANSLATION_KEYS];

export const ITEMS_PER_PAGE_OPTIONS = [
    {
        value: 5,
        title: "5"
    },
    {
        value: 7,
        title: "7"
    },
    {
        value: 9,
        title: "9"
    },
    {
        value: 11,
        title: "11"
    },
    {
        value: 13,
        title: "13"
    }
];

/**
 * Helper function to create a material label.
 *
 * @param t - Localization function
 * @param itemKey - Translation key for the material label
 * @returns Material label configuration
 */
export const createMaterialLabel = (
    t: (_key: string) => string,
    itemKey: MaterialItemKeyType
): string => (
    t(TRANSLATION_KEYS[itemKey])
);

/**
 * Helper function to create a header item.
 *
 * @param t - Localization function
 * @param titleKey - Translation key for the header title
 * @param key - Data key for the column
 * @param sortable - Whether the column is sortable
 * @returns Header item configuration
 */
const createHeaderItem = (
    t: (_key: string) => string,
    titleKey: TranslationKeyType,
    key: string,
    sortable = false
): HeaderItem => ({
    title: t(titleKey),
    align: "start",
    sortable,
    key
});

/**
 * Factory function to create table header configuration for the dividend data table.
 *
 * @param t - Localization function
 * @returns Array of dividend configurations
 */
export const createDividendHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_YEAR, "year"),
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_SUM, "sum")
    ] as const;

/**
 * Factory function to create table header configuration for the accounting data table.
 *
 * @param t - Localization function
 * @returns Array of accounting configurations
 */
export const createAccountingHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_NAME, "name"),
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_SUM, "sum")
    ] as const;

/**
 * Factory function to create theme configuration.
 *
 * @param t - Localization function
 * @returns Array of theme configurations
 */
export const createThemes = (
    t: (_key: string) => string
): Record<string, string> =>
    ({
        // NOTE: lowercase properties required due to the vuetify plugin object
        earth: t(TRANSLATION_KEYS.THEME_EARTH),
        ocean: t(TRANSLATION_KEYS.THEME_OCEAN),
        sky: t(TRANSLATION_KEYS.THEME_SKY),
        meadow: t(TRANSLATION_KEYS.THEME_MEADOW),
        dark: t(TRANSLATION_KEYS.THEME_DARK),
        light: t(TRANSLATION_KEYS.THEME_LIGHT)
    });

/**
 * Factory function to create header configuration for the option page register.
 *
 * @param t - Localization function
 * @returns Array of tab configurations
 */
export const createTabs = (t: (_key: string) => string): readonly OptionTab[] =>
    [
        {
            title: t(TRANSLATION_KEYS.TAB_GE),
            id: "register_ge"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_MP),
            id: "register_mp"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_IND),
            id: "register_ind"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_MAT),
            id: "register_mat"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_EX),
            id: "register_ex"
        }
    ] as const;

/**
 * Factory function to create table header configuration for the bookings data table.
 *
 * @param t - Localization function
 * @returns Array of header configurations
 */
export const createHomeHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.HOME_ACTION, "mAction"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DATE, "cBookDate"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DEBIT, "cDebit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_CREDIT, "cCredit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DESCRIPTION, "cDescription"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_BOOKING_TYPE, "cBookingType")
    ] as const;

/**
 * Factory function to create context menu items configuration for booking actions.
 *
 * @param t - Localization function
 * @returns Array of menu items
 */
export const createHomeMenuItems = (
    t: (_key: string) => string
): readonly MenuItemData[] =>
    [
        {
            id: "update-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_UPDATE),
            icon: "$updateBooking",
            action: "updateBooking",
            variant: "danger"
        },
        {
            id: "delete-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_DELETE),
            icon: "$deleteBooking",
            action: "deleteBooking"
        }
    ] as const;

/**
 * Factory function to create table header configuration for the companies data table.
 *
 * @param t - Localization function
 * @returns Array of header configurations
 */
export const createCompanyHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_ACTION, "mAction"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_COMPANY, "cCompany", true),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_ISIN, "cISIN"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_QF, "cQuarterDay"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_GM, "cMeetingDay"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_PORTFOLIO, "mPortfolio", true),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_WIN_LOSS, "mEuroChange"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_52LOW, "mMin"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_RATE, "mValue"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_52HIGH, "mMax")
    ] as const;

/**
 * Factory function to create context menu items configuration for company actions.
 *
 * @param t - Localization function
 * @returns Array of menu items
 */
export const createCompanyMenuItems = (
    t: (_key: string) => string
): readonly MenuItemData[] =>
    [
        {
            id: "update-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_UPDATE),
            icon: "$showCompany",
            action: "updateStock"
        },
        {
            id: "delete-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DELETE),
            icon: "$deleteCompany",
            action: "deleteStock",
            variant: "danger"
        },
        {
            id: "show-dividend",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DIVIDEND),
            icon: "$showDividend",
            action: "showDividend"
        },
        {
            id: "open-link",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_LINK),
            icon: "$link",
            action: "openLink"
        }
    ] as const;
