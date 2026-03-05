/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useBookingTypeForm} from "@/composables/useForms";
import {useBookingTypesStore} from "@/stores/bookingTypes";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
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

describe("UpdateBookingType Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });

    it("should update a booking type and verify it reaches the database service", async () => {
        const {bookingTypeFormData, mapBookingTypeFormToDb} =
            useBookingTypeForm();
        const bookingTypesStore = useBookingTypesStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();

        settings.activeAccountId = 1;
        runtime.activeId = 10;

        // 1. Initial state
        const initialBookingType = {
            cID: 10,
            cName: "dividend",
            cAccountNumberID: 1
        };
        bookingTypesStore.add(initialBookingType);

        // 2. Setup form data for update
        bookingTypeFormData.id = 10;
        bookingTypeFormData.name = "Dividend Updated";

        // 3. Mock the DB update operation
        const bookingTypesRepo = databaseService.getRepository("bookingTypes");
        const saveSpy = vi.spyOn(bookingTypesRepo, "save").mockResolvedValue(10);

        // 4. Directly test the mapping and updating logic (simulating onClickOk)
        const bookingTypeData = mapBookingTypeFormToDb(settings.activeAccountId);

        await bookingTypesRepo.save(bookingTypeData as any);
        bookingTypesStore.update(bookingTypeData as any);

        // 5. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cID: 10,
                cName: "Dividend Updated" // Normalized by mapBookingTypeFormToDb
            })
        );

        // 6. Verify store updates
        expect(bookingTypesStore.items).toHaveLength(1);
        expect(bookingTypesStore.items[0].cName).toBe("Dividend Updated");
    });
});
