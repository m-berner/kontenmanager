import { describe, expect, it } from 'vitest';
import { BookingValidator } from './bookingValidator';
describe('BookingValidator', () => {
    it('should validate and normalize a complete booking object', () => {
        const raw = {
            cID: '123',
            cBookDate: '2023-01-01',
            cExDate: '2023-01-02',
            cDebit: '100.50',
            cCredit: 200,
            cDescription: '  Test Description  ',
            cCount: '10',
            cBookingTypeID: '1',
            cAccountNumberID: 2,
            cStockID: '3',
            cSoliCredit: 0.5,
            cSoliDebit: '0.1',
            cTaxCredit: 1,
            cTaxDebit: 0,
            cFeeCredit: 5,
            cFeeDebit: 2,
            cSourceTaxCredit: 0,
            cSourceTaxDebit: 0,
            cTransactionTaxCredit: 0,
            cTransactionTaxDebit: 0,
            cMarketPlace: '  XETRA  '
        };
        const result = BookingValidator.validate(raw);
        expect(result.cID).toBe(123);
        expect(result.cBookDate).toBe('2023-01-01');
        expect(result.cDescription).toBe('Test Description');
        expect(result.cDebit).toBe(100.5);
        expect(result.cCredit).toBe(200);
        expect(result.cMarketPlace).toBe('XETRA');
        expect(result.cBookingTypeID).toBe(1);
    });
    it('should handle missing fields with defaults', () => {
        const raw = {
            cID: 1
        };
        const result = BookingValidator.validate(raw);
        expect(result.cID).toBe(1);
        expect(result.cDescription).toBe('');
        expect(result.cDebit).toBe(0);
        expect(result.cBookDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    it('should handle invalid numeric values', () => {
        const raw = {
            cDebit: 'invalid',
            cCredit: null,
            cCount: undefined
        };
        const result = BookingValidator.validate(raw);
        expect(result.cDebit).toBe(0);
        expect(result.cCredit).toBe(0);
        expect(result.cCount).toBe(0);
    });
});
