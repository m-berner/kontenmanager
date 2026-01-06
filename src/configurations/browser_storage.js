export const BROWSER_STORAGE = Object.freeze({
    LOCAL: {
        ACTIVE_ACCOUNT_ID: { key: 'sActiveAccountId', value: -1 },
        SKIN: { key: 'sSkin', value: 'ocean' },
        BOOKINGS_PER_PAGE: { key: 'sBookingsPerPage', value: 9 },
        STOCKS_PER_PAGE: { key: 'sStocksPerPage', value: 9 },
        DIVIDENDS_PER_PAGE: { key: 'sDividendsPerPage', value: 9 },
        SUMS_PER_PAGE: { key: 'sSumsPerPage', value: 11 },
        SERVICE: { key: 'sService', value: 'wstreet' },
        EXCHANGES: { key: 'sExchanges', value: ['EURUSD'] },
        INDEXES: { key: 'sIndexes', value: ['dax', 'dow'] },
        MARKETS: { key: 'sMarkets', value: ['Frankfurt', 'XETRA'] },
        MATERIALS: { key: 'sMaterials', value: ['au', 'brent'] }
    }
});
