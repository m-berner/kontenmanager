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
 * the real `filterItems` with exactly these values — including, critically,
 * its `"VDataTable's real internal item shape"` block. Every OTHER test in
 * that file feeds `filterItems` plain row objects, which is NOT the shape
 * `VDataTable` actually hands a `customKeyFilter` (see `createBookingSearchFilter`'s
 * doc comment) — that gap is exactly how every custom-filtered column silently
 * matched nothing, in production, from this file's very first version until
 * it was found live in a built extension and fixed. Do not trust a green run
 * of only the plain-object tests as proof this file works; the wrapped-item
 * block is the one that actually would have caught it.
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
 * `cAccountNumberID`, `cSoli`, `cTransactionTax`, … contained a 5 —
 * fields not rendered anywhere in the table.
 *
 * `cBookDate` is matched both as the raw ISO string (so a bare year like
 * "2024" still matches even though the cell shows a locale-formatted short
 * date that may not contain it verbatim — de-DE's short format uses a
 * 2-digit year) and, via `createBookingSearchFilter`'s `formatDate`, as the
 * formatted text the cell actually renders.
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
 * Builds the `custom-key-filter` entries for the columns whose rendered text
 * differs from the raw field Vuetify's default filter would otherwise match:
 *
 * - `cBookingTypeID`: the row carries only the numeric id; the last column
 *   renders `records.bookingTypes.getNameById(...)`, resolved at render time.
 *   So searching for "Dividende" matched nothing even though the word was on
 *   screen.
 * - `cDebit`/`cCredit`: the cells render `n(value, "currency")` (locale
 *   grouping/decimal separators and the currency symbol), while the default
 *   filter matches `String(value)` — the raw dot-decimal number. A de-DE user
 *   sees "12,50 €" but typing "12,50" found nothing, while "12.5" (never
 *   shown anywhere) matched.
 * - `cBookDate`: the cell renders a locale-formatted short date
 *   (`d(utcDate(value), "short")`) for a valid date and nothing for an
 *   invalid/blank one, while the default filter matches the raw ISO string
 *   verbatim — so typing the displayed date (e.g. "15.03.24") found nothing.
 *   Matched against BOTH the formatted text and the raw ISO string, not just
 *   the formatted one: a bare year ("2024") is still useful and may not
 *   appear in the formatted short date at all (de-DE's short format uses a
 *   2-digit year).
 *
 * All four keys share the exact same function, checking all four fields on
 * every call regardless of which key triggered it — not four independent
 * per-key checks. That is deliberate, not simpler-but-equivalent: Vuetify's
 * `filterMode="union"` does NOT independently OR every registered
 * `customKeyFilter` entry against the row. Its actual rule (`filter.js`):
 * keep the row if EITHER every custom filter matched, OR some *other*,
 * default-filtered key matched. With a single custom filter (the original
 * `cBookingTypeID`-only shape) those two things coincided, so it read as plain
 * OR-across-everything. Registering separate, independent filters for the
 * other keys breaks that: a type-name-only search would then have to satisfy
 * every registered filter at once to count as "all custom filters matched",
 * so a row matching only by type name would be dropped. Using one shared
 * "does anything match?" function for every custom key makes them agree
 * unanimously whenever any one of the fields actually matches, restoring the
 * OR semantics the single-filter case had by accident.
 *
 * Vuetify passes `customKeyFilter` entries `(value, query, item)` — the whole
 * item as the third argument — which is what lets every field be
 * resolved/formatted here instead of denormalizing it onto every row.
 *
 * **`filterMode="union"` must still be set on the table.** Vuetify's other
 * mode, `"intersection"`, requires every registered custom filter AND at
 * least one default-filtered key to match, which would make a
 * description-only search fail because none of these four fields matched.
 *
 * @param getNameById - Resolves a booking type's display name; returns `""` for
 *   an unknown id, and `"".indexOf(nonEmpty)` is `-1`, so a booking pointing at
 *   a deleted type simply does not match.
 * @param formatCurrency - Formats a raw amount the same way the table cell
 *   does (`n(value, "currency")`), so the search matches what's on screen.
 * @param formatDate - Formats a raw ISO `cBookDate` the same way the table
 *   cell does, returning `""` for an invalid/blank date (matching the blank
 *   cell) so the search matches what's on screen.
 * @returns A `custom-key-filter` object, keyed by the property it filters.
 */
