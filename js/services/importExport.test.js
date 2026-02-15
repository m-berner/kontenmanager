import { describe, expect, it } from "vitest";
import { ImportExportService } from "./importExport";
describe("ImportExportService", () => {
    const service = new ImportExportService();
    describe("stringifyDatabase", () => {
        it("should stringify valid database data", () => {
            const sm = { cVersion: 1, cDBVersion: 26, cEngine: "test" };
            const accounts = [
                { cID: 1, cSwift: "S", cIban: "I", cLogoUrl: "", cWithDepot: false }
            ];
            const stocks = [];
            const bookingTypes = [];
            const bookings = [];
            const result = service.stringifyDatabase(sm, accounts, stocks, bookingTypes, bookings);
            const parsed = JSON.parse(result);
            expect(parsed.sm).toEqual(sm);
            expect(parsed.accounts).toEqual(accounts);
        });
        it("should throw error if accounts are missing in export data", () => {
            const sm = { cVersion: 1, cDBVersion: 26, cEngine: "test" };
            const accounts = null;
            expect(() => service.stringifyDatabase(sm, accounts, [], [], [])).toThrow();
        });
    });
    describe("readJsonFile", () => {
        it("should read and parse a valid JSON file", async () => {
            const data = {
                sm: { cVersion: 1 },
                accounts: [],
                stocks: [],
                bookingTypes: [],
                bookings: []
            };
            const blob = new Blob([JSON.stringify(data)], {
                type: "application/json"
            });
            const result = await ImportExportService.readJsonFile(blob);
            expect(result).toEqual(data);
        });
        it("should throw AppError for too large file", async () => {
            const largeBlob = {
                size: 200 * 1024 * 1024,
                type: "application/json"
            };
            await expect(ImportExportService.readJsonFile(largeBlob)).rejects.toThrow();
        });
    });
    describe("transformLegacyStock", () => {
        it("should transform legacy stock to current format", () => {
            const legacyStock = {
                cID: 1,
                cSym: "SYM",
                cMeetingDay: 20260101,
                cQuarterDay: 20260101,
                cCompany: "Company",
                cISIN: "ISIN",
                cFadeOut: 0,
                cFirstPage: 1,
                cURL: "http://url"
            };
            const result = service.transformLegacyStock(legacyStock, 123);
            expect(result.cID).toBe(1);
            expect(result.cSymbol).toBe("SYM");
            expect(result.cAccountNumberID).toBe(123);
            expect(result.cCompany).toBe("Company");
        });
    });
});
