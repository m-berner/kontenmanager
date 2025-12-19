/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import deDE from '@/locales/de-DE.json'

export interface I_Account_DB {
    cID: number | undefined
    cSwift: string
    cIban: string
    cLogoUrl: string
    cWithDepot: boolean
}

export interface I_Account_Entry {
    id: number
    name: string
    sum: number
    nameClass: string
    sumClass: string
}

export interface I_Account_Formular {
    id: number
    swift: string
    iban: string
    logoUrl: string
    withDepot: boolean
}

export interface I_Account_Store extends I_Account_DB {
}

export interface I_Backup {
    sm: {
        cVersion: number
        cDBVersion: number
        cEngine: string
    }
    accounts: I_Account_Store[]
    bookings: I_Booking_DB[]
    bookingTypes: I_Booking_Type_Store[]
    stocks: I_Stock_Store[] & I_Stock_SM[]
    transfers?: I_Booking_SM[]
}

export interface I_Booking_DB {
    cID: number | undefined
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

export interface I_Booking_Formular_Return {
    formRef: Ref<HTMLFormElement | null>
    bookingFormularData: I_Booking_Formular
    selected: Ref<number>
    reset: () => void
}

export interface I_Booking_SM {
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

export interface I_Booking_Store extends I_Booking_DB {
}

export interface I_Booking_Type_DB {
    cID: number | undefined
    cName: string
    cAccountNumberID: number
}

export interface I_Booking_Formular {
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

export interface I_Booking_Type_Store extends I_Booking_Type_DB {
}

export interface I_Checkbox_Grid_Props {
    type: symbol
}

export interface I_Company_Data {
    company: string
    symbol: string
}

export interface I_Content {
    readonly subTitle: string
    readonly content: string
    readonly icon: string
}

export interface I_Content_Card_Props {
    title: string
    data: I_Content[]
}

export interface I_Credit_Debit_Fieldset_Props {
    modelValue: { credit: number, debit: number }
    disabled?: boolean,
    legend: string
}

export interface I_Currency_Input_Props {
    modelValue: number
    disabled?: boolean
    label: string
    rules?: Array<(_v: number) => boolean | string>
}

export interface I_Daily_Changes_Data {
    key: string
    value: {
        percentChange: string,
        change: number,
        stringChange: string
    }
}

export interface I_Date_Data {
    key: number | undefined
    value: {
        qf: number
        gm: number
    }
}

export interface I_Dynamic_List_Props {
    type: symbol
    hint?: string
    placeholder?: string
}

export interface I_Event_Target extends HTMLInputElement {
    target: { files: UnwrapRef<Blob>[] }
}

export interface I_Exchange_Data {
    key: string,
    value: number
}

export interface I_Header {
    title: string
    align: 'start'
    sortable: boolean
    key: string
}

export interface I_I18n {
    i18n: I18n<{ 'de-DE': T_Message_Schema, 'en-US': T_Message_Schema }>
}

export interface I_String_Number {
    key: string
    value: number
}

export interface I_Number_String {
    key: number | undefined
    value: string
}

export interface I_Menu_Item {
    id: string
    title: string
    icon: string
    action: T_Menu_Action_Type
    variant?: 'default' | 'danger'
}

export interface I_Menu_Config {
    recordId: number
    items: I_Menu_Item[]
}

export interface I_Min_Rate_Max_Data {
    id: number,
    isin: string,
    rate: string,
    min: string,
    max: string,
    cur: string
}

export interface I_Pinia {
    pinia: Pinia
}

export interface I_Records {
    type: string
    data?: unknown
    key?: number
}

export interface I_Router {
    router: Router
}

export interface I_Service {
    NAME: string
    HOME: string
    QUOTE: string
}

export interface I_Stock_DB {
    cID: number | undefined
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

export interface I_Stock_Formular {
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

export interface I_Stock_Formular_Props {
    isUpdate: boolean
}

export interface I_Stock_Memory {
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

export interface I_Stock_Store extends I_Stock_Memory, I_Stock_DB {
    //
}

export interface I_Stock_SM {
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

export interface I_Storage_Online {
    id: number | undefined,
    isin: string,
    min: string,
    rate: string,
    max: string,
    cur: string
}

export interface I_Records_DB {
    accountsDB: I_Account_DB[],
    bookingsDB: I_Booking_DB[],
    bookingTypesDB: I_Booking_Type_DB[],
    stocksDB: I_Stock_DB[]
}

export interface I_Records_Store {
    accounts: I_Account_Store[],
    bookings: I_Booking_Store[],
    bookingTypes: I_Booking_Type_Store[],
    stocks: I_Stock_Store[]
}

export interface I_Storage_Local {
    sActiveAccountId: number
    sSkin: string
    sBookingsPerPage: number
    sStocksPerPage: number
    sDividendsPerPage: number
    sSumsPerPage: number
    sService: string
    sExchanges: string[]
    sIndexes: string[]
    sMarkets: string[]
    sMaterials: string[]
}

export interface I_Teleport {
    dialogName: T_Menu_Action_Type
    dialogOk: boolean
    dialogVisibility: boolean
}

export interface I_Visible_Alert {
    id: number
    type: 'error' | 'success' | 'warning' | 'info' | undefined
    title: string
    message: string
}

export interface I_Vuetify {
    vuetify: ReturnType<typeof createVuetify>
}

export type T_Message_Schema = typeof deDE

export type T_Storage = {
    [p: string]: string | number | string[]
}

export type T_Menu_Action_Type =
    | 'updateBooking'
    | 'deleteBooking'
    | 'updateStock'
    | 'deleteStock'
    | 'showDividend'
    | 'openLink'
    | 'fadeInStock'
    | 'addAccount'
    | 'updateAccount'
    | 'deleteAccount'
    | 'addStock'
    | 'addBookingType'
    | 'deleteBookingType'
    | 'updateBookingType'
    | 'addBooking'
    | 'exportDatabase'
    | 'importDatabase'
    | 'showAccounting'
    | 'updateQuote'
    | 'deleteAccountConfirmation'
    | 'home'
    | 'company'
    | 'setting'
