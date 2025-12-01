/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
export type TStorageChange = {
    [key: string]: browser.storage.StorageChange
}

export type TStorage = {
    [p: string]: string | number | string[]
}

export interface ITeleport {
    dialogName: string
    dialogOk: boolean
    dialogVisibility: boolean
}

export interface IVisibleAlert {
    id: number
    type: 'error' | 'success' | 'warning' | 'info' | undefined
    title: string
    message: string
}

export interface IHeader {
    title: string
    align: 'start'
    sortable: boolean
    key: string
}

export interface IBookingType_DB {
    cID: number
    cName: string
    cAccountNumberID: number
}

export interface IBookingType_Store extends IBookingType_DB {
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

export interface IAccount_DB {
    cID: number
    cSwift: string
    cIban: string
    cLogoUrl: string
    cWithDepot: boolean
}

export interface IAccount_Store extends IAccount_DB {
}

export interface IStock_DB {
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

export interface IStock_Memory {
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

export interface IStock_Store extends IStock_Memory, IStock_DB {
    //
}

export interface IStores_DB {
    accountsDB: IAccount_DB[],
    bookingsDB: IBooking_DB[],
    bookingTypesDB: IBookingType_DB[],
    stocksDB: IStock_DB[]
}

export interface IStores_Store {
    accounts: IAccount_Store[],
    bookings: IBooking_Store[],
    bookingTypes: IBookingType_Store[],
    stocks: IStock_Store[]
}

export interface IExchangeData {
    key: string,
    value: number
}

export interface ICompanyData {
    company: string
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

export interface IRecords_DB {
    type: string
    data?: unknown
    key?: number
}
