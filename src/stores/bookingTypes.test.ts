/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useBookingTypesStore} from "./bookingTypes";
import type {BookingTypeDb} from "@/types";

describe("BookingTypes Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const sampleType: BookingTypeDb = {
        cID: 1,
        cName: "Purchase",
        cAccountNumberID: 1
    };

    it("should add a booking type", () => {
        const store = useBookingTypesStore();
        store.add(sampleType);
        expect(store.items).toHaveLength(1);
        expect(store.items[0].cName).toBe("Purchase");
    });

    it("should update a booking type", () => {
        const store = useBookingTypesStore();
        store.add(sampleType);

        const updatedType = {...sampleType, cName: "Updated Purchase"};
        store.update(updatedType);

        expect(store.items[0].cName).toBe("Updated Purchase");
    });

    it("should remove a booking type", () => {
        const store = useBookingTypesStore();
        store.add(sampleType);
        expect(store.items).toHaveLength(1);

        store.remove(sampleType.cID);
        expect(store.items).toHaveLength(0);
    });

    it("should clean all booking types", () => {
        const store = useBookingTypesStore();
        store.add(sampleType);
        expect(store.items).toHaveLength(1);

        store.clean();
        expect(store.items).toHaveLength(0);
    });

    describe("isDuplicate", () => {
        it("should detect exact duplicate", () => {
            const store = useBookingTypesStore();
            store.add(sampleType);
            expect(store.isDuplicate("Purchase")).toBe(true);
        });

        it("should detect duplicate with different casing", () => {
            const store = useBookingTypesStore();
            store.add(sampleType);
            expect(store.isDuplicate("Purchase")).toBe(true);
            expect(store.isDuplicate("purchase")).toBe(false);
        });

        it("should detect duplicate with extra whitespace", () => {
            const store = useBookingTypesStore();
            store.add(sampleType);
            expect(store.isDuplicate("  Purchase  ")).toBe(true);
            expect(store.isDuplicate("Pur  chase")).toBe(false); // It collapses, but "Pur chase" != "Purchase"
        });

        it("should detect duplicate with collapsed whitespace", () => {
            const store = useBookingTypesStore();
            store.add({...sampleType, cName: "Food  Drinks"});
            expect(store.isDuplicate("Food Drinks")).toBe(true);
            expect(store.isDuplicate("Food   Drinks")).toBe(true);
        });

        it("should exclude current ID when checking for duplicates", () => {
            const store = useBookingTypesStore();
            store.add(sampleType);
            expect(store.isDuplicate("Purchase", 1)).toBe(false);
            expect(store.isDuplicate("Purchase", 2)).toBe(true);
        });
    });
});
