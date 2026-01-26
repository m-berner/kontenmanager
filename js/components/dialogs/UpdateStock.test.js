import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { databaseService } from '@/services/database';
import { INDEXED_DB } from '@/config/database';
import { useStockForm } from '@/composables/useForms';
import { useStocksStore } from '@/stores/stocks';
import { useSettingsStore } from '@/stores/settings';
import { useRuntimeStore } from '@/stores/runtime';
const browserMock = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined)
        }
    },
    notifications: {
        create: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
        getURL: vi.fn().mockReturnValue(''),
        getManifest: vi.fn().mockReturnValue({ version: '1.0.0' })
    },
    i18n: {
        getUILanguage: vi.fn().mockReturnValue('de-DE')
    }
};
vi.stubGlobal('browser', browserMock);
describe('UpdateStock Logic Test', () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        vi.spyOn(databaseService, 'isConnected').mockReturnValue(true);
    });
    it('should update a stock and verify it reaches the database service', async () => {
        const { stockFormData, mapStockFormToDb } = useStockForm();
        const stocksStore = useStocksStore();
        const settings = useSettingsStore();
        const runtime = useRuntimeStore();
        settings.activeAccountId = 1;
        runtime.activeId = 123;
        const initialStock = {
            cID: 123,
            cISIN: 'US0378331002',
            cCompany: 'Apple Inc.',
            cSymbol: 'AAPL',
            cMeetingDay: '',
            cQuarterDay: '',
            cFadeOut: 0,
            cFirstPage: 0,
            cURL: '',
            cAccountNumberID: 1,
            cAskDates: '2025-01-01'
        };
        stocksStore.add(initialStock);
        stockFormData.id = 123;
        stockFormData.isin = 'US0378331002';
        stockFormData.company = 'Apple Updated';
        stockFormData.symbol = 'AAPL';
        stockFormData.fadeOut = 1;
        stockFormData.firstPage = 1;
        const updateSpy = vi.spyOn(databaseService, 'update').mockResolvedValue(123);
        const stockData = mapStockFormToDb(settings.activeAccountId);
        await databaseService.update(INDEXED_DB.STORE.STOCKS.NAME, stockData);
        stocksStore.update(stockData);
        expect(updateSpy).toHaveBeenCalledWith(INDEXED_DB.STORE.STOCKS.NAME, expect.objectContaining({
            cID: 123,
            cCompany: 'Apple Updated',
            cFadeOut: 1,
            cFirstPage: 1
        }));
        expect(stocksStore.items).toHaveLength(1);
        expect(stocksStore.items[0].cCompany).toBe('Apple Updated');
        expect(stocksStore.items[0].cFadeOut).toBe(1);
    });
});
