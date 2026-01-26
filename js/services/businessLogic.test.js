import { describe, expect, it } from 'vitest';
import { BusinessLogicService } from './businessLogic';
describe('BusinessLogicService', () => {
    describe('calculateTotalSum', () => {
        it('should calculate the correct total for a simple booking', () => {
            const bookings = [
                {
                    cCredit: 1000,
                    cDebit: 0,
                    cTaxDebit: 0,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 0,
                    cSoliCredit: 0,
                    cFeeDebit: 50,
                    cFeeCredit: 0
                }
            ];
            expect(BusinessLogicService.calculateTotalSum(bookings)).toBe(950);
        });
        it('should return 0 for empty bookings', () => {
            expect(BusinessLogicService.calculateTotalSum([])).toBe(0);
        });
        it('should handle complex bookings with taxes and fees', () => {
            const bookings = [
                {
                    cCredit: 500,
                    cDebit: 0,
                    cTaxDebit: 100,
                    cTaxCredit: 0,
                    cSourceTaxDebit: 0,
                    cSourceTaxCredit: 0,
                    cTransactionTaxDebit: 0,
                    cTransactionTaxCredit: 0,
                    cSoliDebit: 5.5,
                    cSoliCredit: 0,
                    cFeeDebit: 0,
                    cFeeCredit: 0
                }
            ];
            expect(BusinessLogicService.calculateTotalSum(bookings)).toBe(394.5);
        });
    });
    describe('calculateSumFees', () => {
        it('should sum fees only for the specified year', () => {
            const bookings = [
                { cBookDate: '2024-01-01', cFeeDebit: 10, cFeeCredit: 0 },
                { cBookDate: '2024-06-01', cFeeDebit: 15, cFeeCredit: 0 },
                { cBookDate: '2023-12-31', cFeeDebit: 20, cFeeCredit: 0 }
            ];
            expect(BusinessLogicService.calculateSumFees(bookings, 2024)).toBe(-25);
        });
    });
});
