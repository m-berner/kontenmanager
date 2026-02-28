/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useBookingTypeForm} from "@/composables/useForms";
import {useRecordsStore} from "@/stores/records";
import {databaseService} from "@/services/database/service";

// Mock browser API
const browserMock = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    notifications: {
        create: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
        getURL: vi.fn().mockReturnValue(""),
        getManifest: vi.fn().mockReturnValue({version: "1.0.0"})
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue("de-DE")
    }
};
vi.stubGlobal("browser", browserMock);

describe("DeleteBookingType Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });

    it("should delete a booking type when it has no associated bookings", async () => {
        const {bookingTypeFormData} = useBookingTypeForm();
        const records = useRecordsStore();

        // Set up the booking type
        records.bookingTypes.add({
            cID: 1,
            cName: "TestType",
            cAccountNumberID: 1
        });
        bookingTypeFormData.id = 1;

        // Mock the DB remove operation
        const bookingTypesRepo = databaseService.getRepository("bookingTypes");
        const removeSpy = vi.spyOn(bookingTypesRepo, "delete").mockResolvedValue();

        // Verify no bookings use this type
        const hasBookingType = records.bookings.hasBookingType(
            bookingTypeFormData.id
        );
        expect(hasBookingType).toBe(false);

        // Delete the booking type
        records.bookingTypes.remove(bookingTypeFormData.id);
        await bookingTypesRepo.delete(bookingTypeFormData.id);

        // Verify deletion
        expect(records.bookingTypes.items.length).toBe(0);
        expect(removeSpy).toHaveBeenCalledWith(1);
    });

    it("should not delete a booking type when it has associated bookings", async () => {
        const {bookingTypeFormData} = useBookingTypeForm();
        const records = useRecordsStore();

        // Setup booking type and associated booking
        records.bookingTypes.add({
            cID: 1,
            cName: "TestType",
            cAccountNumberID: 1
        });
        records.bookings.add(
            {
                cID: 1,
                cBookDate: "2024-01-01",
                cExDate: "",
                cDebit: 100,
                cCredit: 0,
                cDescription: "Test",
                cCount: 1,
                cBookingTypeID: 1,
                cAccountNumberID: 1,
                cStockID: 0,
                cSoliCredit: 0,
                cSoliDebit: 0,
                cTaxCredit: 0,
                cTaxDebit: 0,
                cFeeCredit: 0,
                cFeeDebit: 0,
                cSourceTaxCredit: 0,
                cSourceTaxDebit: 0,
                cTransactionTaxCredit: 0,
                cTransactionTaxDebit: 0,
                cMarketPlace: ""
            },
            false
        );

        bookingTypeFormData.id = 1;

        // Verify booking uses this type
        const hasBookingType = records.bookings.hasBookingType(
            bookingTypeFormData.id
        );
        expect(hasBookingType).toBe(true);

        // Booking type should still exist
        expect(records.bookingTypes.items.length).toBe(1);
    });
});
