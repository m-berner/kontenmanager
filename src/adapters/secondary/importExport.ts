/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {DATE, ERROR_CATEGORY, INDEXED_DB} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, serializeError} from "@/domain/errors";
import {transformLegacyBooking, transformLegacyStock} from "@/domain/importExport/transformer";
import {validateBackup, validateDataIntegrity, validateLegacyDataIntegrity} from "@/domain/importExport/validator";
import type {
    AccountDb,
    AppMetadata,
    BackupData,
    BackupValidationResult,
    BookingDb,
    BookingTypeDb,
    ExportData,
    LegacyBackupData,
    LegacyBookingDb,
    LegacyStockDb,
    ModernBackupData,
    StockDb
} from "@/domain/types";
import {isoDate} from "@/domain/utils/utils";

/**
 * Constants for file validation
 */
const FILE_VALIDATION = {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MIN_SIZE: 1
} as const;

/**
 * File validation helper
 */
function validateBlob(blob: Blob): void {
    if (!blob || blob.size === 0) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.A.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }

    if (blob.size > FILE_VALIDATION.MAX_SIZE) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
}

function validateText(text: string): void {
    if (text.trim().length === 0) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.D.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
}

/**
 * File reading helper
 */
async function readBlobAsText(blob: Blob): Promise<string> {
    try {
        return await blob.text();
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.A.CODE,
            ERROR_CATEGORY.VALIDATION,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * JSON parsing helper
 */
function parseJson(text: string): BackupData {
    let parsed: unknown;

    try {
        parsed = JSON.parse(text);
    } catch (err) {
        // Parsing errors are format/validation issues, not legacy transformation failures.
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            true,
            {originalError: serializeError(err)}
        );
    }

    if (!parsed || typeof parsed !== "object") {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.B.CODE,
            ERROR_CATEGORY.VALIDATION,
            false,
            {reason: "Parsed JSON is not an object"}
        );
    }

    return parsed as BackupData;
}

/**
 * JSON serialization helper
 */
function stringifyJson(data: ExportData): string {
    try {
        return JSON.stringify(data, null, 2);
    } catch (err) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.G.CODE,
            ERROR_CATEGORY.VALIDATION,
            true,
            {originalError: serializeError(err)}
        );
    }
}

/**
 * Validates backup data structure
 * @param data - Data to validate
 * @returns Validation result with errors if invalid
 */
export function validateBackupData(data: unknown): BackupValidationResult {
    return validateBackup(data);
}

/**
 * Validates data integrity (referential integrity, orphaned records, etc.)
 * @param backup - Backup data to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateDataIntegrityStatus(backup: BackupData): string[] {
    return validateDataIntegrity(backup as ModernBackupData);
}

/**
 * Validates legacy data integrity
 * @param backup - Legacy backup data to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateLegacyDataIntegrityStatus(backup: BackupData): string[] {
    return validateLegacyDataIntegrity(backup as LegacyBackupData);
}

/**
 * Reads and parses a JSON backup file
 * @param blob - File blob to read
 * @returns Parsed backup data
 * @throws AppError if the file is invalid or cannot be read
 */
export async function readJsonFile(blob: Blob): Promise<BackupData> {
    validateBlob(blob);

    const text = await readBlobAsText(blob);
    validateText(text);

    return parseJson(text);
}

/**
 * Serializes database records to JSON string
 * @param sm - App metadata
 * @param accounts - Account records
 * @param stocks - Stock records
 * @param bookingTypes - Booking type records
 * @param bookings - Booking records
 * @returns JSON string representation
 * @throws AppError if data is invalid or serialization fails
 */
export function stringifyDatabase(
    sm: AppMetadata,
    accounts: AccountDb[],
    stocks: StockDb[],
    bookingTypes: BookingTypeDb[],
    bookings: BookingDb[]
): string {
    validateExportData(accounts, stocks, bookingTypes, bookings);

    const exportData = {
        sm,
        accounts,
        stocks,
        bookingTypes,
        bookings
    };

    return stringifyJson(exportData);
}

/**
 * Verifies the integrity of exported data
 * @param exportedData - JSON string to verify
 * @returns Validation result with any errors found
 */
export function verifyExportIntegrity(exportedData: string): {
    valid: boolean;
    errors: string[];
} {
    try {
        const parsed = JSON.parse(exportedData);
        const validation = validateBackup(parsed);

        if (!validation.isValid) {
            return {
                valid: false,
                errors: [validation.error || "Unknown validation error"]
            };
        }

        const integrityErrors = validateDataIntegrity(parsed);

        return {
            valid: integrityErrors.length === 0,
            errors: integrityErrors
        };
    } catch (err) {
        return {
            valid: false,
            errors: [`Parse error: ${(err as Error).message}`]
        };
    }
}

/**
 * Transforms legacy stock record to current format
 * @param rec - Legacy stock record
 * @param activeId - Active account ID
 * @returns Transformed stock record
 */
export function transformLegacyStockToCurrent(rec: LegacyStockDb, activeId: number): StockDb {
    return transformLegacyStock(rec, activeId, DATE, isoDate);
}

/**
 * Transforms legacy booking record to current format
 * @param smTransfer - Legacy booking record
 * @param index - Index for ordering
 * @param activeId - Active account ID
 * @returns Transformed booking record
 */
export function transformLegacyBookingToCurrent(
    smTransfer: LegacyBookingDb,
    index: number,
    activeId: number
): BookingDb {
    return transformLegacyBooking(
        smTransfer,
        index,
        activeId,
        INDEXED_DB,
        isoDate
    );
}

/**
 * Validates export data arrays
 * @throws AppError if any data is invalid
 */
function validateExportData(
    accounts: AccountDb[],
    stocks: StockDb[],
    bookingTypes: BookingTypeDb[],
    bookings: BookingDb[]
): void {
    const errors: string[] = [];

    if (!Array.isArray(accounts)) errors.push("Invalid accounts data");
    if (!Array.isArray(stocks)) errors.push("Invalid stocks data");
    if (!Array.isArray(bookingTypes)) errors.push("Invalid booking types data");
    if (!Array.isArray(bookings)) errors.push("Invalid bookings data");

    if (errors.length > 0) {
        throw appError(
            ERROR_DEFINITIONS.IMPORT_EXPORT_SERVICE.H.CODE,
            ERROR_CATEGORY.VALIDATION,
            false
        );
    }
}

export function createImportExportService() {
    return {
        validateBackup: validateBackupData,
        validateDataIntegrity: validateDataIntegrityStatus,
        validateLegacyDataIntegrity: validateLegacyDataIntegrityStatus,
        readJsonFile,
        stringifyDatabase,
        verifyExportIntegrity,
        transformLegacyStock: transformLegacyStockToCurrent,
        transformLegacyBooking: transformLegacyBookingToCurrent
    };
}

export type ImportExportService = ReturnType<typeof createImportExportService>;
