/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    readJsonFile,
    stringifyDatabase,
    transformLegacyBookingToCurrent,
    transformLegacyStockToCurrent,
    validateBackupData,
    validateDataIntegrityStatus,
    verifyExportIntegrity
} from "@/adapters/driven/importExportAdapter";
import {INDEXED_DB} from "@/domain/constants";
import type {LegacyBookingDb, LegacyStockDb, ModernBackupData} from "@/domain/types";

function createValidBackup(): ModernBackupData {
    return {
        sm: {
            cVersion: INDEXED_DB.CURRENT_VERSION,
            cDBVersion: INDEXED_DB.CURRENT_VERSION,
            cEngine: "kontenmanager"
        },
        accounts: [{cID: 1, cSwift: "TEST", cIban: "DE123", cLogoUrl: "", cWithDepot: false}],
        stocks: [],
        bookingTypes: [],
        bookings: []
    } as unknown as ModernBackupData;
}

describe("importExportAdapter", () => {
    describe("readJsonFile", () => {
        it("throws when the blob is empty", async () => {
            const blob = new Blob([], {type: "application/json"});
            await expect(readJsonFile(blob)).rejects.toThrow();
        });

        it("throws when the blob exceeds the maximum allowed size", async () => {
            const oversized = {size: Number.MAX_SAFE_INTEGER, text: async () => "{}"} as unknown as Blob;
            await expect(readJsonFile(oversized)).rejects.toThrow();
        });

        it("throws when the blob's text is blank", async () => {
            const blob = new Blob(["   "], {type: "application/json"});
            await expect(readJsonFile(blob)).rejects.toThrow();
        });

        it("throws when the text is not valid JSON", async () => {
            const blob = new Blob(["{not json"], {type: "application/json"});
            await expect(readJsonFile(blob)).rejects.toThrow();
        });

        it("throws when the parsed JSON is not an object", async () => {
            const blob = new Blob(["42"], {type: "application/json"});
            await expect(readJsonFile(blob)).rejects.toThrow();
        });

        it("reads and parses a well-formed backup file", async () => {
            const backup = createValidBackup();
            const blob = new Blob([JSON.stringify(backup)], {type: "application/json"});

            const result = await readJsonFile(blob);

            expect(result).toEqual(backup);
        });
    });

    describe("stringifyDatabase", () => {
        it("throws when a required array argument is missing", () => {
            expect(() =>
                stringifyDatabase(
                    {cVersion: 27, cDBVersion: 27, cEngine: "kontenmanager"},
                    undefined as any,
                    [],
                    [],
                    []
                )
            ).toThrow();
        });

        it("serializes valid data into round-trippable JSON", () => {
            const sm = {cVersion: 27, cDBVersion: 27, cEngine: "kontenmanager"};
            const accounts = [{cID: 1, cSwift: "TEST", cIban: "DE123", cLogoUrl: "", cWithDepot: false}];

            const json = stringifyDatabase(sm as any, accounts as any, [], [], []);
            const parsed = JSON.parse(json);

            expect(parsed.sm).toEqual(sm);
            expect(parsed.accounts).toEqual(accounts);
        });
    });

    describe("verifyExportIntegrity", () => {
        it("reports valid for a well-formed, referentially consistent export", () => {
            const backup = createValidBackup();
            const result = verifyExportIntegrity(JSON.stringify(backup));

            expect(result).toEqual({valid: true, errors: []});
        });

        it("reports a parse error for malformed JSON text", () => {
            const result = verifyExportIntegrity("{not json");

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toMatch(/^Parse error:/);
        });

        it("reports the validateBackup error for structurally invalid data", () => {
            const result = verifyExportIntegrity(JSON.stringify({}));

            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(["Missing version information"]);
        });

        it("reports referential-integrity errors for structurally valid but inconsistent data", () => {
            const backup = createValidBackup();
            backup.bookings.push({
                cID: 1,
                cAccountNumberID: 999,
                cBookingTypeID: 1,
                cBookDate: "2026-01-01",
                cExDate: "",
                cCount: 0,
                cCredit: 0,
                cDebit: 0,
                cDescription: "",
                cStockID: 0,
                cSoli: 0,
                cMarketPlace: "",
                cTax: 0,
                cFee: 0,
                cSourceTax: 0,
                cTransactionTax: 0
            } as any);

            const result = verifyExportIntegrity(JSON.stringify(backup));

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateBackupData / validateDataIntegrityStatus", () => {
        it("validateBackupData flags missing version information", () => {
            const result = validateBackupData({});
            expect(result.isValid).toBe(false);
        });

        it("validateDataIntegrityStatus returns no errors for consistent data", () => {
            const backup = createValidBackup();
            expect(validateDataIntegrityStatus(backup)).toEqual([]);
        });
    });

    describe("legacy transformation delegation", () => {
        it("transformLegacyStockToCurrent maps a legacy stock record to the current shape", () => {
            const legacy: LegacyStockDb = {
                cID: 5,
                cSym: "AAA",
                cMeetingDay: Date.UTC(2026, 0, 1),
                cQuarterDay: Date.UTC(2026, 3, 1),
                cCompany: "Acme",
                cISIN: "DE0001234567",
                cFadeOut: 0,
                cNotFirstPage: 1,
                cURL: "https://example.com"
            };

            const result = transformLegacyStockToCurrent(legacy, 7);

            expect(result.cAccountNumberID).toBe(7);
            expect(result.cSymbol).toBe("AAA");
            expect(result.cISIN).toBe("DE0001234567");
        });

        it("transformLegacyBookingToCurrent maps a legacy booking record to the current shape", () => {
            const legacy: LegacyBookingDb = {
                cDate: Date.UTC(2026, 0, 1),
                cExDay: Date.UTC(2026, 0, 2),
                cUnitQuotation: 10,
                cDeposit: 100,
                cDescription: "legacy booking",
                cNumber: 1,
                cType: INDEXED_DB.STORE.BOOKING_TYPES.CREDIT,
                cStockID: 42,
                cSoli: 0,
                cTaxes: 0,
                cFees: 0,
                cSTax: 0,
                cFTax: 0,
                cMarketPlace: "XETRA"
            };

            const result = transformLegacyBookingToCurrent(legacy, 0, 7);

            expect(result.cAccountNumberID).toBe(7);
            expect(result.cCredit).toBe(100);
            expect(result.cDebit).toBe(0);
        });
    });
});