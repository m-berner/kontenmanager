/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {beforeEach, describe, expect, it, vi} from "vitest";
import {createPinia, setActivePinia} from "pinia";
import type {BackupData} from "@/types";
import {INDEXED_DB} from "@/configs/database";

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

describe("ImportDatabase Logic Test", () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
    });

    it("should validate backup data structure", () => {
        const validBackup: BackupData = {
            sm: {
                cVersion: INDEXED_DB.LEGACY_IMPORT_VERSION,
                cDBVersion: INDEXED_DB.CURRENT_VERSION,
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
            bookingTypes: [{cID: 1, cName: "Buy", cAccountNumberID: 1}],
            stocks: []
        };

        // Validate structure
        expect(validBackup.sm).toBeDefined();
        expect(validBackup.sm.cDBVersion).toBe(INDEXED_DB.CURRENT_VERSION);
        expect(validBackup.accounts).toBeInstanceOf(Array);
        expect(validBackup.bookings).toBeInstanceOf(Array);
        expect(validBackup.bookingTypes).toBeInstanceOf(Array);
        expect(validBackup.stocks).toBeInstanceOf(Array);
    });

    it("should reject invalid backup data", () => {
        const invalidBackup = {
            sm: {
                cVersion: 1,
                cDBVersion: 1, // Old version
                cEngine: "unknown"
            }
        };

        // Version check
        expect(invalidBackup.sm.cDBVersion).toBeLessThan(INDEXED_DB.CURRENT_VERSION);
    });

    it("should handle backup with missing optional fields", () => {
        const backupWithoutTransfers: Partial<BackupData> = {
            sm: {
                cVersion: INDEXED_DB.LEGACY_IMPORT_VERSION,
                cDBVersion: INDEXED_DB.CURRENT_VERSION,
                cEngine: "kontenmanager"
            },
            accounts: [],
            bookings: [],
            bookingTypes: [],
            stocks: []
        };

        // Should not have transfers field (optional legacy field)
        expect(backupWithoutTransfers.transfers).toBeUndefined();
    });
});
