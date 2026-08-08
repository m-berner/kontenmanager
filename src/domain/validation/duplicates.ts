/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountStoreItem, BookingTypeDb, StockItem} from "@/domain/types";
import {normalizeBookingTypeName} from "@/domain/validation/validators";

/**
 * Returns true if any existing account already uses the given IBAN.
 * Optionally excludes one entry by ID, used when validating an update — without
 * it, re-validating an unchanged account reports its own IBAN as a duplicate
 * and refuses to save. Matches `isDuplicateStockIsin`/`isDuplicateBookingTypeName`
 * below, which have always taken this parameter; accounts were the odd one out.
 *
 * A blank IBAN is never a duplicate, for exactly the reason
 * {@link isDuplicateStockSymbol} documents: `stripBlankAccountIban`
 * (`importHelpers.ts`) and `accountRepository.save()` omit a blank `cIban`
 * rather than storing `""`, so IndexedDB never indexes it and two IBAN-less
 * accounts cannot collide on `accounts_uk1`. Without this guard, a store
 * holding two such accounts — `initializeRecords` normalizes an absent `cIban`
 * back to `""` on the read path — reported them as duplicates of each other for
 * a database state that is perfectly legal.
 *
 * @param items - Current list of accounts to check against.
 * @param iban - The IBAN to test for duplicates.
 * @param excludeId - ID of the entry being edited, excluded from the comparison.
 */
export function isDuplicateAccountIban(
    items: AccountStoreItem[],
    iban: string,
    excludeId?: number
): boolean {
    const normalizedInput = iban.trim();
    if (normalizedInput === "") return false;

    return items.some((entry) => {
        const isSameIban = (entry.cIban ?? "").trim() === normalizedInput;
        const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
        return isSameIban && isNotExcluded;
    });
}

/**
 * Returns true if any existing stock already uses the given ISIN.
 * Optionally excludes one entry by ID, used when validating an update.
 *
 * Carries the same blank guard as its two siblings: `stockRepository.save()`
 * and `stripBlankStockIdentifiers` delete a blank `cISIN` instead of storing
 * `""`, so blanks are absent from `stocks_uk3` and cannot collide.
 *
 * @param items - Current list of stocks to check against.
 * @param isin - The ISIN to test for duplicates.
 * @param excludeId - ID of the entry being edited, excluded from the comparison.
 */
export function isDuplicateStockIsin(items: StockItem[], isin: string, excludeId?: number): boolean {
    const normalizedInput = isin.trim().toUpperCase();
    if (normalizedInput === "") return false;

    return items.some((entry) => {
        const isSameIsin = (entry.cISIN ?? "").trim().toUpperCase() === normalizedInput;
        const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
        return isSameIsin && isNotExcluded;
    });
}

/**
 * Returns true if any existing stock already uses the given trading symbol.
 *
 * Exists for the same reason as {@link isDuplicateStockIsin}: the stocks store's
 * `uk4` index is `unique: true` on `[cAccountNumberID, cSymbol]` (migrator.ts),
 * exactly like `uk3` is on `[cAccountNumberID, cISIN]` — but only the ISIN half
 * had a UI-level guard. A second stock with the same symbol therefore reached
 * `store.add()` and failed with a raw IndexedDB `ConstraintError`, which the
 * dialog could only surface as a generic database error naming no field.
 *
 * The comparison is case-insensitive because `mapStockFormToDb` uppercases the
 * symbol before persisting, so "abc" and "ABC" collide in the index while
 * looking distinct in the form. A blank symbol is never a duplicate:
 * `stockRepository.save()` omits blank identifiers entirely rather than
 * indexing them (see its own comment), so blanks cannot collide.
 *
 * @param items - Current list of stocks to check against.
 * @param symbol - The symbol to test for duplicates.
 * @param excludeId - ID of the entry being edited, excluded from the comparison.
 */
export function isDuplicateStockSymbol(
    items: StockItem[],
    symbol: string,
    excludeId?: number
): boolean {
    const normalizedInput = symbol.trim().toUpperCase();
    if (normalizedInput === "") return false;

    return items.some((entry) => {
        const isSameSymbol =
            (entry.cSymbol ?? "").trim().toUpperCase() === normalizedInput;
        const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
        return isSameSymbol && isNotExcluded;
    });
}

/**
 * Returns true if any existing booking type has the same normalized name.
 * The comparison is case-insensitive (matching this file's own
 * `resolveLegacyBookingTypeRole()`, which already lowercases booking-type
 * names when matching them against `DEFAULT_BUY_NAMES`/etc.) — otherwise
 * "Fees" and "fees" would both pass as non-duplicates, silently splitting
 * one booking type's totals across two rows in `ShowAccounting`.
 * Optionally excludes one entry by ID, used when validating an update.
 *
 * @param items - Current list of booking types to check against.
 * @param name - The name to test for duplicates.
 * @param excludeId - ID of the entry being edited, excluded from the comparison.
 */
export function isDuplicateBookingTypeName(
    items: BookingTypeDb[],
    name: string,
    excludeId?: number
): boolean {
    const normalizedInput = normalizeBookingTypeName(name).toLowerCase();
    return items.some((entry) => {
        const isSameName = normalizeBookingTypeName(entry.cName).toLowerCase() === normalizedInput;
        const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
        return isSameName && isNotExcluded;
    });
}
