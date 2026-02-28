/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    HeaderItem,
    MaterialItemKeyType,
    MenuItemData,
    OptionTab,
    PrivacyParagraph
} from "@/types";

const TRANSLATION_KEYS = {
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

    // Privacy
    PRIVACY_LOCAL_SUBTITLE: "views.sheetContent.privacyContent.general.paragraphs.local.subTitle",
    PRIVACY_LOCAL_CONTENT: "views.sheetContent.privacyContent.general.paragraphs.local.content",
    PRIVACY_LOCAL_ICON: "views.sheetContent.privacyContent.general.paragraphs.local.icon",
    PRIVACY_PUBLIC_SUBTITLE: "views.sheetContent.privacyContent.general.paragraphs.public.subTitle",
    PRIVACY_PUBLIC_CONTENT: "views.sheetContent.privacyContent.general.paragraphs.public.content",
    PRIVACY_PUBLIC_ICON: "views.sheetContent.privacyContent.general.paragraphs.public.icon",
    PRIVACY_CONNECTION_SUBTITLE: "views.sheetContent.privacyContent.general.paragraphs.connection.subTitle",
    PRIVACY_CONNECTION_CONTENT: "views.sheetContent.privacyContent.general.paragraphs.connection.content",
    PRIVACY_CONNECTION_ICON: "views.sheetContent.privacyContent.general.paragraphs.connection.icon",

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
    //
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

type TranslationKeyType = typeof TRANSLATION_KEYS[keyof typeof TRANSLATION_KEYS];

/**
 * Helper function to create a material label.
 *
 * @param t - Localization function
 * @param itemKey - Translation key for the material label
 * @returns Material label configuration
 */
export const createMaterialLabel = (
    t: (_key: string) => string,
    itemKey: MaterialItemKeyType
): string => (
    t(TRANSLATION_KEYS[itemKey])
);

/**
 * Helper function to create a header item.
 *
 * @param t - Localization function
 * @param titleKey - Translation key for the header title
 * @param key - Data key for the column
 * @param sortable - Whether the column is sortable
 * @returns Header item configuration
 */
const createHeaderItem = (
    t: (_key: string) => string,
    titleKey: TranslationKeyType,
    key: string,
    sortable = false
): HeaderItem => ({
    title: t(titleKey),
    align: "start",
    sortable,
    key
});

/**
 * Factory function to create table header configuration for the dividend data table.
 *
 * @param t - Localization function
 * @returns Array of dividend configurations
 */
export const createDividendHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_YEAR, "year"),
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_SUM, "sum")
    ] as const;

/**
 * Factory function to create table header configuration for the accounting data table.
 *
 * @param t - Localization function
 * @returns Array of accounting configurations
 */
export const createAccountingHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_NAME, "name"),
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_SUM, "sum")
    ] as const;

/**
 * Factory function to create theme configuration.
 *
 * @param t - Localization function
 * @returns Array of theme configurations
 */
export const createThemes = (
    t: (_key: string) => string
): Record<string, string> =>
    ({
        // NOTE: lowercase properties required due to the vuetify plugin object
        earth: t(TRANSLATION_KEYS.THEME_EARTH),
        ocean: t(TRANSLATION_KEYS.THEME_OCEAN),
        sky: t(TRANSLATION_KEYS.THEME_SKY),
        meadow: t(TRANSLATION_KEYS.THEME_MEADOW),
        dark: t(TRANSLATION_KEYS.THEME_DARK),
        light: t(TRANSLATION_KEYS.THEME_LIGHT)
    });

/**
 * Factory function to create header configuration for the option page register.
 *
 * @param t - Localization function
 * @returns Array of tab configurations
 */
export const createTabs = (t: (_key: string) => string): readonly OptionTab[] =>
    [
        {
            title: t(TRANSLATION_KEYS.TAB_GE),
            id: "register_ge"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_MP),
            id: "register_mp"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_IND),
            id: "register_ind"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_MAT),
            id: "register_mat"
        },
        {
            title: t(TRANSLATION_KEYS.TAB_EX),
            id: "register_ex"
        }
    ] as const;

