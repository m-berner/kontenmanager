/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
// Vuetify's real filter engine, not a reimplementation: this config's
// correctness depends entirely on how `filterItems` treats `filterKeys`,
// `customKeyFilter` and `filterMode`, so asserting against anything else would
// only be testing our own understanding.
import {filterItems} from "vuetify/lib/composables/filter.mjs";

import {BOOKING_SEARCH_KEYS, createBookingSearchFilter} from "@/adapters/ui/composables/bookingSearch";

const TYPE_NAMES: Record<number, string> = {1: "Dividende", 2: "Miete"};
const getNameById = (id: number): string => TYPE_NAMES[id] ?? "";

// A de-DE-shaped stand-in for `n(value, "currency")`: comma decimal, "€"
// suffix. Real enough to exercise the fix (matching the rendered text, not
// the raw dot-decimal number) without depending on vue-i18n in this test.
const formatCurrency = (value: number): string => `${value.toFixed(2).replace(".", ",")} €`;

// A de-DE-shaped stand-in for `d(utcDate(value), "short")`: DD.MM.YY (a
// 2-digit year, like the real short format) for a valid ISO date, "" for an
// invalid one — mirroring HomeContent.vue's own blank cell for a malformed
// cBookDate.
const formatDate = (isoDate: string): string => {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!parts) return "";
    const [, year, month, day] = parts;
    return `${day}.${month}.${year.slice(2)}`;
};

const ITEMS = [
    {
        cID: 5, cBookDate: "2024-01-15", cDebit: 0, cCredit: 100,
        cDescription: "Aktie A", cBookingTypeID: 1,
        // Hidden fields, none rendered in the table.
        cStockID: 55, cAccountNumberID: 1, cSoli: 5, cTransactionTax: 0
    },
    {
        cID: 2, cBookDate: "2023-06-01", cDebit: 800, cCredit: 0,
        cDescription: "Wohnung", cBookingTypeID: 2,
        cStockID: 0, cAccountNumberID: 1, cSoli: 0, cTransactionTax: 0
    }
];

/**
 * Runs a search exactly as HomeContent's v-data-table is configured to.
 *
 * `as never` on the items: `filterItems` is typed for Vuetify's `InternalItem`
 * wrapper, but at runtime it accepts plain rows — `wrapInArray` yields
 * `transformed = item` — which is the shape a table over raw objects passes.
 */
function search(query: string): number[] {
    const matches = filterItems(ITEMS as never, query, {
        filterKeys: BOOKING_SEARCH_KEYS,
        customKeyFilter: createBookingSearchFilter(getNameById, formatCurrency, formatDate),
        filterMode: "union"
    }) as Array<{ index: number }>;
    return matches.map((m) => ITEMS[m.index].cID);
}

