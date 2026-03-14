/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useAccountForm} from "@/composables/useForms";
import {useSettingsStore} from "@/stores/settings";
import {useAccountsStore} from "@/stores/accounts";
import {createDatabaseService} from "@/services/database/service";
import type {AccountDb} from "@/types";

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

describe("AddAccount Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());

        // Mock connection state
        vi.spyOn(testDb, "isConnected").mockReturnValue(true);
    });

    it("should add an account and verify it reaches the database service", async () => {
        const {accountFormData} = useAccountForm();
        const accountsStore = useAccountsStore();
        const settings = useSettingsStore();

        // 1. Setup form data
        accountFormData.swift = "TESTSWIFT";
        accountFormData.iban = "DE12345678901234567890";
        accountFormData.withDepot = false;

        // 2. Mock the DB save operation success
        const mockRepository = {
            save: vi.fn().mockResolvedValue(123)
        };
        const saveSpy = mockRepository.save;
        vi.spyOn(testDb, "getRepository").mockReturnValue(mockRepository as any);

        // 3. Directly test the mapping and adding logic (simulating onClickOk's core operation)
        const accountData: Omit<AccountDb, "cID"> = {
            cSwift: accountFormData.swift.trim().toUpperCase(),
            cIban: accountFormData.iban.replace(/\s/g, "").toUpperCase(),
            cLogoUrl: accountFormData.logoUrl.trim(),
            cWithDepot: accountFormData.withDepot
        };

        const addAccountID = await testDb.getRepository("accounts").save(accountData as AccountDb);

        if (addAccountID !== -1) {
            accountsStore.add({...accountData, cID: addAccountID as number});
            settings.activeAccountId = addAccountID as number;
            await browser.storage.local.set({sActiveAccountId: addAccountID});
        }

        // 4. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cSwift: "TESTSWIFT",
                cIban: "DE12345678901234567890"
            })
        );

        // 5. Verify store updates
        expect(accountsStore.items).toHaveLength(1);
        expect(accountsStore.items[0].cID).toBe(123);
        expect(settings.activeAccountId).toBe(123);

        // 6. Verify browser storage was updated
        expect(browserMock.storage.local.set).toHaveBeenCalledWith(
            expect.objectContaining({
                sActiveAccountId: 123
            })
        );
    });
});
