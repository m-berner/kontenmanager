/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {INDEXED_DB} from "@/domain/constants";
import {applyBookingRoleInvariants} from "@/domain/logic";
import type {
    AccountDb,
    BackupData,
    BatchOperationDescriptor,
    BookingDb,
    BookingTypeDb,
    ModernBackupData,
    RecordOperation,
    StockDb
} from "@/domain/types";
import {isoDate, isValidISODate} from "@/domain/utils/utils";
import {validateAccount, validateBooking, validateBookingType, validateStock} from "@/domain/validation/validators";

export type ImportCounts = {
    accounts: number;
    stocks: number;
    bookings: number;
    bookingTypes: number;
    /**
     * How many of `bookings` carry no usable `cBookDate`.
     *
     * Counted so the import can stop and ask, because nothing else will: such
     * bookings import successfully and are counted by the all-time totals, but
     * belong to no calendar year, so they make those totals disagree with the
     * per-year rows meant to reconcile with them. Confirmed rather than
     * rejected outright — `normalizeDate` deliberately refuses to invent a
     * date, and dropping the rows would lose real amounts from a backup the
     * user chose to restore.
     */
    undatedBookings: number;
};

export function buildModernImportPlan(input: {
    backup: ModernBackupData;
    activeId: number;
}): {
    descriptors: BatchOperationDescriptor[];
    initData: {
        accountsDB: ModernBackupData["accounts"];
        bookingsDB: BookingDb[];
        bookingTypesDB: BookingTypeDb[];
        stocksDB: StockDb[];
    };
} {
    const safeBackup = normalizeModernBackup(input.backup);

    const descriptors: BatchOperationDescriptor[] = [
        {
            storeName: INDEXED_DB.STORE.ACCOUNTS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.accounts)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKING_TYPES.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.bookingTypes)]
        },
        {
            storeName: INDEXED_DB.STORE.STOCKS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.stocks)]
        },
        {
            storeName: INDEXED_DB.STORE.BOOKINGS.NAME,
            operations: [{type: "clear"}, ...toImportRecords(safeBackup.bookings)]
        }
    ];

    return {
        descriptors,
        initData: {
            accountsDB: safeBackup.accounts,
            bookingsDB: (safeBackup.bookings || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            ),
            bookingTypesDB: (safeBackup.bookingTypes || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            ),
            stocksDB: (safeBackup.stocks || []).filter(
                (rec) => rec.cAccountNumberID === input.activeId
            )
        }
    };
}

/**
 * Mirrors `normalizeDate`'s (validators.ts) acceptance rule for `cBookDate`
 * without duplicating it: a valid ISO string survives as-is, and a finite
 * number is accepted as a UNIX timestamp because `normalizeDate` converts it
 * via `isoDate` rather than discarding it. Anything else — missing, blank, a
 * malformed string like "15.03.2024", or a number `isoDate` itself rejects
 * (out of `Date`'s representable range) — is what actually ends up as `""`
 * after normalization, i.e. genuinely undated.
 */
