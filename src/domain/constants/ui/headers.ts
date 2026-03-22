/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {TRANSLATION_KEYS, type TranslationKeyType} from "@/domain/constants/ui/translationKeys";
import type {HeaderItem} from "@/domain/types";

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

export const createDividendHeaders = (t: (_key: string) => string): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_YEAR, "year"),
        createHeaderItem(t, TRANSLATION_KEYS.DIVIDEND_SUM, "sum")
    ] as const;

export const createAccountingHeaders = (t: (_key: string) => string): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_NAME, "name"),
        createHeaderItem(t, TRANSLATION_KEYS.ACCOUNTING_SUM, "sum")
    ] as const;

export const createHomeHeaders = (t: (_key: string) => string): readonly HeaderItem[] =>
    [
        createHeaderItem(t, TRANSLATION_KEYS.HOME_ACTION, "mAction"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DATE, "cBookDate"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DEBIT, "cDebit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_CREDIT, "cCredit"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_DESCRIPTION, "cDescription"),
        createHeaderItem(t, TRANSLATION_KEYS.HOME_BOOKING_TYPE, "cBookingType")
    ] as const;

export const createCompanyHeaders = (t: (_key: string) => string): readonly HeaderItem[] =>
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

