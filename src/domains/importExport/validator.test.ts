/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {describe, expect, it} from "vitest";
import {validateBackup, validateDataIntegrity} from "./validator";
import {INDEXED_DB} from "@/constants";

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
            const data = {sm: {cDBVersion: INDEXED_DB.LEGACY_IMPORT_VERSION - 1}};
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

        it("should detect invalid foreign keys", () => {
            const backupWithInvalidFK = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 999, cBookingTypeID: 100, cCredit: 10, cDebit: 0}]
            };
            const errors = validateDataIntegrity(backupWithInvalidFK);
            expect(errors).toContain("Booking 1000 references non-existent account 999");
        });

        it("should detect business rule violations", () => {
            const backupWithViolation = {
                ...validBackup,
                bookings: [{cID: 1000, cAccountNumberID: 1, cBookingTypeID: 100, cCredit: 10, cDebit: 10}]
            };
            const errors = validateDataIntegrity(backupWithViolation);
            expect(errors).toContain("Booking 1000 has positive credit/debit values");
        });
    });
});
