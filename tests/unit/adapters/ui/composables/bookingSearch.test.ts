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
        customKeyFilter: createBookingSearchFilter(getNameById),
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
            customKeyFilter: createBookingSearchFilter(getNameById),
            filterMode: "union"
        }) as unknown[];
        expect(matches).toEqual([]);
    });
});
