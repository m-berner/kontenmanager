/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

export const TRANSLATION_KEYS = {
    // Dividend
    DIVIDEND_YEAR: "components.dialogs.showDividend.yearLabel",
    DIVIDEND_SUM: "components.dialogs.showDividend.sumLabel",

    // Accounting
    ACCOUNTING_NAME: "components.dialogs.showAccounting.nameLabel",
    ACCOUNTING_SUM: "components.dialogs.showAccounting.sumLabel",

    // Themes
    THEME_EARTH: "views.optionsIndex.themeNames.earth",
    THEME_OCEAN: "views.optionsIndex.themeNames.ocean",
    THEME_SKY: "views.optionsIndex.themeNames.sky",
    THEME_MEADOW: "views.optionsIndex.themeNames.meadow",
    THEME_DARK: "views.optionsIndex.themeNames.dark",
    THEME_LIGHT: "views.optionsIndex.themeNames.light",

    // Tabs
    TAB_GE: "views.optionsIndex.tabs.ge",
    TAB_MP: "views.optionsIndex.tabs.mp",
    TAB_IND: "views.optionsIndex.tabs.ind",
    TAB_MAT: "views.optionsIndex.tabs.mat",
    TAB_EX: "views.optionsIndex.tabs.ex",

    // Home/Bookings
    HOME_ACTION: "views.homeContent.bookingsTable.headers.action",
    HOME_DATE: "views.homeContent.bookingsTable.headers.date",
    HOME_DEBIT: "views.homeContent.bookingsTable.headers.debit",
    HOME_CREDIT: "views.homeContent.bookingsTable.headers.credit",
    HOME_DESCRIPTION: "views.homeContent.bookingsTable.headers.description",
    HOME_BOOKING_TYPE: "views.homeContent.bookingsTable.headers.bookingType",
    HOME_MENU_UPDATE: "views.homeContent.bookingsTable.menuItems.update",
    HOME_MENU_DELETE: "views.homeContent.bookingsTable.menuItems.delete",

    // Company/Stocks
    COMPANY_ACTION: "views.companyContent.stocksTable.headers.action",
    COMPANY_COMPANY: "views.companyContent.stocksTable.headers.company",
    COMPANY_ISIN: "views.companyContent.stocksTable.headers.isin",
    COMPANY_QF: "views.companyContent.stocksTable.headers.qf",
    COMPANY_GM: "views.companyContent.stocksTable.headers.gm",
    COMPANY_PORTFOLIO: "views.companyContent.stocksTable.headers.portfolio",
    COMPANY_WIN_LOSS: "views.companyContent.stocksTable.headers.winLoss",
    COMPANY_52LOW: "views.companyContent.stocksTable.headers.52low",
    COMPANY_RATE: "views.companyContent.stocksTable.headers.rate",
    COMPANY_52HIGH: "views.companyContent.stocksTable.headers.52high",
    COMPANY_MENU_UPDATE: "views.companyContent.stocksTable.menuItems.update",
    COMPANY_MENU_DELETE: "views.companyContent.stocksTable.menuItems.delete",
    COMPANY_MENU_DIVIDEND: "views.companyContent.stocksTable.menuItems.dividend",
    COMPANY_MENU_LINK: "views.companyContent.stocksTable.menuItems.link",

    // Materials
    ag: "views.optionsIndex.materials.ag",
    al: "views.optionsIndex.materials.al",
    au: "views.optionsIndex.materials.au",
    brent: "views.optionsIndex.materials.brent",
    cu: "views.optionsIndex.materials.cu",
    ni: "views.optionsIndex.materials.ni",
    pb: "views.optionsIndex.materials.pb",
    pd: "views.optionsIndex.materials.pd",
    pt: "views.optionsIndex.materials.pt",
    sn: "views.optionsIndex.materials.sn",
    wti: "views.optionsIndex.materials.wti"
} as const;

export type TranslationKeyType = typeof TRANSLATION_KEYS[keyof typeof TRANSLATION_KEYS];

