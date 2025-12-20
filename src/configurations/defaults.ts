/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export const DEFAULTS = Object.freeze(
    {
        CURRENCY: 'EUR',
        LANG: 'de',
        LOCALE: 'de-DE',
        //YEAR: 9999,
        ASK_DATE_INTERVAL: 7, // days
        BROWSER_STORAGE: {
            ACTIVE_ACCOUNT_ID: -1,
            BOOKINGS_PER_PAGE: 9,
            STOCKS_PER_PAGE: 9,
            DIVIDENDS_PER_PAGE: 9,
            SUMS_PER_PAGE: 11,
            SKIN: 'ocean',
            MATERIALS: ['au', 'brent'],
            INDEXES: ['dax', 'dow'],
            EXCHANGES: ['EURUSD'],
            MARKETS: ['Frankfurt', 'XETRA'],
            SERVICE: 'wstreet',
            PROPS: {
                SKIN: 'sSkin',
                SERVICE: 'sService',
                INDEXES: 'sIndexes',
                MARKETS: 'sMarkets',
                MATERIALS: 'sMaterials',
                EXCHANGES: 'sExchanges',
                ACTIVE_ACCOUNT_ID: 'sActiveAccountId',
                BOOKINGS_PER_PAGE: 'sBookingsPerPage',
                STOCKS_PER_PAGE: 'sStocksPerPage',
                DIVIDENDS_PER_PAGE: 'sDividendsPerPage',
                SUMS_PER_PAGE: 'sSumsPerPage'
            }
        },
        LOCAL_STORAGE: {
            DEBUG: '0',
            PROPS: {
                DEBUG: 'sDebug'
            }
        },
        SM_RESTORE_ACCOUNT_ID: 1
    }
)
