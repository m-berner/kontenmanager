import { UtilsService } from '@/services/utils';
export class BookingValidator {
    static validate(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid booking data: Expected an object.');
        }
        const raw = data;
        return {
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
