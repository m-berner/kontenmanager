/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useBookingsStore} from "./bookings";
import type {BookingDb} from "@/types";

describe("Bookings Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
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
        cTaxDebit: 0,
        cTaxCredit: 0,
        cSourceTaxDebit: 0,
        cSourceTaxCredit: 0,
        cTransactionTaxDebit: 0,
        cTransactionTaxCredit: 0,
        cSoliDebit: 0,
        cSoliCredit: 0,
        cFeeDebit: 5,
        cFeeCredit: 0
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
});
