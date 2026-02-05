import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { databaseService } from "@/services/database";
import { useBookingTypeForm } from "@/composables/useForms";
import { useRecordsStore } from "@/stores/records";
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
describe("DeleteBookingType Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });
    it("should delete a booking type when it has no associated bookings", async () => {
        const { bookingTypeFormData } = useBookingTypeForm();
        const records = useRecordsStore();
        records.bookingTypes.add({
            cID: 1,
            cName: "TestType",
            cAccountNumberID: 1
        });
        bookingTypeFormData.id = 1;
        const removeSpy = vi.spyOn(databaseService, "remove").mockResolvedValue();
        const hasBookingType = records.bookings.hasBookingType(bookingTypeFormData.id);
        expect(hasBookingType).toBe(false);
        records.bookingTypes.remove(bookingTypeFormData.id);
        await databaseService.remove("bookingTypes", bookingTypeFormData.id);
        expect(records.bookingTypes.items.length).toBe(0);
        expect(removeSpy).toHaveBeenCalledWith("bookingTypes", 1);
    });
    it("should not delete a booking type when it has associated bookings", async () => {
        const { bookingTypeFormData } = useBookingTypeForm();
        const records = useRecordsStore();
        records.bookingTypes.add({
            cID: 1,
            cName: "TestType",
            cAccountNumberID: 1
        });
        records.bookings.add({
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
        }, false);
        bookingTypeFormData.id = 1;
        const hasBookingType = records.bookings.hasBookingType(bookingTypeFormData.id);
        expect(hasBookingType).toBe(true);
        expect(records.bookingTypes.items.length).toBe(1);
    });
});
