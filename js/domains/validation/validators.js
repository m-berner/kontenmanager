import { ValidationRules } from "./rules";
import { DomainUtils } from "@/domains/utils";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
export class DomainValidators {
    static validateBooking(data) {
        if (typeof data !== "object" || data === null) {
            throw new AppError(ERROR_CODES.VALIDATION.A, ERROR_CATEGORY.VALIDATION, false);
        }
        const raw = data;
        const normalized = {
            cID: Number(raw.cID ?? 0),
            cBookDate: this.normalizeDate(raw.cBookDate),
            cExDate: this.normalizeDate(raw.cExDate),
            cDebit: this.normalizeAmount(raw.cDebit),
            cCredit: this.normalizeAmount(raw.cCredit),
            cDescription: this.normalizeString(raw.cDescription),
            cCount: this.normalizeAmount(raw.cCount),
            cBookingTypeID: Number(raw.cBookingTypeID ?? 0),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
            cStockID: Number(raw.cStockID ?? 0),
            cSoliCredit: this.normalizeAmount(raw.cSoliCredit),
            cSoliDebit: this.normalizeAmount(raw.cSoliDebit),
            cTaxCredit: this.normalizeAmount(raw.cTaxCredit),
            cTaxDebit: this.normalizeAmount(raw.cTaxDebit),
            cFeeCredit: this.normalizeAmount(raw.cFeeCredit),
            cFeeDebit: this.normalizeAmount(raw.cFeeDebit),
            cSourceTaxCredit: this.normalizeAmount(raw.cSourceTaxCredit),
            cSourceTaxDebit: this.normalizeAmount(raw.cSourceTaxDebit),
            cTransactionTaxCredit: this.normalizeAmount(raw.cTransactionTaxCredit),
            cTransactionTaxDebit: this.normalizeAmount(raw.cTransactionTaxDebit),
            cMarketPlace: this.normalizeString(raw.cMarketPlace)
        };
        if (normalized.cAccountNumberID === 0) {
            DomainUtils.log("DOMAINS VALIDATION validators: Booking missing account ID", normalized, "warn");
        }
        return normalized;
    }
    static validateAccount(data) {
        if (typeof data !== "object" || data === null) {
            throw new AppError(ERROR_CODES.VALIDATION.B, ERROR_CATEGORY.VALIDATION, false);
        }
        const raw = data;
        const ibanRes = ValidationRules.validateIBAN(raw.cIban);
        if (!ibanRes.isValid) {
            DomainUtils.log("DOMAINS VALIDATION validators: Invalid IBAN", raw.cIban, "warn");
        }
        return {
            cID: Number(raw.cID ?? 0),
            cSwift: this.normalizeString(raw.cSwift).toUpperCase(),
            cIban: this.normalizeString(raw.cIban).replace(/\s/g, "").toUpperCase(),
            cLogoUrl: this.normalizeString(raw.cLogoUrl),
            cWithDepot: Boolean(raw.cWithDepot)
        };
    }
    static validateStock(data) {
        if (typeof data !== "object" || data === null) {
            throw new AppError(ERROR_CODES.VALIDATION.C, ERROR_CATEGORY.VALIDATION, false);
        }
        const raw = data;
        const isinRes = ValidationRules.validateISIN(raw.cISIN);
        if (!isinRes.isValid) {
            DomainUtils.log("DOMAINS VALIDATION validators: Invalid ISIN", raw.cISIN, "warn");
        }
        return {
            cID: Number(raw.cID ?? 0),
            cCompany: this.normalizeString(raw.cCompany),
            cISIN: this.normalizeString(raw.cISIN).replace(/\s/g, "").toUpperCase(),
            cSymbol: this.normalizeString(raw.cSymbol).toUpperCase(),
            cFirstPage: Number(raw.cFirstPage ?? 0),
            cFadeOut: Number(raw.cFadeOut ?? 0),
            cMeetingDay: this.normalizeString(raw.cMeetingDay),
            cQuarterDay: this.normalizeString(raw.cQuarterDay),
            cURL: this.normalizeString(raw.cURL),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0),
            cAskDates: this.normalizeString(raw.cAskDates)
        };
    }
    static validateBookingType(data) {
        if (typeof data !== "object" || data === null) {
            throw new AppError(ERROR_CODES.VALIDATION.D, ERROR_CATEGORY.VALIDATION, false);
        }
        const raw = data;
        return {
            cID: Number(raw.cID ?? 0),
            cName: DomainUtils.normalizeBookingTypeName(this.normalizeString(raw.cName)),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0)
        };
    }
    static normalizeString(value) {
        if (typeof value !== "string")
            return "";
        return value.trim();
    }
    static normalizeAmount(value) {
        const num = DomainUtils.toNumber(value);
        return isFinite(num) ? num : 0;
    }
    static normalizeDate(value) {
        if (typeof value === "string" && DomainUtils.isValidISODate(value)) {
            return value;
        }
        if (typeof value === "number") {
            try {
                return DomainUtils.isoDate(value);
            }
            catch {
            }
        }
        return new Date().toISOString().substring(0, 10);
    }
}
