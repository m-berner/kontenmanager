export const DEFAULTS = Object.freeze({
    CURRENCY: 'EUR',
    LANG: 'de',
    LOCALE: 'de-DE',
    ASK_DATE_INTERVAL: 7,
    SM_RESTORE_ACCOUNT_ID: 1,
    LARGE_FILE_THRESHOLD_KB: 10000,
    TITLE: 'KontenManager',
    COPYRIGHT: `2025-${new Date().getFullYear()} Martin Berner`,
    MAILTO: 'mailto:kontenmanager@gmx.de',
    HELP_URL: 'https://kontenmanager8.wixsite.com/kontenmanager',
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
});
