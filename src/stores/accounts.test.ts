/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import {useAccountsStore} from "./accounts";
import type {AccountStoreItem} from "@/types";
import {vi} from "vitest";

// Mock persistence composable used by the settings store
vi.mock("@/composables/useStorage", () => ({
    useStorage: () => ({
        getStorage: vi.fn(),
        setStorage: vi.fn(),
        addStorageChangedListener: vi.fn()
    })
}));

describe("Accounts Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const sampleAccount: AccountStoreItem = {
        cID: 1,
        cSwift: "TESTBIC",
        cLogoUrl: "http://logo.com",
        cIban: "DE1234567890",
        cWithDepot: true
    };

    it("should add an account", () => {
        const store = useAccountsStore();
        store.add(sampleAccount);
        expect(store.items).toHaveLength(1);
        expect(store.items[0].cIban).toBe("DE1234567890");
    });

    it("should update an account", () => {
        const store = useAccountsStore();
        store.add(sampleAccount);

        const updatedAccount = {...sampleAccount, cIban: "DE0000000000"};
        store.update(updatedAccount);

        expect(store.items[0].cIban).toBe("DE0000000000");
    });

    it("should remove an account", () => {
        const store = useAccountsStore();
        store.add(sampleAccount);
        expect(store.items).toHaveLength(1);

        store.remove(sampleAccount.cID);
        expect(store.items).toHaveLength(0);
    });

    it("should clean all accounts", () => {
        const store = useAccountsStore();
        store.add(sampleAccount);
        expect(store.items).toHaveLength(1);

        store.clean();
        expect(store.items).toHaveLength(0);
    });
});
