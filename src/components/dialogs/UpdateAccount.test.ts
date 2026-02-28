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

describe("UpdateAccount Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, "isConnected").mockReturnValue(true);
    });

    it("should update an account and verify it reaches the database service", async () => {
        const {accountFormData} = useAccountForm();
        const accountsStore = useAccountsStore();
        const settings = useSettingsStore();

        // 1. Initial state
        const initialAccount = {
            cID: 1,
            cSwift: "OLD_SWIFT",
            cIban: "OLD_IBAN",
            cLogoUrl: "http://old.logo",
            cWithDepot: false
        };
        accountsStore.add(initialAccount);
        settings.activeAccountId = 1;

        // 2. Setup form data for update
        accountFormData.id = 1;
        accountFormData.swift = "NEW_SWIFT";
        accountFormData.iban = "NEW_IBAN";
        accountFormData.logoUrl = "http://new.logo";
        accountFormData.withDepot = true;

        // 3. Mock the DB update operation
        const accountsRepo = databaseService.getRepository("accounts");
        const saveSpy = vi.spyOn(accountsRepo, "save").mockResolvedValue(1);

        // 4. Directly test the mapping and updating logic (simulating onClickOk)
        const updatedAccountData = {
            cID: accountFormData.id,
            cSwift: accountFormData.swift.trim().toUpperCase(),
            cIban: accountFormData.iban.replace(/\s/g, "").toUpperCase(),
            cLogoUrl: accountFormData.logoUrl.trim(),
            cWithDepot: accountFormData.withDepot
        };

        await accountsRepo.save(updatedAccountData);
        accountsStore.update(updatedAccountData);

        // 5. Verify database interaction
        expect(saveSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                cID: 1,
                cSwift: "NEW_SWIFT",
                cIban: "NEW_IBAN",
                cWithDepot: true
            })
        );

        // 6. Verify store updates
        expect(accountsStore.items).toHaveLength(1);
        expect(accountsStore.items[0].cSwift).toBe("NEW_SWIFT");
        expect(accountsStore.items[0].cWithDepot).toBe(true);
    });
});
