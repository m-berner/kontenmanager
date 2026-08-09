/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

/**
 * Search configuration for `HomeContent`'s bookings table.
 *
 * Extracted from the SFC purely so it can be tested: a `<script setup>` block is
 * not importable, and this config is worth pinning because its correctness
 * depends on Vuetify's filter internals rather than on anything visible locally.
 * See `tests/unit/adapters/ui/composables/bookingSearch.test.ts`, which drives
 * the real `filterItems` with exactly these values.
 *
 * Not a `use*` composable — it holds no reactive state and calls no Vue API. It
 * lives here rather than in `views/` because that folder is for `.vue` screens;
 * this is the plain-module neighbour its single consumer imports.
 */

/**
 * The booking fields the search box may match.
 *
 * Without an explicit list, Vuetify's `useFilter` falls back to
 * `Object.keys(item)` and filters across **every property of the raw booking**,
 * so typing `5` matched any booking whose `cID`, `cStockID`,
 * `cAccountNumberID`, `cSoliDebit`, `cTransactionTaxCredit`, … contained a 5 —
 * fields not rendered anywhere in the table.
 *
 * `cBookDate` is the raw ISO string rather than the short date shown, so a year
 * ("2024") matches while a formatted day does not. That is the useful half and
 * needs no per-locale parsing.
 *
 * Not `as const`: Vuetify's `filterKeys` prop is typed `string[]`, and a
 * readonly tuple is not assignable to it.
 */
export const BOOKING_SEARCH_KEYS: string[] = [
    "cBookDate",
    "cDebit",
    "cCredit",
    "cDescription",
    "cBookingTypeID"
];

/**
 * Builds the `custom-key-filter` entry that makes the booking-type column
 * searchable by the name it displays.
 *
 * The row carries only the numeric `cBookingTypeID`; the last column renders
 * `records.bookingTypes.getNameById(...)`, resolved at render time. So searching
 * for "Dividende" matched nothing even though the word was on screen.
 *
 * Vuetify passes `customKeyFilter` entries `(value, query, item)` — the whole
 * item as the third argument — which is what lets the name be resolved here
 * instead of denormalizing it onto every row.
 *
 * **`filterMode="union"` must be set on the table for this to behave.** Vuetify
 * defaults to `"intersection"`, which requires *every* registered custom filter
 * to match before a row is kept — so a search matching only the description
 * would be discarded because this filter did not also match.
 *
 * @param getNameById - Resolves a booking type's display name; returns `""` for
 *   an unknown id, and `"".indexOf(nonEmpty)` is `-1`, so a booking pointing at
 *   a deleted type simply does not match.
 * @returns A `custom-key-filter` object, keyed by the property it filters.
 */
export function createBookingSearchFilter(
    getNameById: (_id: number) => string
): Record<string, (_value: unknown, _query: string, _item: unknown) => number> {
    return {
        cBookingTypeID: (_value, query, item) => {
            // Matches Vuetify's own defaultFilter contract: an index, or -1.
            // Returning the index (rather than a boolean) is what lets the match
            // drive highlighting the same way the other columns do.
            if (query == null || query.length === 0) return 0;

            const typeId = (item as { cBookingTypeID?: number } | undefined)?.cBookingTypeID;
            if (typeId === undefined) return -1;

            return getNameById(typeId)
                .toLocaleLowerCase()
                .indexOf(query.toLocaleLowerCase());
        }
    };
}
