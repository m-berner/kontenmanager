/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {
    AccountDb,
    AppMetadata,
    BackupData,
    BackupValidationResult,
    BookingDb,
    BookingTypeDb,
    ExportData,
    LegacyBookingDb,
    LegacyStockDb,
    StockDb
} from "@/types";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import {INDEXED_DB} from "@/configs/database";
import {ImportExportValidator} from "@/domains/importExport/validator";
import {ImportExportTransformer} from "@/domains/importExport/transformer";
import {DATE} from "@/domains/configs/date";

/**
 * Constants for file validation
 */
const FILE_VALIDATION = {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MIN_SIZE: 1
} as const;

/**
 * Service for handling import/export operations
 * Handles file reading, validation, transformation, and serialization
 */
export class ImportExportService {
    private readonly transformer: ImportExportTransformer;

    constructor() {
        this.transformer = new ImportExportTransformer(
            INDEXED_DB,
            DATE,
            DomainUtils.isoDate
        );
    }

    // ========================================================================
    // Static Validation Methods
    // ========================================================================

    /**
     * Validates backup data structure
     * @param data - Data to validate
     * @returns Validation result with errors if invalid
     */
    static validateBackup(data: unknown): BackupValidationResult {
        return ImportExportValidator.validateBackup(data);
    }

    /**
     * Validates data integrity (referential integrity, orphaned records, etc.)
     * @param backup - Backup data to validate
     * @returns Array of error messages (empty if valid)
     */
    static validateDataIntegrity(backup: BackupData): string[] {
        return ImportExportValidator.validateDataIntegrity(backup);
    }

    /**
     * Validates legacy data integrity
     * @param backup - Legacy backup data to validate
     * @returns Array of error messages (empty if valid)
     */
    static validateLegacyDataIntegrity(backup: BackupData): string[] {
        return ImportExportValidator.validateLegacyDataIntegrity(backup);
    }

    // ========================================================================
    // File Operations
    // ========================================================================

    /**
     * Reads and parses a JSON backup file
     * @param blob - File blob to read
     * @returns Parsed backup data
     * @throws AppError if the file is invalid or cannot be read
     */
    static async readJsonFile(blob: Blob): Promise<BackupData> {
        FileValidator.validateBlob(blob);

        const text = await FileReader.readBlobAsText(blob);
        FileValidator.validateText(text);

        return JsonParser.parse(text);
    }

    // ========================================================================
    // Export Operations
    // ========================================================================

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
    stringifyDatabase(
        sm: AppMetadata,
        accounts: AccountDb[],
        stocks: StockDb[],
        bookingTypes: BookingTypeDb[],
        bookings: BookingDb[]
    ): string {
        this.validateExportData(accounts, stocks, bookingTypes, bookings);

        const exportData = {
            sm,
            accounts,
            stocks,
            bookingTypes,
            bookings
        };

        return JsonSerializer.stringify(exportData);
    }

    /**
     * Verifies the integrity of exported data
     * @param exportedData - JSON string to verify
     * @returns Validation result with any errors found
     */
    verifyExportIntegrity(exportedData: string): {
        valid: boolean;
        errors: string[];
    } {
        try {
            const parsed = JSON.parse(exportedData);
            const validation = ImportExportValidator.validateBackup(parsed);

            if (!validation.isValid) {
                return {
                    valid: false,
                    errors: [validation.error || "Unknown validation error"]
                };
            }

            const integrityErrors =
                ImportExportValidator.validateDataIntegrity(parsed);

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

    // ========================================================================
    // Legacy Transformation
    // ========================================================================

    /**
     * Transforms legacy stock record to current format
     * @param rec - Legacy stock record
     * @param activeId - Active account ID
     * @returns Transformed stock record
     */
    transformLegacyStock(rec: LegacyStockDb, activeId: number): StockDb {
        return this.transformer.transformLegacyStock(rec, activeId);
    }

    /**
     * Transforms legacy booking record to current format
     * @param smTransfer - Legacy booking record
     * @param index - Index for ordering
     * @param activeId - Active account ID
     * @returns Transformed booking record
     */
    transformLegacyBooking(
        smTransfer: LegacyBookingDb,
        index: number,
        activeId: number
    ): BookingDb {
        return this.transformer.transformLegacyBooking(smTransfer, index, activeId);
    }

    // ========================================================================
    // Private Validation
    // ========================================================================

    /**
     * Validates export data arrays
     * @throws AppError if any data is invalid
     */
    private validateExportData(
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
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.H,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
    }
}

// ========================================================================
// Helper Classes
// ========================================================================

/**
 * File validation helper
 */
class FileValidator {
    static validateBlob(blob: Blob): void {
        if (!blob || blob.size === 0) {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.A,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        if (blob.size > FILE_VALIDATION.MAX_SIZE) {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.B,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
    }

    static validateText(text: string): void {
        if (text.trim().length === 0) {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.D,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }
    }
}

/**
 * File reading helper
 */
class FileReader {
    static async readBlobAsText(blob: Blob): Promise<string> {
        try {
            return await blob.text();
        } catch {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.C,
                ERROR_CATEGORY.VALIDATION,
                true
            );
        }
    }
}

/**
 * JSON parsing helper
 */
class JsonParser {
    static parse(text: string): BackupData {
        let parsed: unknown;

        try {
            parsed = JSON.parse(text);
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new AppError(
                    ERROR_CODES.IMPORT_EXPORT_SERVICE.E,
                    ERROR_CATEGORY.VALIDATION,
                    true
                );
            }
            throw err;
        }

        if (!parsed || typeof parsed !== "object") {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.F,
                ERROR_CATEGORY.VALIDATION,
                false
            );
        }

        return parsed as BackupData;
    }
}

/**
 * JSON serialization helper
 */
class JsonSerializer {
    static stringify(data: ExportData): string {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            throw new AppError(
                ERROR_CODES.IMPORT_EXPORT_SERVICE.G,
                ERROR_CATEGORY.VALIDATION,
                true
            );
        }
    }
}

DomainUtils.log("SERVICES importExport");
