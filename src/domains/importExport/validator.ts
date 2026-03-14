/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {BackupData, BackupValidationResult} from "@/types";
import {INDEXED_DB} from "@/constants";

/**
 * Checks whether the provided field is an array and validates it.
 *
 * @param field - The field to be checked and validated.
 * @param version - The version number associated with the validation.
 * @param name - The name of the field being validated, used in error messages.
 * @returns Returns a validation result object if the field is not an array, or null if the field is valid.
 */
function isArrayField(
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

/**
 * Collects and returns an array of defined `cID` values from the provided array of objects.
 *
 * @param items - An array of objects, where each object may optionally contain a `cID` property.
 * @returns An array of `cID` values that are defined (not `undefined`) in the input objects.
 */
function collectDefinedIds<T extends { cID?: number }>(
    items: T[]
): number[] {
    return items
        .map((item) => item.cID)
        .filter((id): id is number => id !== undefined);
}

/**
 * Counts the number of objects in the array where the `cID` property is undefined.
 *
 * @param items - An array of objects to be checked. Each object may optionally have a `cID` property.
 * @returns The count of objects with an undefined `cID` property.
 */
function countUndefinedIds<T extends { cID?: number }>(items: T[]): number {
    return items.filter((item) => item.cID === undefined).length;
}

/**
 * Pushes an error message into the errors array if the specified count is greater than zero.
 *
 * @param errors - The array to which the error message will be added.
 * @param count - The number of entities with undefined IDs.
 * @param entityName - The name of the entity type associated with the undefined IDs.
 * @returns This method does not return any value.
 */
function pushUndefinedIdError(
    errors: string[],
    count: number,
    entityName: string
): void {
    if (count > 0) {
        errors.push(`${count} ${entityName} have undefined IDs`);
    }
}

/**
 * Appends a descriptive error message to the list of errors when duplicate IDs are detected.
 *
 * @param errors - The array that stores error messages.
 * @param ids - The list of duplicate IDs to include in the error message.
 * @param entityName - The name of the entity associated with the duplicate IDs.
 * @returns This function does not return a value; it modifies the `errors` array directly.
 */
function pushDuplicateIdError(
    errors: string[],
    ids: number[],
    entityName: string
): void {
    if (ids.length > 0) {
        errors.push(`Duplicate ${entityName} IDs: ${ids.join(", ")}`);
    }
}

/**
 * Identifies and returns duplicate numbers in an array.
 *
 * @param arr - The array of numbers to check for duplicates.
 * @returns An array containing the duplicate numbers found in the input array.
 */
function findDuplicates(arr: number[]): number[] {
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const id of arr) {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    }
    return Array.from(duplicates);
}

/**
 * Checks for undefined IDs in various sections of the given backup data and returns a list of error messages.
 *
 * @param backup - The backup data object containing various sections such as accounts, stocks, and bookings.
 * @returns An array of error messages indicating the sections with undefined IDs, if any.
 */
function checkUndefinedIds(backup: BackupData): string[] {
    const errors: string[] = [];
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.accounts),
        "accounts"
    );
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.stocks),
        "stocks"
    );
    pushUndefinedIdError(
        errors,
        countUndefinedIds(backup.bookings),
        "bookings"
    );
    return errors;
}

/**
 * Validates foreign key references in the provided backup data.
 * Ensures that all bookings, stocks, and booking types reference valid accounts,
 * and that bookings reference valid stocks and booking types where applicable.
 *
 * @param backup - The backup data object containing accounts, stocks, booking types, and bookings.
 * @returns An array of error messages describing invalid foreign key references, if any are found.
 */
function validateForeignKeys(backup: BackupData): string[] {
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

/**
 * Identifies and collects errors for duplicate IDs found in the accounts, stocks, and bookings
 * sections of the provided backup data.
 *
 * @param backup - The backup data object containing accounts, stocks, and bookings.
 * @returns An array of error messages indicating the duplicates found for each section.
 */
function checkDuplicateIds(backup: BackupData): string[] {
    const errors: string[] = [];
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.accounts)),
        "account"
    );
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.stocks)),
        "stock"
    );
    pushDuplicateIdError(
        errors,
        findDuplicates(collectDefinedIds(backup.bookings)),
        "booking"
    );
    return errors;
}

/**
 * Validates the business rules for the provided backup data and ensures that
 * the credit and debit values in the bookings adhere to the specified criteria.
 *
 * @param backup - The backup data containing the bookings to validate.
 * @returns An array of error messages indicating the business rule violations.
 */
function validateBusinessRules(backup: BackupData): string[] {
    const errors: string[] = [];
    for (const booking of backup.bookings) {
        if (booking.cCredit < 0 && booking.cDebit < 0)
            errors.push(`Booking ${booking.cID} has negative credit/debit values`);
        if (booking.cCredit > 0 && booking.cDebit > 0)
            errors.push(`Booking ${booking.cID} has positive credit/debit values`);
    }
    return errors;
}

/**
 * Performs a high-level validation of the backup data format and version.
 */
export function validateBackup(data: unknown): BackupValidationResult {
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
        const stocksValidation = isArrayField(
            backup.stocks,
            backup.sm.cDBVersion,
            "stocks"
        );
        if (stocksValidation) return stocksValidation;
        const transfersValidation = isArrayField(
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
            const validation = isArrayField(field, backup.sm.cDBVersion, name);
            if (validation) return validation;
        }
    }

    return {isValid: true, version: backup.sm.cDBVersion};
}

/**
 * Validates the integrity of backup data by checking for missing required data arrays,
 * undefined IDs, foreign key relationships, duplicate IDs, and adherence to business rules.
 *
 * @param backup - The backup data object containing accounts, stocks, bookings, and booking types to validate.
 * @returns An array of error messages describing any issues found during validation. Returns an empty array if no issues are detected.
 */
export function validateDataIntegrity(backup: BackupData): string[] {
    const errors: string[] = [];

    if (
        !backup.accounts ||
        !backup.stocks ||
        !backup.bookings ||
        !backup.bookingTypes
    ) {
        return ["Missing required data arrays"];
    }

    errors.push(...checkUndefinedIds(backup));
    errors.push(...validateForeignKeys(backup));
    errors.push(...checkDuplicateIds(backup));
    errors.push(...validateBusinessRules(backup));

    return errors;
}

/**
 * Validates the integrity of legacy data by checking for missing required data arrays, duplicate stock IDs,
 * and invalid transfer references to non-existent stocks.
 *
 * @param backup - The legacy data containing stocks and transfers to validate.
 * @returns An array of error messages, or an empty array if the data is valid.
 */
export function validateLegacyDataIntegrity(backup: BackupData): string[] {
    const errors: string[] = [];

    if (!backup.stocks || !backup.transfers) {
        return ["Missing required legacy data arrays"];
    }

    const duplicateStocks = findDuplicates(
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

