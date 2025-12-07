/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import deDE from '@/locales/de-DE.json'

export interface IAccountEntry {
    id: number
    name: string
    sum: number
    nameClass: string
    sumClass: string
}

export interface IAccount_DB {
    cID: number
    cSwift: string
    cIban: string
    cLogoUrl: string
    cWithDepot: boolean
}

export interface IAccount_Formular {
    id: number
    swift: string
    iban: string
    logoUrl: string
    withDepot: boolean
}

export interface IAccount_Store extends IAccount_DB {
}

export interface IBackup {
    sm: {
        cVersion: number
        cDBVersion: number
        cEngine: string
    }
    accounts: IAccount_Store[]
    bookings: IBooking_DB[]
    bookingTypes: IBookingType_Store[]
    stocks: IStock_Store[] & IStock_SM[]
    transfers?: IBooking_SM[]
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

export interface IBookingFormularReturn {
    formRef: Ref<HTMLFormElement | null>
    bookingFormularData: IBooking_Formular
    selected: Ref<number>
    reset: () => void
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

export interface IBooking_Store extends IBooking_DB {
}

export interface ICheckboxGridProps {
    type: symbol
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

export interface IContentCardProps {
    title: string
    data: IContent[]
}

export interface ICreditDebitFieldsetProps {
    modelValue: { credit: number, debit: number }
    disabled?: boolean,
    legend: string
}

export interface ICurrencyInputProps {
    modelValue: number
    disabled?: boolean
    label: string
    rules?: Array<(_v: number) => boolean | string>  // Number validator!
}

export interface IDailyChangesData {
    key: string
    value: {
        percentChange: string,
        change: number,
        stringChange: string
    }
}

export interface IDateData {
    key: number | undefined
    value: {
        qf: number
        gm: number
    }
}

export interface IDynamicListProps {
    type: symbol
    hint?: string
    placeholder?: string
}

export interface IEventTarget extends HTMLInputElement {
    target: { files: UnwrapRef<Blob>[] }
}

export interface IExchangeData {
    key: string,
    value: number
}

export interface IHeader {
    title: string
    align: 'start'
    sortable: boolean
    key: string
}

export interface II18n {
    i18n: I18n<{ 'de-DE': TMessageSchema, 'en-US': TMessageSchema }>
}

export interface IStringNumber {
    key: string
    value: number
}

export interface INumberString {
    key: number
    value: string
}

export interface IOptionMenuProps {
    recordID: number
    menuItems: IMenuItem[]
}

export interface IMenuItem {
    readonly title: string
    readonly id: string
    readonly icon: string
}

export interface IMinRateMaxData {
    id: number,
    isin: string,
    rate: string,
    min: string,
    max: string,
    cur: string
}

export interface IPinia {
    pinia: Pinia
}

export interface IRecords_DB {
    type: string
    data?: unknown
    key?: number
}

export interface IRouter {
    router: Router
}

export interface IService {
    NAME: string
    HOME: string
    QUOTE: string
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

export interface IStock_Formular {
    id: number
    isin: string
    company: string
    symbol: string
    meetingDay: string
    quarterDay: string
    fadeOut: boolean
    firstPage: boolean
    url: string
    askDates: string
}

export interface IStockFormularProps {
    isUpdate: boolean
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

export interface IStock_SM {
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

export interface IStorageOnline {
                  id: number,
                  isin: string,
                  min: string,
                  rate: string,
                  max: string,
                  cur: string
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

export interface IVuetify {
    vuetify: ReturnType<typeof createVuetify>
}

export type TMessageSchema = typeof deDE

export type TStorage = {
    [p: string]: string | number | string[]
}
