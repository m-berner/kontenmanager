import { AppError } from '@/domains/errors';
import { UtilsService } from '@/domains/utils';
import { INDEXED_DB } from '@/config/database';
import { SYSTEM } from '@/domains/config/system';
import { ImportExportValidator } from '@/domains/importExport/validator';
import { ImportExportTransformer } from '@/domains/importExport/transformer';
import { DATE } from '@/domains/config/date';
export class ImportExportService {
    _transformer;
    constructor() {
        this._transformer = new ImportExportTransformer(INDEXED_DB, DATE, UtilsService.isoDate);
    }
    static validateBackup(data) {
        return ImportExportValidator.validateBackup(data);
    }
    static async readJsonFile(blob) {
        if (!blob || blob.size === 0) {
            throw new AppError('Empty or invalid file', 'EMPTY_FILE', SYSTEM.ERROR_CATEGORY.VALIDATION, {}, false);
        }
        const MAX_SIZE = 100 * 1024 * 1024;
        if (blob.size > MAX_SIZE) {
            throw new AppError('File too large', 'FILE_TOO_LARGE', SYSTEM.ERROR_CATEGORY.VALIDATION, { size: blob.size, maxSize: MAX_SIZE }, false);
        }
        let text;
        try {
            text = await blob.text();
        }
        catch (err) {
            throw new AppError('Failed to read file', 'READ_FAILED', SYSTEM.ERROR_CATEGORY.VALIDATION, { originalError: err }, true);
        }
        if (!text || text.trim().length === 0) {
            throw new AppError('File contains no data', 'NO_DATA', SYSTEM.ERROR_CATEGORY.VALIDATION, {}, false);
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new AppError(`Invalid JSON format: ${err.message}`, 'INVALID_JSON', SYSTEM.ERROR_CATEGORY.VALIDATION, { originalError: err }, true);
            }
            throw err;
        }
        if (!parsed || typeof parsed !== 'object') {
            throw new AppError('Invalid JSON structure', 'INVALID_STRUCTURE', SYSTEM.ERROR_CATEGORY.VALIDATION, {}, false);
        }
        return parsed;
    }
    stringifyDatabase(sm, accounts, stocks, bookingTypes, bookings) {
        this.validateExportData(accounts, stocks, bookingTypes, bookings);
        const exportData = {
            sm,
            accounts,
            stocks,
            bookingTypes,
            bookings
        };
        try {
            return JSON.stringify(exportData, null, 2);
        }
        catch (err) {
            throw new AppError('Failed to serialize data', 'SERIALIZE_FAILED', SYSTEM.ERROR_CATEGORY.VALIDATION, { originalError: err }, true);
        }
    }
    verifyExportIntegrity(exportedData) {
        try {
            const parsed = JSON.parse(exportedData);
            const validation = ImportExportValidator.validateBackup(parsed);
            if (!validation.isValid) {
                return {
                    valid: false,
                    errors: [validation.error || 'Unknown validation error']
                };
            }
            const integrityErrors = ImportExportValidator.validateDataIntegrity(parsed);
            return {
                valid: integrityErrors.length === 0,
                errors: integrityErrors
            };
        }
        catch (err) {
            return {
                valid: false,
                errors: [`Parse error: ${err.message}`]
            };
        }
    }
    validateDataIntegrity(backup) {
        return ImportExportValidator.validateDataIntegrity(backup);
    }
    validateLegacyDataIntegrity(backup) {
        return ImportExportValidator.validateLegacyDataIntegrity(backup);
    }
    transformLegacyStock(rec, activeId) {
        return this._transformer.transformLegacyStock(rec, activeId);
    }
    transformLegacyBooking(smTransfer, index, activeId) {
        return this._transformer.transformLegacyBooking(smTransfer, index, activeId);
    }
    validateExportData(accounts, stocks, bookingTypes, bookings) {
        const errors = [];
        if (!Array.isArray(accounts))
            errors.push('Invalid accounts data');
        if (!Array.isArray(stocks))
            errors.push('Invalid stocks data');
        if (!Array.isArray(bookingTypes))
            errors.push('Invalid booking types data');
        if (!Array.isArray(bookings))
            errors.push('Invalid bookings data');
        if (errors.length > 0) {
            throw new AppError('Export data validation failed', 'VALIDATION_FAILED', SYSTEM.ERROR_CATEGORY.VALIDATION, { ieError: errors }, false);
        }
    }
}
UtilsService.log('--- services/importExport.ts ---');
