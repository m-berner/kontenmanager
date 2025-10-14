/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

export interface IAccountDB {
    cID: number
    cSwift: string
    cIban: string
    cLogoUrl: string
    cWithDepot: boolean
}

export interface IBookingTypeDB {
    cID: number
    cName: string
    cAccountNumberID: number
}

export interface IBookingDB {
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

export interface IStoresDB {
    accountsDB: IAccountDB[],
    bookingsDB: IBookingDB[],
    bookingTypesDB: IBookingTypeDB[],
    stocksDB: IStockDB[]
}

export interface IAccount {
    cID: number
    cSwift: string
    cIban: string
    cLogoUrl: string
    cWithDepot: boolean
}

export interface IBookingType {
    cID: number
    cName: string
    cAccountNumberID: number
}

export interface IBooking {
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

export interface IAccountFormularData {
    id: number
    swift: string
    iban: string
    logoUrl: string
    withDepot: boolean
}

export interface IBookingFormularData {
    id: number
    bookDate: string
    exDate: string
    credit: number
    debit: number
    description: string
    count: number
    bookingTypeId: number
    accountTypeId: number
    stockId: number
    sourceTax: number
    transactionTax: number
    tax: number
    fee: number
    soli: number
    marketPlace: string
}

export interface IStockDB {
    cID: number
    cCompany: string
    cISIN: string
    //cWKN: string
    cSymbol: string
    cFirstPage: number
    cFadeOut: number
    cMeetingDay: string
    cQuarterDay: string
    cURL: string
    cAccountNumberID: number
}

export interface IStockOnlyMemory {
    mPortfolio: number
    mInvest: number
    mChange: number
    mBuyValue: number
    mEuroChange: number
    mMin: number
    mValue: number
    mMax: number
    mDividendYielda?: number
    mDividendYeara?: number
    mDividendYieldb?: number
    mDividendYearb?: number
    mRealDividend?: number
    mRealBuyValue?: number
    mDeleteable?: boolean
    mAskDates?: boolean
}

export interface IStock extends IStockOnlyMemory, IStockDB {
    //
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

export interface ICompanyData {
    company: string
    //wkn: string
    symbol: string
}

export interface IContent {
    readonly subTitle: string
    readonly content: string
    readonly icon: string
}

export interface IMenuItem {
    readonly title: string
    readonly id: string
    readonly icon: string
}

export interface IRecordsDB {
    type: string
    data: unknown
    key: number
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
