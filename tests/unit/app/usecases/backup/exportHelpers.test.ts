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
        it("stores the manifest version verbatim", () => {
            const meta = createExportMetadata("1.2.3");
            expect(meta.cVersion).toBe("1.2.3");
            expect(meta.cDBVersion).toBe(INDEXED_DB.CURRENT_VERSION);
            expect(meta.cEngine).toBe("indexeddb");
        });

        // The reason the dot-stripping encode was replaced. `Number.parseInt(v
        // .replace(/\./g, ""))` is not order-preserving once any segment reaches
        // two digits: 1.10.0 encoded to 1100 while the EARLIER 1.2.10 encoded to
        // 1210, so a later release compared as smaller. It also collapsed
        // distinct versions — 1.2.3 and 12.3 both gave 123. Nothing reads
        // cVersion today (validateBackup gates on cDBVersion), so this was inert;
        // the cost was that every backup already written carried a version stamp
        // no future migration could trust.
        it("keeps versions comparable and distinct where the numeric encode did not", () => {
            expect(createExportMetadata("1.10.0").cVersion).toBe("1.10.0");
            expect(createExportMetadata("1.2.10").cVersion).toBe("1.2.10");
            expect(createExportMetadata("1.2.3").cVersion).not.toBe(
                createExportMetadata("12.3").cVersion
            );
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

        // The byte count is now computed by walking the string rather than
        // allocating a Uint8Array as long as it (this runs on an export that can
        // approach 64 MB, already held alongside the arrays it came from). It
        // must agree with TextEncoder exactly — including the cases the hand-
        // rolled walk has to get right on its own: multi-byte scalars, surrogate
        // PAIRS (4 bytes, two code units), and LONE surrogates, which
        // TextEncoder replaces with U+FFFD at 3 bytes.
        it.each([
            ["ascii", "hello world"],
            ["2-byte", "Ölpreis für Aktienkäufe"],
            ["3-byte", "日本語のテキスト"],
            ["surrogate pair", "profit 📈 and loss 📉"],
            ["lone high surrogate", "a\uD83Db"],
            ["lone low surrogate", "a\uDE00b"],
            ["mixed", 'Ä📈{"cIban":"DE89…"}\uD800']
        ])("matches TextEncoder for %s input", (_label, sample) => {
            const expected = new TextEncoder().encode(sample).length / 1024;
            expect(estimateSizeKb(sample)).toBe(expected);
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

        it("flags an empty database as having no accounts, but not as inconsistent", () => {
            // An empty database is not an INCONSISTENT one. Folding the two
            // together made exportDatabaseUsecase throw EXPORT_DATABASE.A
            // ("Export validation failed") at a user who had just installed the
            // extension and clicked Export. `noAccounts` is still reported --
            // the caller has to refuse -- but it no longer counts as a
            // consistency issue, and export.ts answers it with
            // EXPORT_DATABASE.EMPTY instead.
            const issues = findExportConsistencyIssues({accounts: [], bookings: [], stocks: [], bookingTypes: []});
            expect(issues.noAccounts).toBe(true);
            expect(hasExportConsistencyIssues(issues)).toBe(false);
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