export function createBookingSearchFilter(
    getNameById: (_id: number) => string,
    formatCurrency: (_value: number) => string,
    formatDate: (_isoDate: string) => string
): Record<string, (_value: unknown, _query: string, _item: unknown) => number> {
    const matchIndex = (text: string, query: string): number => {
        // Matches Vuetify's own defaultFilter contract: an index, or -1.
        return text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    };

    const anyFieldMatches = (query: string, item: unknown): number => {
        // VDataTable does not pass customKeyFilter the raw row: it wraps every
        // item internally as {type, key, index, value, columns, raw} and hands
        // THAT to the filter (Vuetify's own default filter is spared this,
        // since it's fed an already-extracted field value via
        // getPropertyFromItem — only a *custom* filter receives the whole
        // item and must unwrap it itself). Reading `item.cDebit` directly —
        // the shape every field in this function used to assume, including
        // the original cBookingTypeID-only filter this replaced — is always
        // `undefined` on that wrapper, so every custom-filtered column
        // (booking type name, then Soll/Haben/Datum once they were added)
        // silently never matched anything, in production, since the
        // type-name filter was first introduced. Unit tests never caught it:
        // they drive `filterItems` directly with plain, un-wrapped row
        // objects, which never exercises VDataTable's real item shape.
        // Same `.raw ?? row` fallback CompanyContent.vue's `toStockIds` uses
        // for the identical class of Vuetify-wrapping mismatch.
        const row = (item && typeof item === "object" && "raw" in item
            ? (item as { raw: unknown }).raw
            : item) as {
            cBookingTypeID?: number;
            cDebit?: number;
            cCredit?: number;
            cBookDate?: string;
        } | undefined;
        if (!row) return -1;

        if (row.cBookingTypeID !== undefined) {
            const typeMatch = matchIndex(getNameById(row.cBookingTypeID), query);
            if (typeMatch !== -1) return typeMatch;
        }
        if (row.cDebit !== undefined) {
            const debitMatch = matchIndex(formatCurrency(row.cDebit), query);
            if (debitMatch !== -1) return debitMatch;
        }
        if (row.cCredit !== undefined) {
            const creditMatch = matchIndex(formatCurrency(row.cCredit), query);
            if (creditMatch !== -1) return creditMatch;
        }
        if (row.cBookDate !== undefined) {
            const formatted = formatDate(row.cBookDate);
            if (formatted !== "") {
                const formattedMatch = matchIndex(formatted, query);
                if (formattedMatch !== -1) return formattedMatch;
            }
            // Preserve the raw-ISO substring match (e.g. a bare year) even
            // when the formatted text didn't match, or is blank because the
            // date is invalid — matchIndex("", nonEmptyQuery) is safely -1.
            const rawMatch = matchIndex(row.cBookDate, query);
            if (rawMatch !== -1) return rawMatch;
        }
        return -1;
    };

    const combined = (_value: unknown, query: string, item: unknown): number => {
        // An empty/nullish query means "no filter applied for this key" —
        // every row must still count as matching it, or registering ANY
        // custom filter would hide every row the moment the search box is
        // empty (filterItems runs the per-item loop whenever
        // customKeyFilter is non-empty, even with an empty query).
        if (query == null || query.length === 0) return 0;
        return anyFieldMatches(query, item);
    };

    return {
        cBookingTypeID: combined,
        cDebit: combined,
        cCredit: combined,
        cBookDate: combined
    };
}