describe("HomeContent bookings search", () => {
    it("matches the booking-type name the table actually displays", () => {
        // Previously impossible: the row carries only the numeric
        // cBookingTypeID, while the column renders a name resolved at render
        // time — so searching for a word visibly on screen matched nothing.
        expect(search("Dividende")).toEqual([5]);
        expect(search("Miete")).toEqual([2]);
    });

    it("is case-insensitive on the type name", () => {
        expect(search("dividende")).toEqual([5]);
    });

    it("does not let the type filter veto a description-only match", () => {
        // This is what filterMode="union" buys. Vuetify's default,
        // "intersection", requires EVERY custom-key filter to match, so this row
        // would be discarded because the type-name filter did not also match.
        expect(search("Wohnung")).toEqual([2]);
    });

    it("does not match hidden numeric fields", () => {
        // cStockID 55 is on row 1 and is rendered nowhere. Without an explicit
        // filterKeys list Vuetify filters across Object.keys(item), so this
        // matched.
        expect(search("55")).toEqual([]);
    });

    it("still matches the visible columns it should", () => {
        expect(search("2023")).toEqual([2]);      // cBookDate (raw ISO)
        expect(search("800")).toEqual([2]);       // cDebit
        expect(search("Aktie")).toEqual([5]);     // cDescription
    });

    it("returns nothing for a non-match", () => {
        expect(search("zzz")).toEqual([]);
    });

    it("does not match a booking whose type no longer exists", () => {
        const orphan = [{...ITEMS[0], cBookingTypeID: 999}];
        const matches = filterItems(orphan as never, "Dividende", {
            filterKeys: BOOKING_SEARCH_KEYS,
            customKeyFilter: createBookingSearchFilter(getNameById, formatCurrency, formatDate),
            filterMode: "union"
        }) as unknown[];
        expect(matches).toEqual([]);
    });

    describe("amount columns", () => {
        // Regression: cDebit/cCredit used to go through Vuetify's default
        // String(value) filter, which matches the raw dot-decimal number —
        // not what the cell actually renders (`n(value, "currency")`,
        // locale-formatted). A de-DE user sees "12,50 €" but typing "12,50"
        // found nothing, while "12.5" (never shown anywhere) matched.
        const CURRENCY_ITEMS = [
            {
                cID: 9, cBookDate: "2022-03-03", cDebit: 12.5, cCredit: 0,
                cDescription: "Rechnung", cBookingTypeID: 1,
                cStockID: 0, cAccountNumberID: 1, cSoli: 0, cTransactionTax: 0
            }
        ];

        function searchCurrency(query: string): number[] {
            const matches = filterItems(CURRENCY_ITEMS as never, query, {
                filterKeys: BOOKING_SEARCH_KEYS,
                customKeyFilter: createBookingSearchFilter(getNameById, formatCurrency, formatDate),
                filterMode: "union"
            }) as Array<{ index: number }>;
            return matches.map((m) => CURRENCY_ITEMS[m.index].cID);
        }

        it("matches the locale-formatted amount the table displays", () => {
            expect(searchCurrency("12,50")).toEqual([9]);
        });

        it("no longer matches only via the raw dot-decimal representation", () => {
            // "12.5" is never shown anywhere once a currency formatter is
            // supplied — the custom filter fully replaces the default
            // String(value) match for this key rather than supplementing it.
            expect(searchCurrency("12.5")).toEqual([]);
        });
    });

    describe("date column", () => {
        // Regression: the Datum cell renders a locale-formatted short date
        // (d(utcDate(value), "short")), not the raw ISO string — so typing
        // the date visibly on screen (e.g. "15.01.24") found nothing.
        it("matches the locale-formatted date the table displays", () => {
            expect(search("15.01.24")).toEqual([5]);
            expect(search("01.06.23")).toEqual([2]);
        });

        it("is case-insensitive and substring-based on the formatted date", () => {
            expect(search("01.24")).toEqual([5]);
        });

        it("still matches a bare year via the raw ISO string, which the formatted short date does not contain", () => {
            // formatDate's 2-digit year ("24") never contains a 4-digit
            // year substring, so this only passes via the raw-ISO fallback.
            expect(search("2023")).toEqual([2]);
        });

        it("does not crash and matches nothing via the date field for an invalid/blank cBookDate", () => {
            const malformed = [{...ITEMS[0], cBookDate: ""}];
            const matches = filterItems(malformed as never, "15.01.24", {
                filterKeys: BOOKING_SEARCH_KEYS,
                customKeyFilter: createBookingSearchFilter(getNameById, formatCurrency, formatDate),
                filterMode: "union"
            }) as unknown[];
            expect(matches).toEqual([]);
        });
    });

    describe("VDataTable's real internal item shape", () => {
        // CRITICAL regression coverage. Every test above feeds `filterItems`
        // plain row objects — which is NOT what `VDataTable` actually passes
        // to a `customKeyFilter`. Internally it wraps every row as
        // `{type: "item", key, index, value, columns, raw}` and hands THAT
        // object to a custom filter (its own default filter is spared this:
        // it's fed an already-extracted field value via
        // `getPropertyFromItem`, only a *custom* filter receives the whole
        // wrapped item and must unwrap it itself). Reading a field directly
        // off `item` — the shape every test above uses, and the shape this
        // file's code used from the very first commit until this bug was
        // found live in the browser — is `undefined` on the real wrapper, so
        // every custom-filtered column silently matched nothing IN
        // PRODUCTION despite passing every test above. Confirmed live via a
        // built extension + Playwright: unwrapping `.raw` (mirroring
        // `CompanyContent.vue`'s `toStockIds`, the identical class of
        // Vuetify-wrapping mismatch) is what actually fixed it.
        //
        // If a future change reverts to reading `item.cWhatever` directly,
        // this is the test that will catch it — the ones above will not.
        function wrapAsVuetifyItem(raw: (typeof ITEMS)[number], index: number) {
            return {
                type: "item" as const,
                key: raw.cID,
                index,
                value: raw.cID,
                selectable: true,
                columns: raw,
                raw
            };
        }

        function searchWrapped(query: string): number[] {
            // `filterItems` receives `[wrappedItem, rawRow]` tuples, not bare
            // wrapped items: Vuetify's `useFilter` (filter.js) builds
            // `transformedItems` as `items.map(item => [item, transform(item)])`
            // when a `transform` option is given, and VDataTable supplies one
            // (transforming its internal item to `.raw`) precisely so its
            // OWN default-field lookups (via `getObjectValueByPath`) resolve
            // against the raw row while a *custom* filter — which always
            // receives `item`, the first tuple element, never `transformed`
            // — still gets the full wrapped item and must unwrap `.raw`
            // itself. `wrapInArray` passes a real array straight through, so
            // this tuple is exactly what ends up destructured as
            // `[item, transformed]` inside `filterItems`.
            const wrapped = ITEMS.map((raw, index) => [wrapAsVuetifyItem(raw, index), raw]);
            const matches = filterItems(wrapped as never, query, {
                filterKeys: BOOKING_SEARCH_KEYS,
                customKeyFilter: createBookingSearchFilter(getNameById, formatCurrency, formatDate),
                filterMode: "union"
            }) as Array<{ index: number }>;
            return matches.map((m) => ITEMS[m.index].cID);
        }

        it("matches the booking-type name through the wrapped item", () => {
            expect(searchWrapped("Dividende")).toEqual([5]);
            expect(searchWrapped("Miete")).toEqual([2]);
        });

        it("matches the locale-formatted amount through the wrapped item", () => {
            expect(searchWrapped("100,00")).toEqual([5]);
            expect(searchWrapped("800,00")).toEqual([2]);
        });

        it("matches the locale-formatted date through the wrapped item", () => {
            expect(searchWrapped("15.01.24")).toEqual([5]);
        });

        it("still matches a description-only query through the wrapped item", () => {
            expect(searchWrapped("Wohnung")).toEqual([2]);
        });

        it("returns nothing for a non-match through the wrapped item", () => {
            expect(searchWrapped("zzz")).toEqual([]);
        });
    });
});
