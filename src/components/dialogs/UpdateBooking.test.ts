/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useBookingForm} from "@/composables/useForms";
import {useBookingsStore} from "@/stores/bookings";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {DATE} from "@/domains/configs/date";
import {createDatabaseService} from "@/services/database/service";

const testDb = createDatabaseService("test-db", 1);

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

describe("UpdateBooking Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(testDb, "isConnected").mockReturnValue(true);
    });

    it("should update a booking and verify it reaches the database service", async () => {
        const {bookingFormData, mapBookingFormToDb} = useBookingForm();
        const bookingsStore = useBookingsStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();

        settings.activeAccountId = 1;
        runtime.activeId = 500;

        // 1. Initial state
        const initialBooking = {
            cID: 500,
            cBookDate: "2025-01-01",
            cExDate: "2025-01-01",
            cDebit: 100,
            cCredit: 0,
            cDescription: "Old Description",
            cCount: 0,
            cBookingTypeID: 5, // DEBIT
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
        };
        bookingsStore.add(initialBooking);

        // 2. Setup form data for update
        bookingFormData.id = 500;
        bookingFormData.selected = 5; // DEBIT
        bookingFormData.bookingTypeId = 5;
        bookingFormData.bookDate = "2025-02-01";
        bookingFormData.description = "New Description";
        bookingFormData.debit = 150;
        bookingFormData.credit = 0;

        // 3. Mock the DB update operation
        const bookingsRepo = testDb.getRepository("bookings");
        const saveSpy = vi
            .spyOn(bookingsRepo, "save")
            .mockResolvedValue(500);

        // 4. Directly test the mapping and updating logic (simulating onClickOk)
        const bookingData = mapBookingFormToDb(settings.activeAccountId, DATE.ISO);

        await bookingsRepo.save(bookingData as any);
        bookingsStore.update(bookingData as any);

        // 5. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cID: 500,
                cDescription: "New Description",
                cDebit: 150
            })
        );

        // 6. Verify store updates
        expect(bookingsStore.items).toHaveLength(1);
        expect(bookingsStore.items[0].cDescription).toBe("New Description");
        expect(bookingsStore.items[0].cDebit).toBe(150);
    });
});
