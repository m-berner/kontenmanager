import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAccountsStore } from "./accounts";
import { vi } from "vitest";
vi.mock("vuetify", () => ({
    useTheme: () => ({
        global: {
            name: {
                value: "ocean"
            }
        }
    })
}));
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
    const sampleAccount = {
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
        const updatedAccount = { ...sampleAccount, cIban: "DE0000000000" };
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