/**
 * Factory function to create privacy page content.
 *
 * @param t - Localization function
 * @returns Array of paragraphs
 */
export const createPrivacyContent = (
    t: (_key: string) => string
): readonly PrivacyParagraph[] =>
    [
        {
            SUBTITLE: t(TRANSLATION_KEYS.PRIVACY_LOCAL_SUBTITLE),
            CONTENT: t(TRANSLATION_KEYS.PRIVACY_LOCAL_CONTENT),
            ICON: t(TRANSLATION_KEYS.PRIVACY_LOCAL_ICON)
        },
        {
            SUBTITLE: t(TRANSLATION_KEYS.PRIVACY_PUBLIC_SUBTITLE),
            CONTENT: t(TRANSLATION_KEYS.PRIVACY_PUBLIC_CONTENT),
            ICON: t(TRANSLATION_KEYS.PRIVACY_PUBLIC_ICON)
        },
        {
            SUBTITLE: t(TRANSLATION_KEYS.PRIVACY_CONNECTION_SUBTITLE),
            CONTENT: t(TRANSLATION_KEYS.PRIVACY_CONNECTION_CONTENT),
            ICON: t(TRANSLATION_KEYS.PRIVACY_CONNECTION_ICON)
        }
    ] as const;

/**
 * Factory function to create table header configuration for the bookings data table.
 *
 * @param t - Localization function
 * @returns Array of header configurations
 */
export const createHomeHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.HOME_ACTION, "mAction"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DATE, "cBookDate"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DEBIT, "cDebit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_CREDIT, "cCredit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DESCRIPTION, "cDescription"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_BOOKING_TYPE, "cBookingType")
    ] as const;

/**
 * Factory function to create context menu items configuration for booking actions.
 *
 * @param t - Localization function
 * @returns Array of menu items
 */
export const createHomeMenuItems = (
    t: (_key: string) => string
): readonly MenuItemData[] =>
    [
        {
            id: "update-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_UPDATE),
            icon: "$updateBooking",
            action: "updateBooking",
            variant: "danger"
        },
        {
            id: "delete-booking",
            title: t(TRANSLATION_KEYS.HOME_MENU_DELETE),
            icon: "$deleteBooking",
            action: "deleteBooking"
        }
    ] as const;

/**
 * Factory function to create table header configuration for the companies data table.
 *
 * @param t - Localization function
 * @returns Array of header configurations
 */
export const createCompanyHeaders = (
    t: (_key: string) => string
): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_ACTION, "mAction"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_COMPANY, "cCompany", true),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_ISIN, "cISIN"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_QF, "cQuarterDay"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_GM, "cMeetingDay"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_PORTFOLIO, "mPortfolio", true),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_WIN_LOSS, "mEuroChange"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_52LOW, "mMin"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_RATE, "mValue"),
        createHeaderItem(t, TRANSLATION_KEYS.COMPANY_52HIGH, "mMax")
    ] as const;

/**
 * Factory function to create context menu items configuration for company actions.
 *
 * @param t - Localization function
 * @returns Array of menu items
 */
export const createCompanyMenuItems = (
    t: (_key: string) => string
): readonly MenuItemData[] =>
    [
        {
            id: "update-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_UPDATE),
            icon: "$showCompany",
            action: "updateStock"
        },
        {
            id: "delete-stock",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DELETE),
            icon: "$deleteCompany",
            action: "deleteStock",
            variant: "danger"
        },
        {
            id: "show-dividend",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_DIVIDEND),
            icon: "$showDividend",
            action: "showDividend"
        },
        {
            id: "open-link",
            title: t(TRANSLATION_KEYS.COMPANY_MENU_LINK),
            icon: "$link",
            action: "openLink"
        }
    ] as const;
