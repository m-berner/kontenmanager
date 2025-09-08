/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export interface IAccountDB {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS
    cID: number
    cSwift: string
    cNumber: string
    cLogoUrl: string
    cStockAccount: boolean
}

export interface IBookingTypeDB {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS
    cID: number
    cName: string
    cAccountNumberID: number
}

export interface IBookingDB {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.BOOKING.FIELDS
    cID: number
    cDate: string
    cExDate: string
    cDebit: number
    cCredit: number
    cDescription: string
    cCount: number
    cBookingTypeID: number
    cAccountNumberID: number
    cStockID: number
    cSoli: number
    cTax: number
    cFee: number
    cSourceTax: number
    cTransactionTax: number
    cMarketPlace: string
}

export interface IStockDB {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.STOCK.FIELDS
    cID: number
    cCompany: string
    cISIN: string
    cWKN: string
    cSymbol: string
    cFirstPage: number
    cFadeOut: number
    cMeetingDay: string
    cQuarterDay: string
    cURL: string
    cAccountNumberID: number
}

export interface IStoresDB {
    accountsDB: IAccountDB[],
    bookingsDB: IBookingDB[],
    bookingTypesDB: IBookingTypeDB[],
    stocksDB: IStockDB[]
}

export interface IAccount {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.ACCOUNTS.FIELDS
    cID: number
    cSwift: string
    cNumber: string
    cLogoUrl: string
    cStockAccount: boolean
}

export interface IBookingType {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.BOOKING_TYPES.FIELDS
    cID: number
    cName: string
    cAccountNumberID: number
}

export interface IBooking {
    // NOTE: correlates with CONS.INDEXED_DB.STORES.BOOKING.FIELDS
    cID: number
    cDate: string
    cExDate: string
    cDebit: number
    cCredit: number
    cDescription: string
    cCount: number
    cBookingTypeID: number
    cAccountNumberID: number
    cStockID: number
    cSoli: number
    cTax: number
    cFee: number
    cSourceTax: number
    cTransactionTax: number
    cMarketPlace: string
}

export interface IStockOnlyMemory {
    mPortfolio: number
    mChange: number
    mBuyValue: number
    mEuroChange: number
    mMin: number
    mValue: number
    mMax: number
}

export interface IStock extends IStockDB {
    mPortfolio: number
    mChange: number
    mBuyValue: number
    mEuroChange: number
    mMin: number
    mValue: number
    mMax: number
}

export interface IStores {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStock[]
}

export interface IExchangeData {
    key: string,
    value: number
}

// interface _IChanges {
//     oldValue: string[]
//     newValue: string[]
// }
//
// export interface IStorageLocal {
//     'sActiveAccountId': number
//     'sBookingsPerPage': number
//     'sStocksPerPage': number
//     'sPartner': boolean
//     'sSkin': string
//     'sService': string
//     'sExchanges': _IChanges
//     'sMaterials': _IChanges
//     'sIndexes': _IChanges
//     'sMarkets': _IChanges
// }

export interface ICompanyData {
    company: string
    wkn: string
    symbol: string
}

export interface IContent {
    readonly title: string
    readonly content: string
    readonly icon: string
}

export interface IMenuItem {
    readonly title: string
    readonly id: string
    readonly icon: string
}

export namespace FetchedResources {
    export interface IIdIsin {
        id: number
        isin: string
    }

    export interface IMinRateMaxData {
        id: number,
        isin: string,
        rate: string,
        min: string,
        max: string,
        cur: string
    }

    export interface IDailyChangesData {
        key: string
        value: {
            percentChange: string,
            change: number,
            stringChange: string
        }
    }

    export interface IMaterialData {
        key: string,
        value: number
    }

    export interface IIndexData {
        key: string,
        value: number
    }

    export interface IDateData {
        key: number | undefined
        value: {
            qf: number
            gm: number
        }
    }
}
