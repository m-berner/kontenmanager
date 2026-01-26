import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainLogic } from '@/domain/logic';
import { createPinia, setActivePinia } from 'pinia';
vi.mock('@/composables/useBrowser', () => ({
    useBrowser: () => ({
        getStorage: vi.fn().mockResolvedValue({}),
        setStorage: vi.fn().mockResolvedValue(undefined)
    })
}));
describe('DomainLogic', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });
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
            expect(DomainLogic.calculateTotalSum(bookings)).toBe(950);
        });
        it('should return 0 for empty bookings', () => {
            expect(DomainLogic.calculateTotalSum([])).toBe(0);
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
            expect(DomainLogic.calculateTotalSum(bookings)).toBe(394.5);
        });
    });
    describe('calculateSumFees', () => {
        it('should sum fees only for the specified year', () => {
            const bookings = [
                { cBookDate: '2024-01-01', cFeeDebit: 10, cFeeCredit: 0 },
                { cBookDate: '2024-06-01', cFeeDebit: 15, cFeeCredit: 0 },
                { cBookDate: '2023-12-31', cFeeDebit: 20, cFeeCredit: 0 }
            ];
            expect(DomainLogic.calculateSumFees(bookings, 2024)).toBe(-25);
        });
    });
    describe('initializeRecords', () => {
        it('should initialize records correctly', async () => {
            const storesDB = {
                accountsDB: [{ cID: 1, cSwift: 'S', cIban: 'I', cLogoUrl: 'L', cWithDepot: false }],
                bookingsDB: [],
                bookingTypesDB: [],
                stocksDB: []
            };
            const mockStores = {
                accounts: { clean: vi.fn(), add: vi.fn(), items: [{ cID: 1 }] },
                bookings: { clean: vi.fn(), add: vi.fn(), items: [] },
                bookingTypes: { clean: vi.fn(), add: vi.fn() },
                stocks: { clean: vi.fn(), add: vi.fn() },
                settings: { activeAccountId: 1 },
                alerts: { info: vi.fn() }
            };
            const messages = { title: 'Title', message: 'Message' };
            await DomainLogic.initializeRecords(storesDB, mockStores, messages);
            expect(mockStores.accounts.clean).toHaveBeenCalled();
            expect(mockStores.accounts.add).toHaveBeenCalledWith(storesDB.accountsDB[0]);
            expect(mockStores.stocks.add).toHaveBeenCalled();
        });
    });
});
