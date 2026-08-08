/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {StoresConfigType} from "@/domain/types";

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
    // INVALID_BANK / INVALID_REGION / INVALID_BRANCH / TEST_BIC were removed:
    // the first three were returned only by per-segment checks in validateSWIFT
    // that its format regex had already made unreachable, and TEST_BIC was never
    // returned by anything at all. They were not free — `swiftRules` mapped each
    // to a translated message, so the message table promised failure reasons the
    // validator could not produce. Do not reintroduce one without a validator
    // path that can actually return it.
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
    // Not an ISO-3166 country: the ISIN prefix used by European Union and EIB
    // issues (e.g. EU000A1G0AA6). Sits here alphabetically alongside the real
    // country codes, like the XS/XK securities prefixes further down. Without
    // it, validateISIN rejected those with INVALID_COUNTRY and isinRules
    // blocked the stock from being added at all — a legitimate holding for a
    // European investor.
    "EU",
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
    ZERO_TIME: 0,
    /**
     * Sentinel "year" selecting bookings that have no usable `cBookDate`.
     *
     * Such bookings are real — `normalizeDate` deliberately yields `""` for a
     * missing or malformed date rather than defaulting to today — but their
     * year is `NaN`, and `NaN === year` is always false. They therefore counted
     * in the all-time totals while being excluded from every per-year total,
     * and no year selection could reach them. This sentinel gives them one, so
     * the per-year rows reconcile with the all-time figure instead of silently
     * differing from it.
     *
     * `-1` is unreachable from a real ISO date, which `ISO_DATE_REGEX` requires
     * to be four digits.
     */
    UNDATED_YEAR: -1
} as const;

/**
 * Below this many shares, a stock position is treated as fully sold out
 * (floating-point residue from BUY/SELL summation) rather than a real holding.
 * Used consistently to hide portfolio-related fields and to exclude the
 * position from aggregate totals.
 */
export const PORTFOLIO = {
    MINIMUM_THRESHOLD: 0.1
} as const;

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
    /**
     * The currencies an account may be denominated in, and therefore the only
     * ones a quote can be converted *into*.
     *
     * Deliberately short. Conversion needs a live rate for the pair, and
     * `appAdapter.fetchExternalData` fetches exactly two —
     * `${accountCurrency}USD` and `${accountCurrency}EUR` — which is what
     * `useOnlineStockData`'s divisor chain can consume. Offering a third
     * currency in the account form would produce prices that silently pass
     * through unconverted (`divisor = 1`), which is the failure
     * `providerUtils.parseCurrency` already documents for scraped CAD/AUD/HKD
     * quotes. Widen this only together with the rate-fetching side.
     *
     * A 70-entry `CODE` map of region -> ISO currency used to sit here. It
     * existed solely to derive the app's currency from the browser locale, which
     * is the coupling this replaced, so it went with the derivation — leaving it
     * would have left the lookup available to reach for again.
     */
    SUPPORTED: ["EUR", "USD"] as const
} as const;

