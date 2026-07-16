/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {
    createExportFilename,
    createExportMetadata,
    estimateSizeKb,
    findExportConsistencyIssues,
    hasExportConsistencyIssues
} from "@/app/usecases/backup/exportHelpers";
import {INDEXED_DB} from "@/domain/constants";
import {makeAccountDb, makeBookingDb, makeBookingTypeDb, makeStockDb} from "@test/usecases";

describe("usecases/backup/exportHelpers", () => {
    describe("createExportFilename", () => {
        it("combines the date prefix, current DB version, and DB name", () => {
            expect(createExportFilename("2026-01-15")).toBe(
                `2026-01-15_${INDEXED_DB.CURRENT_VERSION}_${INDEXED_DB.NAME}.json`
            );
        });
    });

    describe("createExportMetadata", () => {
        it("strips dots from the manifest version to produce a numeric cVersion", () => {
            const meta = createExportMetadata("1.2.3");
            expect(meta.cVersion).toBe(123);
            expect(meta.cDBVersion).toBe(INDEXED_DB.CURRENT_VERSION);
            expect(meta.cEngine).toBe("indexeddb");
        });
    });

    describe("estimateSizeKb", () => {
        it("estimates size in KB from UTF-8 byte length", () => {
            const data = "x".repeat(2048);
            expect(estimateSizeKb(data)).toBe(2);
        });

        it("returns 0 for an empty string", () => {
            expect(estimateSizeKb("")).toBe(0);
        });
    });

    describe("findExportConsistencyIssues / hasExportConsistencyIssues", () => {
        it("reports no issues for a fully consistent, non-empty database", () => {
            const account = makeAccountDb({cID: 1});
            const issues = findExportConsistencyIssues({
                accounts: [account],
                bookings: [makeBookingDb({cAccountNumberID: 1})],
                stocks: [makeStockDb({cAccountNumberID: 1})],
                bookingTypes: [makeBookingTypeDb({cAccountNumberID: 1})]
            });

            expect(issues).toEqual({
                noAccounts: false,
                invalidBookings: 0,
                invalidStocks: 0,
                invalidBookingTypes: 0
            });
            expect(hasExportConsistencyIssues(issues)).toBe(false);
        });

        it("flags an empty database as having no accounts", () => {
            const issues = findExportConsistencyIssues({accounts: [], bookings: [], stocks: [], bookingTypes: []});
            expect(issues.noAccounts).toBe(true);
            expect(hasExportConsistencyIssues(issues)).toBe(true);
        });

        it("counts bookings/stocks/bookingTypes referencing a non-existent account", () => {
            const account = makeAccountDb({cID: 1});
            const issues = findExportConsistencyIssues({
                accounts: [account],
                bookings: [makeBookingDb({cAccountNumberID: 999})],
                stocks: [makeStockDb({cAccountNumberID: 999})],
                bookingTypes: [makeBookingTypeDb({cAccountNumberID: 999})]
            });

            expect(issues.invalidBookings).toBe(1);
            expect(issues.invalidStocks).toBe(1);
            expect(issues.invalidBookingTypes).toBe(1);
            expect(hasExportConsistencyIssues(issues)).toBe(true);
        });
    });
});