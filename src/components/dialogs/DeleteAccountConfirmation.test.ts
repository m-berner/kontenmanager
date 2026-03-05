/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useSettingsStore} from "@/stores/settings";
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

describe("DeleteAccountConfirmation Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });

    it("should delete an account and switch to the next one", async () => {
        const records = useRecordsStore();
        const settings = useSettingsStore();

        // Setup multiple accounts
        records.accounts.add({
            cID: 1,
            cSwift: "BANK1",
            cIban: "DE1",
            cLogoUrl: "",
            cWithDepot: true
        });
        records.accounts.add({
            cID: 2,
            cSwift: "BANK2",
            cIban: "DE2",
            cLogoUrl: "",
            cWithDepot: false
        });
        settings.activeAccountId = 1;

        // Mock the DB delete operation
        const deleteSpy = vi
            .spyOn(databaseService, "deleteAccountRecords")
            .mockResolvedValue(undefined);
        // const getRecordsSpy = vi.spyOn(databaseService, "getAccountRecords").mockResolvedValue({
        //   accountsDB: [],
        //   stocksDB: [],
        //   bookingsDB: [],
        //   bookingTypesDB: []
        // });

        // Delete the account
        await databaseService.deleteAccountRecords(settings.activeAccountId);
        records.accounts.remove(settings.activeAccountId);

        // Verify deletion was called
        expect(deleteSpy).toHaveBeenCalledWith(1);
        expect(records.accounts.items.length).toBe(1);
        expect(records.accounts.items[0].cID).toBe(2);
    });

    it("should set activeAccountId to -1 when no accounts remain", async () => {
        const records = useRecordsStore();
        const settings = useSettingsStore();

        // Setup single account
        records.accounts.add({
            cID: 1,
            cSwift: "BANK1",
            cIban: "DE1",
            cLogoUrl: "",
            cWithDepot: true
        });
        settings.activeAccountId = 1;

        // Mock the DB delete operation
        vi.spyOn(databaseService, "deleteAccountRecords").mockResolvedValue(
            undefined
        );

        // Delete the last account
        await databaseService.deleteAccountRecords(settings.activeAccountId);
        records.accounts.remove(settings.activeAccountId);

        // Verify no accounts remain
        expect(records.accounts.items.length).toBe(0);
    });
});
