/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BackupData, BackupValidationResult} from "@/types";
import {INDEXED_DB} from "@/configs/database";

/**
 * Domain-level validator for database backups.
 * Contains pure functions for verifying the integrity and structure of imported data.
 */
export class ImportExportValidator {
    private static isArrayField(
        field: unknown,
        version: number,
        name: string
    ): BackupValidationResult | null {
        if (!Array.isArray(field)) {
            return {
                isValid: false,
                version,
                error: `Missing or invalid ${name} data`
            };
        }
        return null;
    }

    private static collectDefinedIds<T extends { cID?: number }>(
        items: T[]
    ): number[] {
        return items
            .map((item) => item.cID)
            .filter((id): id is number => id !== undefined);
    }

    private static countUndefinedIds<T extends { cID?: number }>(items: T[]): number {
        return items.filter((item) => item.cID === undefined).length;
    }

    private static pushUndefinedIdError(
        errors: string[],
        count: number,
        entityName: string
    ): void {
        if (count > 0) {
            errors.push(`${count} ${entityName} have undefined IDs`);
        }
    }

    private static pushDuplicateIdError(
        errors: string[],
        ids: number[],
        entityName: string
    ): void {
        if (ids.length > 0) {
            errors.push(`Duplicate ${entityName} IDs: ${ids.join(", ")}`);
        }
    }

    /**
     * Performs a high-level validation of the backup data format and version.
     */
    static validateBackup(data: unknown): BackupValidationResult {
        if (!data || typeof data !== "object") {
            return {isValid: false, version: -1, error: "Invalid data format"};
        }

        const backup = data as Partial<BackupData>;

        if (!backup.sm?.cDBVersion) {
            return {
                isValid: false,
                version: -1,
                error: "Missing version information"
            };
        }

        if (backup.sm.cDBVersion < INDEXED_DB.LEGACY_IMPORT_VERSION) {
            return {
                isValid: false,
                version: backup.sm.cDBVersion,
                error: `Version ${backup.sm.cDBVersion} is too old (minimum: ${INDEXED_DB.LEGACY_IMPORT_VERSION})`
            };
        }

        // Check for required fields
        const isLegacy = backup.sm.cDBVersion === INDEXED_DB.LEGACY_IMPORT_VERSION;

        if (isLegacy) {
            const stocksValidation = this.isArrayField(
                backup.stocks,
                backup.sm.cDBVersion,
                "stocks"
            );
            if (stocksValidation) return stocksValidation;
            const transfersValidation = this.isArrayField(
                backup.transfers,
                backup.sm.cDBVersion,
                "transfers"
            );
            if (transfersValidation) return transfersValidation;
        } else {
            const requiredFields = [
                {field: backup.accounts, name: "accounts"},
                {field: backup.stocks, name: "stocks"},
                {field: backup.bookingTypes, name: "bookingTypes"},
                {field: backup.bookings, name: "bookings"}
            ];

            for (const {field, name} of requiredFields) {
                const validation = this.isArrayField(field, backup.sm.cDBVersion, name);
                if (validation) return validation;
            }
        }

        return {isValid: true, version: backup.sm.cDBVersion};
    }

    /**
     * Deep validation of data integrity, including foreign keys and business rules.
     */
    static validateDataIntegrity(backup: BackupData): string[] {
        const errors: string[] = [];

        if (
            !backup.accounts ||
            !backup.stocks ||
            !backup.bookings ||
            !backup.bookingTypes
        ) {
            return ["Missing required data arrays"];
        }

        errors.push(...this.checkUndefinedIds(backup));
        errors.push(...this.validateForeignKeys(backup));
        errors.push(...this.checkDuplicateIds(backup));
        errors.push(...this.validateBusinessRules(backup));

        return errors;
    }

