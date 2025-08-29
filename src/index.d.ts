/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

// NOTE: this project uses vue3 option components only.
declare module '*.vue' {
    import {type ComponentOptions} from 'vue'
    const component: ComponentOptions
    // noinspection JSUnusedGlobalSymbols
    export default component
}

interface IAccount {
    // NOTE: correlates with CONS.DB.STORES.ACCOUNTS.FIELDS
    cID: number
    cSwift: string
    cNumber: string
    cLogoUrl: string
    cStockAccount: boolean
}

interface IBookingType {
    // NOTE: correlates with CONS.DB.STORES.BOOKING_TYPES.FIELDS
    cID: number
    cName: string
    cAccountNumberID: number
}

interface IBooking {
    // NOTE: correlates with CONS.DB.STORES.BOOKING.FIELDS
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

interface IStock {
    // NOTE: correlates with CONS.DB.STORES.STOCK.FIELDS
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

interface IStockStore {
    cID: number
    cCompany: string
    cISIN: string
    cWKN: string
    cSymbol: string
    cMeetingDay: string
    cQuarterDay: string
    cFadeOut: number
    cFirstPage: number
    cURL: string
    cAccountNumberID: number
    mPortfolio: number
    mChange: number
    mBuyValue: number
    mEuroChange: number
    mMin: number
    mValue: number
    mMax: number
}

interface IBackup {
    sm: {
        cVersion: number
        cDBVersion: number
        cEngine: string
    }
    accounts: IAccount[]
    bookings: IBooking[]
    bookingTypes: IBookingType[]
    stocks: IStock[] & Stockmanager.IStock[]
    transfers?: IBooking[] & Stockmanager.ITransfer[]
}

interface IStoresDB {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStock[]
}

interface IStores {
    accounts: IAccount[],
    bookings: IBooking[],
    bookingTypes: IBookingType[],
    stocks: IStockStore[]
}

interface IStorageLocal {
    sActiveAccountId: number
    sBookingsPerPage: number
    sStocksPerPage: number
    sPartner: boolean
    sSkin: string
    sService: string
    sExchanges: string[]
    sMaterials: string[]
    sIndexes: string[]
    sMarkets: string[]
}

interface IService {
    NAME: string
    HOME: string
    QUOTE: string
}

interface IContent {
    title: string
    content: string
    icon: string
}

type StocksMenuItems = {
    readonly title: string
    readonly id: string
    readonly icon: string
}

interface _IDrawerControl {
    id: number
    title: string
    value: string
    class: string
}

interface IState {
    show: boolean
    drawerControls: _IDrawerControl[]
}

namespace Stockmanager {
    interface IStock {
        cID: number
        cCompany: string
        cISIN: string
        cWKN: string
        cSym: string
        cMeetingDay: number
        cQuarterDay: number
        cFadeOut: number
        cFirstPage: number
        cURL: string
    }

    interface ITransfer {
        cID: number
        cStockID: number
        cDate: number
        cExDay: number
        cUnitQuotation: number
        cAmount: number
        cCount: number
        cFees: number
        cSTax: number
        cFTax: number
        cTax: number
        cSoli: number
        cMarketPlace: string
        cDescription: string
        cType: number
    }
}
namespace FetchedResources {
    type TIdIsin = {
        id: number
        isin: string
    }

    interface ICompanyData {
        company: string
        wkn: string
        symbol: string
    }

    interface IMinRateMaxData {
        id: number,
        isin: string,
        rate: string,
        min: string,
        max: string,
        cur: string
    }

    interface IDailyChangesData {
        key: string
        value: {
            percentChange: string,
            change: number,
            stringChange: string
        }
    }

    interface IExchangesData {
        key: string,
        value: number
    }

    interface IMaterialData {
        key: string,
        value: number
    }

    interface IIndexData {
        key: string,
        value: number
    }

    interface IDatesData {
        key: number | undefined
        value: {
            qf: number
            gm: number
        }
    }
}
