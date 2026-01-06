/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export const BROWSER_STORAGE = Object.freeze(
    {
        // ACTIVE_ACCOUNT_ID: -1,
        // BOOKINGS_PER_PAGE: 9,
        // STOCKS_PER_PAGE: 9,
        // DIVIDENDS_PER_PAGE: 9,
        // SUMS_PER_PAGE: 11,
        // SKIN: 'ocean',
        // MATERIALS: ['au', 'brent'],
        // INDEXES: ['dax', 'dow'],
        // EXCHANGES: ['EURUSD'],
        // MARKETS: ['Frankfurt', 'XETRA'],
        // SERVICE: 'wstreet',
        // PROPS: {
        //     SKIN: 'sSkin',
        //     SERVICE: 'sService',
        //     INDEXES: 'sIndexes',
        //     MARKETS: 'sMarkets',
        //     MATERIALS: 'sMaterials',
        //     EXCHANGES: 'sExchanges',
        //     ACTIVE_ACCOUNT_ID: 'sActiveAccountId',
        //     BOOKINGS_PER_PAGE: 'sBookingsPerPage',
        //     STOCKS_PER_PAGE: 'sStocksPerPage',
        //     DIVIDENDS_PER_PAGE: 'sDividendsPerPage',
        //     SUMS_PER_PAGE: 'sSumsPerPage'
        // },
        LOCAL: {
            ACTIVE_ACCOUNT_ID: { key: 'sActiveAccountId', value: -1},
            SKIN: { key: 'sSkin', value: 'ocean'},
            BOOKINGS_PER_PAGE: { key: 'sBookingsPerPage', value: 9},
            STOCKS_PER_PAGE: { key: 'sStocksPerPage', value: 9},
            DIVIDENDS_PER_PAGE: { key: 'sDividendsPerPage', value: 9},
            SUMS_PER_PAGE: { key: 'sSumsPerPage', value: 11},
            SERVICE: { key: 'sService', value: 'wstreet'},
            EXCHANGES: { key: 'sExchanges', value: ['EURUSD']},
            INDEXES: { key: 'sIndexes', value: ['dax', 'dow']},
            MARKETS: { key: 'sMarkets', value: ['Frankfurt', 'XETRA']},
            MATERIALS: { key: 'sMaterials', value: ['au', 'brent']}
        }
    }
)
