/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AccountStoreItem, BookingTypeDb} from "@/domain/types";
import {normalizeBookingTypeName} from "@/domain/validation/validators";

/**
 * Returns true if any existing account already uses the given IBAN.
 *
 * @param items - Current list of accounts to check against.
 * @param iban - The IBAN to test for duplicates.
 */
export function isDuplicateAccountIban(items: AccountStoreItem[], iban: string): boolean {
    return items.some((entry) => entry.cIban === iban);
}

/**
 * Returns true if any existing booking type has the same normalized name.
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
    const normalizedInput = normalizeBookingTypeName(name);
    return items.some((entry) => {
        const isSameName = normalizeBookingTypeName(entry.cName) === normalizedInput;
        const isNotExcluded = excludeId === undefined || entry.cID !== excludeId;
        return isSameName && isNotExcluded;
    });
}
