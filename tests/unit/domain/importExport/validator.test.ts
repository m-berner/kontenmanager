/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {validateBackup, validateDataIntegrity} from "@/domain/importExport/validator";
import {INDEXED_DB} from "@/domain/constants";

describe("Import/Export Validator", () => {
    describe("validateBackup", () => {
        it("should return valid for correct backup format", () => {
            const data = {
                sm: {cDBVersion: INDEXED_DB.CURRENT_VERSION},
                accounts: [],
                stocks: [],
                bookingTypes: [],
                bookings: []
            };
            expect(validateBackup(data)).toEqual({isValid: true, version: INDEXED_DB.CURRENT_VERSION});
        });

        it("should return invalid for the missing version", () => {
            const data = {accounts: []};
            expect(validateBackup(data).isValid).toBe(false);
        });

        it("should return invalid for the version too old", () => {
            const data = {sm: {cDBVersion: INDEXED_DB.MIN_SUPPORTED_VERSION - 1}};
            expect(validateBackup(data).isValid).toBe(false);
        });

        it("should return invalid for missing required arrays", () => {
            const data = {sm: {cDBVersion: INDEXED_DB.CURRENT_VERSION}, accounts: []};
            const result = validateBackup(data);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("stocks");
        });
    });

    describe("validateDataIntegrity", () => {
        const validBackup: any = {
            accounts: [{cID: 1}],
            stocks: [{cID: 10, cAccountNumberID: 1}],
            bookingTypes: [{cID: 100, cAccountNumberID: 1}],
            bookings: [{cID: 1000, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: 10, cDebit: 0}]
        };

        it("should return no errors for valid data", () => {
            expect(validateDataIntegrity(validBackup)).toEqual([]);
        });

        it("should detect undefined IDs", () => {
            const backupWithUndefined = {
                ...validBackup,
                accounts: [{cID: undefined}]
            };
            const errors = validateDataIntegrity(backupWithUndefined);
            expect(errors).toContain("1 accounts have undefined IDs");
        });

        it("should detect duplicate IDs", () => {
            const backupWithDuplicates = {
                ...validBackup,
                accounts: [{cID: 1}, {cID: 1}]
            };
            const errors = validateDataIntegrity(backupWithDuplicates);
            expect(errors).toContain("Duplicate account IDs: 1");
        });

        it("should treat a null cID the same as an undefined one", () => {
            // A null cID (e.g. a hand-edited backup) must be caught here, not silently pass
            // through with two normalizers disagreeing on its default (validateAccount's `?? 0`
            // vs import.ts's active-account `?? SM_RESTORE_ACCOUNT_ID`), which would desync which
            // account the post-import UI filters by from what was actually written to the DB.
            const backupWithNull = {
                ...validBackup,
                accounts: [{cID: null}]
            };
            const errors = validateDataIntegrity(backupWithNull);
            expect(errors).toContain("1 accounts have undefined IDs");
        });

        it("should detect undefined IDs in booking types", () => {
            const backupWithUndefined = {
                ...validBackup,
                bookingTypes: [{cID: undefined, cAccountNumberID: 1}]
            };
            const errors = validateDataIntegrity(backupWithUndefined);
            expect(errors).toContain("1 bookingTypes have undefined IDs");
        });

        it("should detect duplicate IDs in booking types", () => {
            const backupWithDuplicates = {
                ...validBackup,
                bookingTypes: [
                    {cID: 100, cAccountNumberID: 1},
                    {cID: 100, cAccountNumberID: 1}
                ]
            };
            const errors = validateDataIntegrity(backupWithDuplicates);
            expect(errors).toContain("Duplicate booking type IDs: 100");
        });

        it("should detect duplicate explicit booking type roles in the same account", () => {
            const backupWithDuplicateRoles = {
                ...validBackup,
                bookingTypes: [
                    {cID: 100, cAccountNumberID: 1, cName: "Kauf", cRole: "buy"},
                    {cID: 101, cAccountNumberID: 1, cName: "Sonderkauf", cRole: "buy"}
                ]
            };
            const errors = validateDataIntegrity(backupWithDuplicateRoles);
            expect(errors).toContain('Account 1 has 2 booking types with role "buy"');
        });

        it("should not flag multiple 'other'-role booking types as duplicates", () => {
            const backupWithTwoCustomTypes = {
                ...validBackup,
                bookingTypes: [
                    {cID: 100, cAccountNumberID: 1, cName: "Custom A", cRole: "other"},
                    {cID: 101, cAccountNumberID: 1, cName: "Custom B", cRole: "other"}
                ]
            };
            expect(validateDataIntegrity(backupWithTwoCustomTypes)).toEqual([]);
        });

        it("should detect a role collision produced by the legacy name-matching fallback", () => {
            // Neither row has cRole (a backup exported before that field existed) - both
            // names resolve to "dividend" via resolveLegacyBookingTypeRole's fallback.
            const backupWithLegacyCollision = {
                ...validBackup,
                bookingTypes: [
                    {cID: 100, cAccountNumberID: 1, cName: "Dividende"},
                    {cID: 101, cAccountNumberID: 1, cName: "Dividend"}
                ]
            };
            const errors = validateDataIntegrity(backupWithLegacyCollision);
            expect(errors).toContain('Account 1 has 2 booking types with role "dividend"');
        });

        it("should detect invalid foreign keys", () => {
            const backupWithInvalidFK = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 999, cBookingTypeID: 100, cCredit: 10, cDebit: 0}]
            };
            const errors = validateDataIntegrity(backupWithInvalidFK);
            // The message no longer repeats the dangling id. `validateForeignKeys`
            // now delegates to the shared `findReferentialIssues` survey, which
            // the export path and the health checker also use — three
            // hand-written traversals of one invariant that used to disagree
            // about which relationships even count. The survey returns the ids of
            // the *offending records*, which is what a user needs to locate them;
            // the id they point at is not in the database by definition.
            expect(errors).toContain("Booking 1000 references a non-existent account");
        });

        it("should detect business rule violations", () => {
            const backupWithViolation = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: 10, cDebit: 10}]
            };
            const errors = validateDataIntegrity(backupWithViolation);
            expect(errors).toContain("Booking 1000 has positive credit/debit values");
        });

        it("should detect a single negative credit or debit value", () => {
            const backupWithNegativeCredit = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: -10, cDebit: 0}]
            };
            expect(validateDataIntegrity(backupWithNegativeCredit)).toContain(
                "Booking 1000 has negative credit/debit values"
            );

            const backupWithNegativeDebit = {
                ...validBackup,
                bookings: [{cID: 1001, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: 0, cDebit: -10}]
            };
            expect(validateDataIntegrity(backupWithNegativeDebit)).toContain(
                "Booking 1001 has negative credit/debit values"
            );
        });

        it("should detect a negative count", () => {
            // Mirrors the UI-form countRules() guard at the backup-import boundary:
            // a negative count silently inverts calculatePortfolioByStockId's
            // buy/sell math for a hand-edited or legacy backup.
            const backupWithNegativeCount = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: 10, cDebit: 0, cCount: -5}]
            };
            expect(validateDataIntegrity(backupWithNegativeCount)).toContain(
                "Booking 1000 has a negative count"
            );
        });
    });
});
