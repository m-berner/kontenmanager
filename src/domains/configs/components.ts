/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

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
