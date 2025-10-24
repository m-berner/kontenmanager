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
    bookingsDB: IBooking_DB[],
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

export interface IBooking_SM {
    cDate: number
    cExDay: number
    cUnitQuotation: number
    cAmount: number
    cDescription: string
    cCount: number
    cType: number
    cStockID: number
    cSoli: number
    cTax: number
    cFees: number
    cSTax: number
    cFTax: number
    cMarketPlace: string
}

export interface IBooking_DB {
    cID: number
    cBookDate: string
    cExDate: string
    cDebit: number
    cCredit: number
    cDescription: string
    cCount: number
    cBookingTypeID: number
    cAccountNumberID: number
    cStockID: number
    cSoliCredit: number
    cSoliDebit: number
    cTaxCredit: number
    cTaxDebit: number
    cFeeCredit: number
    cFeeDebit: number
    cSourceTaxCredit: number
    cSourceTaxDebit: number
    cTransactionTaxCredit: number
    cTransactionTaxDebit: number
    cMarketPlace: string
}

export interface IBooking_Store extends IBooking_DB {
}

export interface IBooking_Formular {
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
    soliCredit: number
    soliDebit: number
    taxCredit: number
    taxDebit: number
    feeCredit: number
    feeDebit: number
    sourceTaxCredit: number
    sourceTaxDebit: number
    transactionTaxCredit: number
    transactionTaxDebit: number
    marketPlace: string
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
    taxCredit: number
    taxDebit: number
    fee: number
    soli: number
    marketPlace: string
}

export interface IStockDB {
    cID: number
    cCompany: string
    cISIN: string
    cSymbol: string
    cFirstPage: number
    cFadeOut: number
    cMeetingDay: string
    cQuarterDay: string
    cURL: string
    cAccountNumberID: number
    cAskDates: string
}

export interface IStockOnlyMemory {
    mPortfolio?: number
    mInvest?: number
    mChange?: number
    mBuyValue?: number
    mEuroChange?: number
    mMin?: number
    mValue?: number
    mMax?: number
    mDividendYielda?: number
    mDividendYeara?: number
    mDividendYieldb?: number
    mDividendYearb?: number
    mRealDividend?: number
    mRealBuyValue?: number
    mDeleteable?: boolean
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