function willHaveDate(value: unknown): boolean {
    if (typeof value === "string") {
        return isValidISODate(value);
    }
    if (typeof value === "number") {
        try {
            isoDate(value);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Counts what an import is about to write.
 *
 * Every collection is guarded with `Array.isArray`, matching
 * `normalizeModernBackup`'s `(safeBackup.x || [])` in this same file. The
 * declared type says the guards are unnecessary — `ModernBackupData` declares
 * all four collections non-optional — but that type is *asserted*, not checked:
 * `importExportAdapter.parseJson` returns `parsed as BackupData` after verifying
 * only `typeof parsed === "object"`, so arbitrary JSON reaches here wearing a
 * shape nothing has confirmed. Unguarded, a backup missing one array threw a raw
 * `TypeError`, which is not an `AppError` and surfaced as an unhandled crash
 * rather than the intended "invalid backup" message.
 *
 * Ordering was the only protection: `import.ts` runs `validateDataIntegrity`
 * first and returns on its errors. That is a real guarantee today and a fragile
 * one to depend on from a separate function.
 *
 * @param backup - The raw, not-yet-normalized backup.
 * @returns The per-collection counts, plus how many bookings will end up undated.
 */
export function getImportCounts(backup: BackupData): ImportCounts {
    const accounts = Array.isArray(backup.accounts) ? backup.accounts : [];
    const stocks = Array.isArray(backup.stocks) ? backup.stocks : [];
    const bookings = Array.isArray(backup.bookings) ? backup.bookings : [];
    const bookingTypes = Array.isArray(backup.bookingTypes) ? backup.bookingTypes : [];

    return {
        accounts: accounts.length,
        stocks: stocks.length,
        bookings: bookings.length,
        bookingTypes: bookingTypes.length,
        // Counted on the RAW backup, before `normalizeModernBackup` runs, via
        // `willHaveDate` rather than a blank test: `normalizeDate` maps a
        // missing value and a malformed string (e.g. "15.03.2024") to "", but
        // accepts a finite number as a UNIX timestamp — so counting only
        // blanks before it would miss every malformed row about to become one,
        // while a naive ISO-string-only test would wrongly flag every numeric
        // timestamp as undated even though it will be dated correctly.
        undatedBookings: bookings
            .filter((entry) => !willHaveDate(entry.cBookDate))
            .length
    };
}

export function normalizeModernBackup(backup: ModernBackupData): ModernBackupData {
    const safeBackup = structuredClone(backup);
    safeBackup.accounts = (safeBackup.accounts || [])
        .map((a) => validateAccount(a))
        .map((a) => stripBlankAccountIban(a));
    safeBackup.bookingTypes = (safeBackup.bookingTypes || []).map((bt) => validateBookingType(bt));
    safeBackup.stocks = (safeBackup.stocks || [])
        .map((s) => validateStock(s))
        .map((s) => stripBlankStockIdentifiers(s));
    safeBackup.bookings = (safeBackup.bookings || [])
        .map((b) => validateBooking(b))
        .map((b) => applyBookingRoleInvariants(b, safeBackup.bookingTypes));
    return safeBackup;
}

/**
 * Omits a blank `cISIN`/`cSymbol` entirely rather than leaving it as `""`,
 * mirroring `stockRepository.save()`'s live-entry behavior. The stocks
 * store's `uk3`/`uk4` unique composite indexes are keyed on
 * `[cAccountNumberID, cISIN]` and `[cAccountNumberID, cSymbol]` — IndexedDB
 * still indexes an explicit empty string as a real, colliding value (unlike
 * an absent key, which is simply excluded from the index). So without this,
 * a backup with two same-account stocks that both lack an ISIN/Symbol (a
 * hand-edited backup, or a legacy import whose source data allowed blank
 * identifiers) would violate the unique constraint on the second `add()`. It would
 * abort the entire atomic import transaction with an opaque low-level error,
 * for backup data that's otherwise perfectly valid. `validateStock()` always
 * normalizes these fields to a string (never leaves them `undefined`) - so
 * this must run as a distinct step after it, not be folded into it.
 */
function stripBlankStockIdentifiers(stock: StockDb): StockDb {
    const normalized: StockDb = {...stock};
    if (normalized.cISIN?.trim() === "") {
        delete normalized.cISIN;
    }
    if (normalized.cSymbol?.trim() === "") {
        delete normalized.cSymbol;
    }
    return normalized;
}

/**
 * Omits a blank `cIban` entirely rather than leaving it as `""`, same
 * mechanism and reason as {@link stripBlankStockIdentifiers}: the accounts
 * store's `uk1` index is `unique: true` on `cIban` alone (a global
 * constraint, not per-account), so a backup with two accounts that both
 * lack an IBAN (a hand-edited backup, or a legacy import whose source data
 * allowed blank IBANs) would otherwise collide on the second `add()` and
 * abort the entire atomic import transaction. `accountRepository.save()` now
 * applies the same strip on the live-entry path, so the two agree; this one is
 * still needed because the import writes through `batchOperations` rather than
 * the repository.
 */
function stripBlankAccountIban(account: AccountDb): AccountDb {
    const normalized: AccountDb = {...account};
    if (normalized.cIban?.trim() === "") {
        delete normalized.cIban;
    }
    return normalized;
}

export function toImportRecords<T>(data: T[]): RecordOperation[] {
    return data.map((rec) => ({type: "add" as const, data: rec}));
}