    /**
     * Validation specific to legacy data format.
     */
    static validateLegacyDataIntegrity(backup: BackupData): string[] {
        const errors: string[] = [];

        if (!backup.stocks || !backup.transfers) {
            return ["Missing required legacy data arrays"];
        }

        const duplicateStocks = this.findDuplicates(
            backup.stocks
                .map((s) => s.cID)
                .filter((id): id is number => id !== undefined)
        );
        if (duplicateStocks.length > 0) {
            errors.push(`Duplicate stock IDs: ${duplicateStocks.join(", ")}`);
        }

        const stockIds = new Set(backup.stocks.map((s) => s.cID));
        for (let i = 0; i < backup.transfers.length; i++) {
            const transfer = backup.transfers[i];
            if (transfer.cStockID && !stockIds.has(transfer.cStockID)) {
                errors.push(
                    `Transfer ${i + 1} references non-existent stock ${transfer.cStockID}`
                );
            }
        }

        return errors;
    }

    private static checkUndefinedIds(backup: BackupData): string[] {
        const errors: string[] = [];
        this.pushUndefinedIdError(
            errors,
            this.countUndefinedIds(backup.accounts),
            "accounts"
        );
        this.pushUndefinedIdError(
            errors,
            this.countUndefinedIds(backup.stocks),
            "stocks"
        );
        this.pushUndefinedIdError(
            errors,
            this.countUndefinedIds(backup.bookings),
            "bookings"
        );
        return errors;
    }

    private static validateForeignKeys(backup: BackupData): string[] {
        const errors: string[] = [];
        const accountIds = new Set(backup.accounts.map((a) => a.cID));
        const stockIds = new Set(backup.stocks.map((s) => s.cID));
        const bookingTypeIds = new Set(backup.bookingTypes.map((bt) => bt.cID));

        for (const booking of backup.bookings) {
            if (!accountIds.has(booking.cAccountNumberID)) {
                errors.push(
                    `Booking ${booking.cID} references non-existent account ${booking.cAccountNumberID}`
                );
            }
            if (booking.cStockID && !stockIds.has(booking.cStockID)) {
                errors.push(
                    `Booking ${booking.cID} references non-existent stock ${booking.cStockID}`
                );
            }
            if (!bookingTypeIds.has(booking.cBookingTypeID)) {
                errors.push(
                    `Booking ${booking.cID} references non-existent booking type ${booking.cBookingTypeID}`
                );
            }
        }

        for (const stock of backup.stocks) {
            if (!accountIds.has(stock.cAccountNumberID)) {
                errors.push(
                    `Stock ${stock.cID} references non-existent account ${stock.cAccountNumberID}`
                );
            }
        }

        for (const bt of backup.bookingTypes) {
            if (!accountIds.has(bt.cAccountNumberID)) {
                errors.push(
                    `Booking type ${bt.cID} references non-existent account ${bt.cAccountNumberID}`
                );
            }
        }

        return errors;
    }

    private static checkDuplicateIds(backup: BackupData): string[] {
        const errors: string[] = [];
        this.pushDuplicateIdError(
            errors,
            this.findDuplicates(this.collectDefinedIds(backup.accounts)),
            "account"
        );
        this.pushDuplicateIdError(
            errors,
            this.findDuplicates(this.collectDefinedIds(backup.stocks)),
            "stock"
        );
        this.pushDuplicateIdError(
            errors,
            this.findDuplicates(this.collectDefinedIds(backup.bookings)),
            "booking"
        );
        return errors;
    }

    private static validateBusinessRules(backup: BackupData): string[] {
        const errors: string[] = [];
        for (const booking of backup.bookings) {
            if (booking.cCredit < 0 && booking.cDebit < 0)
                errors.push(`Booking ${booking.cID} has negative credit/debit values`);
            if (booking.cCredit > 0 && booking.cDebit > 0)
                errors.push(`Booking ${booking.cID} has positive credit/debit values`);
        }
        return errors;
    }

    private static findDuplicates(arr: number[]): number[] {
        const seen = new Set<number>();
        const duplicates = new Set<number>();
        for (const id of arr) {
            if (seen.has(id)) duplicates.add(id);
            seen.add(id);
        }
        return Array.from(duplicates);
    }
}
