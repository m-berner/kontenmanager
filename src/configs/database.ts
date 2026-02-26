/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

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
        }
    },
    LEGACY_IMPORT_VERSION: 25,
    CURRENT_VERSION: 27,
    MAX_FILE_SIZE: 64 * 1024 * 1024,
    //CHUNK_SIZE: 100
} as const;
