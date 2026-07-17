/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {makeBookingDb, makeBookingTypeDb} from "@test/usecases";
import {useAccountingStore} from "@/adapters/ui/stores/accounting";
import {useBookingsStore} from "@/adapters/ui/stores/bookings";
import {useBookingTypesStore} from "@/adapters/ui/stores/bookingTypes";

describe("Accounting Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
    });

    it("aggregates booking sums per type across all bookings", () => {
        const bookings = useBookingsStore();
        const bookingTypes = useBookingTypesStore();
        bookingTypes.add(makeBookingTypeDb({cID: 1, cName: "Buy"}));
        bookings.add(makeBookingDb({cID: 1, cBookingTypeID: 1, cCredit: 100, cDebit: 0, cBookDate: "2026-01-01"}));
        bookings.add(makeBookingDb({cID: 2, cBookingTypeID: 1, cCredit: 50, cDebit: 0, cBookDate: "2025-01-01"}));

        const accounting = useAccountingStore();
        expect(accounting.sumBookingsPerType).toEqual([{key: 150, value: "Buy"}]);
    });

    it("aggregates booking sums per type filtered by year", () => {
        const bookings = useBookingsStore();
        const bookingTypes = useBookingTypesStore();
        bookingTypes.add(makeBookingTypeDb({cID: 1, cName: "Buy"}));
        bookings.add(makeBookingDb({cID: 1, cBookingTypeID: 1, cCredit: 100, cDebit: 0, cBookDate: "2026-01-01"}));
        bookings.add(makeBookingDb({cID: 2, cBookingTypeID: 1, cCredit: 50, cDebit: 0, cBookDate: "2025-01-01"}));

        const accounting = useAccountingStore();
        expect(accounting.sumBookingsPerTypeAndYear(2026)).toEqual([{key: 100, value: "Buy"}]);
    });

    it("returns a zero-sum entry for a type with no matching bookings", () => {
        const bookingTypes = useBookingTypesStore();
        bookingTypes.add(makeBookingTypeDb({cID: 1, cName: "Sell"}));

        const accounting = useAccountingStore();
        expect(accounting.sumBookingsPerType).toEqual([{key: 0, value: "Sell"}]);
    });
});