import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { databaseService } from "@/services/database";
import { INDEXED_DB } from "@/config/database";
import { useBookingForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { DATE } from "@/domains/config/date";
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
        getManifest: vi.fn().mockReturnValue({ version: "1.0.0" })
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue("de-DE")
    }
};
vi.stubGlobal("browser", browserMock);
describe("AddBooking Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });
    it("should add a booking and verify it reaches the database service", async () => {
        const { bookingFormData, mapBookingFormToDb } = useBookingForm();
        const records = useRecordsStore();
        const settings = useSettingsStore();
        settings.activeAccountId = 1;
        bookingFormData.selected = INDEXED_DB.STORE.BOOKING_TYPES.BUY;
        bookingFormData.bookingTypeId = INDEXED_DB.STORE.BOOKING_TYPES.BUY;
        bookingFormData.bookDate = "2023-10-27";
        bookingFormData.credit = 1000;
        bookingFormData.debit = 0;
        bookingFormData.description = "Test Buy";
        bookingFormData.stockId = 1;
        bookingFormData.count = 10;
        const addSpy = vi.spyOn(databaseService, "add").mockResolvedValue(789);
        const bookingData = mapBookingFormToDb(settings.activeAccountId, DATE.ISO);
        const addBookingID = await databaseService.add(INDEXED_DB.STORE.BOOKINGS.NAME, bookingData);
        if (addBookingID !== -1) {
            records.bookings.add({ ...bookingData, cID: addBookingID }, true);
        }
        expect(addSpy).toHaveBeenCalledWith(INDEXED_DB.STORE.BOOKINGS.NAME, expect.objectContaining({
            cAccountNumberID: 1,
            cBookDate: "2023-10-27",
            cCredit: 1000,
            cDescription: "Test Buy",
            cStockID: 1
        }));
        expect(records.bookings.items).toHaveLength(1);
        expect(records.bookings.items[0].cID).toBe(789);
    });
});