export const FETCH = {
    PROVIDERS: {
        none: {
            NAME: "Disabled",
            HOME: "",
            QUOTE: ""
        },
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
            QUOTE: "https://www.wallstreet-online.de/_rpc/json/search/auto/searchInst/"
        },
        acheck: {
            NAME: "Aktien-Check",
            HOME: "https://m.aktiencheck.de/",
            QUOTE: "https://m.aktiencheck.de/quotes/suche/?search="
        },
        ard: {
            NAME: "ARD",
            HOME: "https://www.tagesschau.de/wirtschaft/boersenkurse/",
            QUOTE: "https://www.tagesschau.de/wirtschaft/boersenkurse/suche/?suchbegriff="
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
                WITH_DEPOT: "cWithDepot",
                CURRENCY: "cCurrency"
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
                ACCOUNT_NUMBER_ID: "cAccountNumberID",
                ROLE: "cRole"
            },
            NONE: -1,
            BUY: 1,
            SELL: 2,
            DIVIDEND: 3,
            OTHER: 4,
            FEE: 5,
            TAX: 6,
            STOCKTAX: 7,
            SOURCETAX: 8
        },
        STOCKS: {
            NAME: "stocks",
            FIELDS: {
                ID: "cID",
                ISIN: "cISIN",
                SYMBOL: "cSymbol",
                NAME: "cName",
                COUNT: "cCount",
                BUY_VALUE: "cBuyValue",
                BUY_DATE: "cBuyDate",
                RATE: "cRate",
                URL: "cURL",
                MEETING_DAY: "cMeetingDay",
                QUARTER_DAY: "cQuarterDay",
                COMPANY: "cCompany",
                FADE_OUT: "cFadeOut",
                FIRST_PAGE: "cFirstPage",
                ACCOUNT_NUMBER_ID: "cAccountNumberID"
            }
        },
        // The RAM-only fields every stock item carries. Kept deliberately
        // minimal: this object is spread into EVERY stock on every store load,
        // and stocks.update() copies the whole set through extractRamData on
        // every edit and every quote write.
        //
        // Eight further fields used to live here (mChange, mBuyValue,
        // mDividendYielda/b, mDividendYeara/b, mRealDividend, mRealBuyValue).
        // They were seeded, copied and type-declared but never written by any
        // fetch path nor read by any view — placeholders for a dividend-yield
        // feature that was never built (ShowDividend.vue computes dividends
        // straight from bookings via dividendsByStockId). Removed rather than
        // left looking like part of the model.
        STOCK_MEMORY: {
            mPortfolio: 0,
            mInvest: 0,
            // Renamed from `mEuroChange`. The name asserted a currency the value
            // does not necessarily carry: it is `mValue * mPortfolio - mInvest`,
            // and `mValue` is converted into the *account's* currency, which may
            // be USD. The old name was accurate only while EUR was the one
            // possible outcome.
            mChange: 0,
            mMin: 0,
            mValue: 0,
            mMax: 0,
            mDeleteable: false
        }
    },
    MIN_SUPPORTED_VERSION: 27,
    // 29 adds `cCurrency` to the accounts store (migrator's
    // `backfillAccountCurrency` stamps EUR onto pre-existing rows).
    CURRENT_VERSION: 29,
    MAX_FILE_SIZE: 64 * 1024 * 1024
} as const;

/**
 * Valid IndexedDB store names.
 * Used for runtime validation and compile-time narrowing.
 */
export const VALID_STORES = [
    INDEXED_DB.STORE.ACCOUNTS.NAME,
    INDEXED_DB.STORE.BOOKINGS.NAME,
    INDEXED_DB.STORE.STOCKS.NAME,
    INDEXED_DB.STORE.BOOKING_TYPES.NAME
] as const;

/**
 * Semantic role of a booking type, independent of its (globally auto-incrementing,
 * not per-account) `cID`. Used to identify a booking type's meaning
 * (e.g. "this is the Buy type for this account") instead of comparing against a
 * fixed numeric id, which is only ever correct for the first depot account ever
 * created in a given IndexedDB instance.
 */
export const BOOKING_TYPE_ROLE = {
    BUY: "buy",
    SELL: "sell",
    DIVIDEND: "dividend",
    OTHER: "other"
} as const;

export type BookingTypeRoleType = (typeof BOOKING_TYPE_ROLE)[keyof typeof BOOKING_TYPE_ROLE];

export type ValidStoreNameType = (typeof VALID_STORES)[number];

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
    /**
     * The app-level default currency.
     *
     * Two jobs, both narrow: it seeds `cCurrency` for a newly created account,
     * and it is the display currency while no account is active. The currency
     * that actually matters for figures on screen is the **active account's**
     * `cCurrency` — see `resolveDisplayCurrency` (`domain/logic.ts`).
     *
     * It exists as a stored preference rather than being derived from the UI
     * language because those are independent properties of a user: someone can
     * run an English-language browser and hold euros. Deriving one from the
     * other put every eurozone user whose browser is not German onto USD, and
     * converted their EUR quotes by the USD/EUR rate to get there.
     */
    CURRENCY: {key: "sCurrency", value: "EUR"},
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
