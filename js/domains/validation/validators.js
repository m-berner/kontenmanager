import { ValidationRules } from './rules';
import { UtilsService } from '@/domains/utils';
export class DomainValidators {
    static validateBooking(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid booking data: Expected an object.');
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
            UtilsService.log('DomainValidators: Booking missing account ID', normalized, 'warn');
        }
        return normalized;
    }
    static validateAccount(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid account data');
        }
        const raw = data;
        const ibanRes = ValidationRules.validateIBAN(raw.cIban);
        if (!ibanRes.isValid) {
            UtilsService.log('DomainValidators: Invalid IBAN', raw.cIban, 'warn');
        }
        return {
            cID: Number(raw.cID ?? 0),
            cSwift: this.normalizeString(raw.cSwift).toUpperCase(),
            cIban: this.normalizeString(raw.cIban).replace(/\s/g, '').toUpperCase(),
            cLogoUrl: this.normalizeString(raw.cLogoUrl),
            cWithDepot: Boolean(raw.cWithDepot)
        };
    }
    static validateStock(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid stock data');
        }
        const raw = data;
        const isinRes = ValidationRules.validateISIN(raw.cISIN);
        if (!isinRes.isValid) {
            UtilsService.log('DomainValidators: Invalid ISIN', raw.cISIN, 'warn');
        }
        return {
            cID: Number(raw.cID ?? 0),
            cCompany: this.normalizeString(raw.cCompany),
            cISIN: this.normalizeString(raw.cISIN).replace(/\s/g, '').toUpperCase(),
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
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid booking type data');
        }
        const raw = data;
        return {
            cID: Number(raw.cID ?? 0),
            cName: UtilsService.normalizeBookingTypeName(this.normalizeString(raw.cName)),
            cAccountNumberID: Number(raw.cAccountNumberID ?? 0)
        };
    }
    static normalizeString(value) {
        if (typeof value !== 'string')
            return '';
        return value.trim();
    }
    static normalizeAmount(value) {
        const num = UtilsService.toNumber(value);
        return isFinite(num) ? num : 0;
    }
    static normalizeDate(value) {
        if (typeof value === 'string' && UtilsService.isValidISODate(value)) {
            return value;
        }
        if (typeof value === 'number') {
            try {
                return UtilsService.isoDate(value);
            }
            catch {
            }
        }
        return new Date().toISOString().substring(0, 10);
    }
}
