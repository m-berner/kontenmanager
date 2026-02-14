import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { INDEXED_DB } from "@/configs/database";
import { ImportExportValidator } from "@/domains/importExport/validator";
import { ImportExportTransformer } from "@/domains/importExport/transformer";
import { DATE } from "@/domains/configs/date";
const FILE_VALIDATION = {
    MAX_SIZE: 100 * 1024 * 1024,
    MIN_SIZE: 1
};
export class ImportExportService {
    transformer;
    constructor() {
        this.transformer = new ImportExportTransformer(INDEXED_DB, DATE, DomainUtils.isoDate);
    }
    static validateBackup(data) {
        return ImportExportValidator.validateBackup(data);
    }
    static validateDataIntegrity(backup) {
        return ImportExportValidator.validateDataIntegrity(backup);
    }
    static validateLegacyDataIntegrity(backup) {
        return ImportExportValidator.validateLegacyDataIntegrity(backup);
    }
    static async readJsonFile(blob) {
        FileValidator.validateBlob(blob);
        const text = await FileReader.readBlobAsText(blob);
        FileValidator.validateText(text);
        return JsonParser.parse(text);
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
        return JsonSerializer.stringify(exportData);
    }
    verifyExportIntegrity(exportedData) {
        try {
            const parsed = JSON.parse(exportedData);
            const validation = ImportExportValidator.validateBackup(parsed);
            if (!validation.isValid) {
                return {
                    valid: false,
                    errors: [validation.error || "Unknown validation error"]
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
    transformLegacyStock(rec, activeId) {
        return this.transformer.transformLegacyStock(rec, activeId);
    }
    transformLegacyBooking(smTransfer, index, activeId) {
        return this.transformer.transformLegacyBooking(smTransfer, index, activeId);
    }
    validateExportData(accounts, stocks, bookingTypes, bookings) {
        const errors = [];
        if (!Array.isArray(accounts))
            errors.push("Invalid accounts data");
        if (!Array.isArray(stocks))
            errors.push("Invalid stocks data");
        if (!Array.isArray(bookingTypes))
            errors.push("Invalid booking types data");
        if (!Array.isArray(bookings))
            errors.push("Invalid bookings data");
        if (errors.length > 0) {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.H, ERROR_CATEGORY.VALIDATION, false);
        }
    }
}
class FileValidator {
    static validateBlob(blob) {
        if (!blob || blob.size === 0) {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.A, ERROR_CATEGORY.VALIDATION, false);
        }
        if (blob.size > FILE_VALIDATION.MAX_SIZE) {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.B, ERROR_CATEGORY.VALIDATION, false);
        }
    }
    static validateText(text) {
        if (!text || text.trim().length === 0) {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.D, ERROR_CATEGORY.VALIDATION, false);
        }
    }
}
class FileReader {
    static async readBlobAsText(blob) {
        try {
            return await blob.text();
        }
        catch {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.C, ERROR_CATEGORY.VALIDATION, true);
        }
    }
}
class JsonParser {
    static parse(text) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.E, ERROR_CATEGORY.VALIDATION, true);
            }
            throw err;
        }
        if (!parsed || typeof parsed !== "object") {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.F, ERROR_CATEGORY.VALIDATION, false);
        }
        return parsed;
    }
}
class JsonSerializer {
    static stringify(data) {
        try {
            return JSON.stringify(data, null, 2);
        }
        catch {
            throw new AppError(ERROR_CODES.IMPORT_EXPORT_SERVICE.G, ERROR_CATEGORY.VALIDATION, true);
        }
    }
}
DomainUtils.log("SERVICES importExport");
