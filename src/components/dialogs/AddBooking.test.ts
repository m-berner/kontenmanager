/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {INDEXED_DB} from "@/configs/database";
import {useBookingForm} from "@/composables/useForms";
import {useSettingsStore} from "@/stores/settings";
import {useRecordsStore} from "@/stores/records";
import {DATE} from "@/domains/configs/date";
import {createDatabaseService} from "@/services/database/service";
import type {BookingDb} from "@/types";

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

describe("AddBooking Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(testDb, "isConnected").mockReturnValue(true);
    });

    it("should add a booking and verify it reaches the database service", async () => {
        const {bookingFormData, mapBookingFormToDb} = useBookingForm();
        const records = useRecordsStore();
        const settings = useSettingsStore();

        // 0. Set up the active account
        settings.activeAccountId = 1;

        // 1. Setup form data
        bookingFormData.selected = INDEXED_DB.STORE.BOOKING_TYPES.BUY;
        bookingFormData.bookingTypeId = INDEXED_DB.STORE.BOOKING_TYPES.BUY;
        bookingFormData.bookDate = "2023-10-27";
        bookingFormData.credit = 1000;
        bookingFormData.debit = 0;
        bookingFormData.description = "Test Buy";
        bookingFormData.stockId = 1;
        bookingFormData.count = 10;

        // 2. Mock the DB saved operation success
        const mockRepository = {
            save: vi.fn().mockResolvedValue(789)
        };

        const saveSpy = mockRepository.save;
        vi.spyOn(testDb, "getRepository").mockReturnValue(mockRepository as any);

        // 3. Directly test the mapping and adding logic (simulating onClickOk's core operation)
        const bookingData = mapBookingFormToDb(settings.activeAccountId, DATE.ISO);

        const addBookingID = await testDb.getRepository("bookings").save(
            bookingData as BookingDb
        );

        if (addBookingID !== -1) {
            records.bookings.add(
                {...bookingData, cID: addBookingID as number},
                true
            );
        }

        // 4. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cAccountNumberID: 1,
                cBookDate: "2023-10-27",
                cCredit: 1000,
                cDescription: "Test Buy",
                cStockID: 1
            })
        );

        // 5. Verify store updates
        expect(records.bookings.items).toHaveLength(1);
        expect(records.bookings.items[0].cID).toBe(789);
    });
});
