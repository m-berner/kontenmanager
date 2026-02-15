import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useBookingTypeForm } from "@/composables/useForms";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { createDatabaseService } from "@/services/database/service";
const testDb = createDatabaseService("test-db", 1);
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
describe("AddBookingType Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(testDb, "isConnected").mockReturnValue(true);
    });
    it("should add a booking type and verify it reaches the database service", async () => {
        const { bookingTypeFormData, mapBookingTypeFormToDb } = useBookingTypeForm();
        const records = useRecordsStore();
        const settings = useSettingsStore();
        settings.activeAccountId = 1;
        bookingTypeFormData.name = "Test Type";
        const mockRepository = {
            save: vi.fn().mockResolvedValue(101)
        };
        const saveSpy = mockRepository.save;
        vi.spyOn(testDb, "getRepository").mockReturnValue(mockRepository);
        expect(records.bookingTypes.isDuplicate("Test Type")).toBe(false);
        const bookingTypeData = mapBookingTypeFormToDb(settings.activeAccountId);
        const addBookingTypeID = await testDb.getRepository("bookingTypes").save(bookingTypeData);
        if (addBookingTypeID !== -1) {
            records.bookingTypes.add({
                ...bookingTypeData,
                cID: addBookingTypeID
            });
        }
        expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
            cName: "Test Type",
            cAccountNumberID: 1
        }));
        expect(records.bookingTypes.items).toHaveLength(1);
        expect(records.bookingTypes.items[0].cID).toBe(101);
        expect(records.bookingTypes.items[0].cName).toBe("Test Type");
    });
});
