import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { INDEXED_DB } from "@/config/database";
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
describe("ImportDatabase Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
    });
    it("should validate backup data structure", () => {
        const validBackup = {
            sm: {
                cVersion: INDEXED_DB.SM_IMPORT_VERSION,
                cDBVersion: INDEXED_DB.VERSION,
                cEngine: "kontenmanager"
            },
            accounts: [
                {
                    cID: 1,
                    cSwift: "BANK1",
                    cIban: "DE1",
                    cLogoUrl: "",
                    cWithDepot: true
                }
            ],
            bookings: [],
            bookingTypes: [{ cID: 1, cName: "Buy", cAccountNumberID: 1 }],
            stocks: []
        };
        expect(validBackup.sm).toBeDefined();
        expect(validBackup.sm.cDBVersion).toBe(INDEXED_DB.VERSION);
        expect(validBackup.accounts).toBeInstanceOf(Array);
        expect(validBackup.bookings).toBeInstanceOf(Array);
        expect(validBackup.bookingTypes).toBeInstanceOf(Array);
        expect(validBackup.stocks).toBeInstanceOf(Array);
    });
    it("should reject invalid backup data", () => {
        const invalidBackup = {
            sm: {
                cVersion: 1,
                cDBVersion: 1,
                cEngine: "unknown"
            }
        };
        expect(invalidBackup.sm.cDBVersion).toBeLessThan(INDEXED_DB.VERSION);
    });
    it("should handle backup with missing optional fields", () => {
        const backupWithoutTransfers = {
            sm: {
                cVersion: INDEXED_DB.SM_IMPORT_VERSION,
                cDBVersion: INDEXED_DB.VERSION,
                cEngine: "kontenmanager"
            },
            accounts: [],
            bookings: [],
            bookingTypes: [],
            stocks: []
        };
        expect(backupWithoutTransfers.transfers).toBeUndefined();
    });
});
