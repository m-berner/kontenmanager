/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BookingTypeRoleType} from "@/domain/constants";

/**
 * Domain-level persisted account record (IndexedDB).
 *
 * `cIban` is **optional on purpose**, and that optionality is a load-bearing
 * part of the persistence design rather than laxness: IndexedDB indexes an
 * explicit `""` as a real, colliding value while an absent key is excluded from
 * the index entirely, so `accounts_uk1` (`unique: true` on `cIban`, and global
 * rather than account-scoped) would reject the second IBAN-less account if the
 * blank were stored. `accountRepository.save()` and
 * `importHelpers.stripBlankAccountIban` therefore `delete` it.
 *
 * Declaring it required meant both of those needed an `as unknown as AccountDb`
 * double cast to say what they do, and — worse — every raw repository row was
 * typed as though the field were always present, so `row.cIban.trim()`
 * type-checked and would have thrown for exactly the records those sites
 * create. See {@link AccountStoreItem}, which re-requires it: the *store* shape
 * genuinely always has it, because `initializeRecords` normalizes an absent
 * `cIban` to `""` on the way in.
 */
export interface AccountDb {
    cID: number;
    cSwift: string;
    cIban?: string;
    cLogoUrl: string;
    cWithDepot: boolean;
}

/**
 * An {@link AccountDb} whose optional identifier is known to be present.
 *
 * This is what `validateAccount()` returns — it normalizes `cIban` with
 * `normalizeString`, so the result always carries a string — and therefore what
 * every in-memory record is. The two types differ at exactly one boundary: rows
 * read back from IndexedDB are `AccountDb` (the blank may have been omitted on
 * write), everything downstream of a validator is `AccountRecord`.
 */
export type AccountRecord = AccountDb & { cIban: string };

/**
 * A {@link StockDb} whose optional identifiers are known to be present.
 * Counterpart to {@link AccountRecord}; `validateStock()` returns this shape.
 */
export type StockRecord = StockDb & { cISIN: string; cSymbol: string };

/**
 * Domain-level persisted booking record (IndexedDB).
 */
export interface BookingDb {
    cID: number;
    cBookDate: string;
    cExDate: string;
    cDebit: number;
    cCredit: number;
    cDescription: string;
    cCount: number;
    cBookingTypeID: number;
    cAccountNumberID: number;
    cStockID: number;
    cSoliCredit: number;
    cSoliDebit: number;
    cTaxCredit: number;
    cTaxDebit: number;
    cFeeCredit: number;
    cFeeDebit: number;
    cSourceTaxCredit: number;
    cSourceTaxDebit: number;
    cTransactionTaxCredit: number;
    cTransactionTaxDebit: number;
    cMarketPlace: string;
}

/**
 * Domain-level persisted booking type record (IndexedDB).
 */
export interface BookingTypeDb {
    cID: number;
    cName: string;
    cAccountNumberID: number;
    cRole: BookingTypeRoleType;
}

/**
 * Domain-level persisted stock record (IndexedDB).
 *
 * `cISIN` and `cSymbol` are optional for the same reason `AccountDb.cIban` is —
 * `stockRepository.save()` and `importHelpers.stripBlankStockIdentifiers`
 * `delete` a blank identifier so it is absent from `stocks_uk3`/`uk4` rather
 * than indexed as a colliding `""`. See {@link StockItem}, which re-requires
 * both: `initializeRecords` normalizes them to `""` on the read path, so the
 * store shape really does always carry them.
 */
export interface StockDb {
    cID: number;
    cCompany: string;
    cISIN?: string;
    cSymbol?: string;
    cFirstPage: number;
    cFadeOut: number;
    cMeetingDay: string;
    cQuarterDay: string;
    cURL: string;
    cAccountNumberID: number;
    cAskDates: string;
}

