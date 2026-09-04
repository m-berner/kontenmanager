/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {setActiveTestPinia} from "@test/pinia";
import {useBookingsStore} from "@/adapters/ui/stores/bookings";
import type {BookingDb} from "@/domain/types";

describe("Bookings Store", () => {
    beforeEach(() => {
        setActiveTestPinia();
    });

    const sampleBooking: BookingDb = {
        cID: 1,
        cStockID: 1,
        cCount: 10,
        cBookingTypeID: 1, // Buy
        cCredit: 0,
        cDebit: 1000,
        cBookDate: "2024-01-01",
        cExDate: "",
        cDescription: "Test purchase",
        cMarketPlace: "XETRA",
        cAccountNumberID: 1,
        cTax: 0,
        cSourceTax: 0,
        cTransactionTax: 0,
        cSoli: 0,
        cFee: 5
    };

    it("should add a booking", () => {
        const bookingsStore = useBookingsStore();
        bookingsStore.add(sampleBooking);
        expect(bookingsStore.items).toHaveLength(1);
        expect(bookingsStore.items[0].cDescription).toBe("Test purchase");
    });

    it("should update a booking", () => {
        const bookingsStore = useBookingsStore();
        bookingsStore.add(sampleBooking);

        const updatedBooking = {
            ...sampleBooking,
            cDescription: "Updated description"
        };
        bookingsStore.update(updatedBooking);

        expect(bookingsStore.items[0].cDescription).toBe("Updated description");
    });

    it("should remove a booking", () => {
        const bookingsStore = useBookingsStore();
        bookingsStore.add(sampleBooking);
        expect(bookingsStore.items).toHaveLength(1);

        bookingsStore.remove(sampleBooking.cID);
        expect(bookingsStore.items).toHaveLength(0);
    });

    it("should clean all bookings", () => {
        const bookingsStore = useBookingsStore();
        bookingsStore.add(sampleBooking);
        expect(bookingsStore.items).toHaveLength(1);

        bookingsStore.clean();
        expect(bookingsStore.items).toHaveLength(0);
    });

    it("hasBookingType returns true when any booking references the type", () => {
        const bookingsStore = useBookingsStore();
        bookingsStore.add(sampleBooking);

        expect(bookingsStore.hasBookingType(1)).toBe(true);
        expect(bookingsStore.hasBookingType(999)).toBe(false);
    });

    it("portfolioByStockId/investByStockId classify by cRole, not a fixed literal id", () => {
        const bookingsStore = useBookingsStore();
        // sampleBooking.cBookingTypeID is 1, deliberately NOT the account's own Buy id here,
        // to prove classification follows the passed-in bookingTypes list, not a global literal.
        bookingsStore.add({...sampleBooking, cBookingTypeID: 42});
        const bookingTypes = [{cID: 42, cName: "Buy", cAccountNumberID: 1, cRole: "buy" as const}];

        expect(bookingsStore.portfolioByStockId(1, bookingTypes)).toBe(10);
        expect(bookingsStore.investByStockId(1, bookingTypes)).toBe(1000);
    });

    describe("bookedYears / hasUndatedBookings", () => {
        // The read path never re-validates: databaseAdapter.getAccountRecords
        // returns raw IndexedDB rows, so a legacy row can carry any string here.
        // utcDate returns an Invalid Date for "" but THROWS for a non-empty,
        // non-ISO string, and bookedYears' Number.isFinite filter cannot catch a
        // throw — this computed drives ShowAccounting's year selector, so the
        // dialog failed to open at all.
        it("skips blank and malformed dates instead of throwing", () => {
            const bookingsStore = useBookingsStore();
            bookingsStore.add({...sampleBooking, cID: 1, cBookDate: "2024-01-01"});
            bookingsStore.add({...sampleBooking, cID: 2, cBookDate: "2023-05-05"});
            bookingsStore.add({...sampleBooking, cID: 3, cBookDate: ""});
            bookingsStore.add({...sampleBooking, cID: 4, cBookDate: "15.03.2024"});

            expect(() => bookingsStore.bookedYears).not.toThrow();
            expect(bookingsStore.bookedYears).toEqual(new Set([2024, 2023]));
        });

        it("reports undated bookings so the selector can offer them", () => {
            const bookingsStore = useBookingsStore();
            bookingsStore.add({...sampleBooking, cID: 1, cBookDate: "2024-01-01"});

            expect(bookingsStore.hasUndatedBookings).toBe(false);

            bookingsStore.add({...sampleBooking, cID: 2, cBookDate: ""});

            expect(bookingsStore.hasUndatedBookings).toBe(true);
        });
    });
});
