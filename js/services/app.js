import { useBrowser } from '@/composables/useBrowser';
import { useStorage } from '@/composables/useStorage';
import { useRecordsStore } from '@/stores/records';
import { useSettingsStore } from '@/stores/settings';
import { useRuntimeStore } from '@/stores/runtime';
import { databaseService } from '@/services/database';
import { fetchService } from '@/services/fetch';
import { AppError } from '@/domains/errors';
import { UtilsService } from '@/domains/utils';
import { CURRENCIES } from '@/domains/config/currencies';
export class AppService {
    records = useRecordsStore();
    settings = useSettingsStore();
    runtime = useRuntimeStore();
    browser = useBrowser();
    storage = useStorage();
    fetch = fetchService;
    constructor() {
    }
    async initializeApp(translations) {
        UtilsService.log('Starting application initialization');
        try {
            await this.initializeStorage();
            await this.initializeDatabase(translations);
            await this.fetchExternalData();
            UtilsService.log('Application initialization completed successfully');
        }
        catch (error) {
            UtilsService.log('Application initialization failed', error, 'error');
            throw error;
        }
    }
    async reset() {
        UtilsService.log('Resetting application state');
        this.runtime.resetTeleport();
        this.runtime.clearStocksPages();
        this.records.$reset();
        UtilsService.log('Application state reset completed');
    }
    getStatus() {
        return {
            storageInitialized: this.settings.activeAccountId > 0,
            databaseConnected: databaseService.isConnected(),
            recordsLoaded: this.records.stocks.items.length > 0,
            exchangeRatesLoaded: this.runtime.curUsd > 0 && this.runtime.curEur > 0
        };
    }
    async initializeStorage() {
        UtilsService.log('Initializing storage...');
        const storageData = await this.storage.getStorage();
        this.settings.init(storageData);
        UtilsService.log('Storage initialized successfully');
    }
    async initializeDatabase(translations) {
        UtilsService.log('Initializing database...');
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            throw new AppError(`Unsupported UI language: ${this.browser.uiLanguage.value}`, 'APP_SERVICE', 'business', { language: this.browser.uiLanguage.value }, false);
        }
        await databaseService.connect();
        const databaseStores = await databaseService.getAccountRecords(this.settings.activeAccountId);
        await this.records.init(databaseStores, translations);
        UtilsService.log('Database initialized successfully');
    }
    async fetchExternalData() {
        UtilsService.log('Fetching external data...');
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            UtilsService.log('Cannot fetch external data without valid currency', null, 'warn');
            return;
        }
        const currencyEUR = `${currency}${CURRENCIES.EUR}`;
        const currencyUSD = `${currency}${CURRENCIES.USD}`;
        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] = await Promise.allSettled([
            this.fetch.fetchExchangesData([currencyUSD, currencyEUR]),
            this.fetch.fetchExchangesData(this.settings.exchanges),
            this.fetch.fetchIndexData(),
            this.fetch.fetchMaterialData()
        ]);
        if (exchangesBase.status === 'fulfilled') {
            this.processExchangeBase(exchangesBase.value);
        }
        else {
            UtilsService.log('Failed to fetch base exchange rates', exchangesBase.reason, 'warn');
        }
        if (exchangesInfo.status === 'fulfilled') {
            this.processExchangeInfo(exchangesInfo.value);
        }
        else {
            UtilsService.log('Failed to fetch exchange info', exchangesInfo.reason, 'warn');
        }
        if (indexesInfo.status === 'fulfilled') {
            this.processIndexesInfo(indexesInfo.value);
        }
        else {
            UtilsService.log('Failed to fetch index info', indexesInfo.reason, 'warn');
        }
        if (materialsInfo.status === 'fulfilled') {
            this.processMaterialsInfo(materialsInfo.value);
        }
        else {
            UtilsService.log('Failed to fetch materials info', materialsInfo.reason, 'warn');
        }
        UtilsService.log('External data fetch completed');
    }
    processExchangeBase(baseData) {
        if (!baseData.length) {
            UtilsService.log('No base exchange data to process', null, 'warn');
            return;
        }
        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                this.runtime.curUsd = data.value;
                UtilsService.log(`USD exchange rate: ${data.value}`);
            }
            else if (data.key.includes(CURRENCIES.EUR)) {
                this.runtime.curEur = data.value;
                UtilsService.log(`EUR exchange rate: ${data.value}`);
            }
        });
    }
    processExchangeInfo(infoData) {
        if (!infoData.length) {
            UtilsService.log('No exchange info to process', null, 'warn');
            return;
        }
        infoData.forEach((data) => {
            this.runtime.infoExchanges.set(data.key, data.value);
        });
        UtilsService.log(`Processed ${infoData.length} exchange rates`);
    }
    processIndexesInfo(indexesData) {
        if (!indexesData.length) {
            UtilsService.log('No index info to process', null, 'warn');
            return;
        }
        indexesData.forEach((data) => {
            this.runtime.infoIndexes.set(data.key, data.value);
        });
        UtilsService.log(`Processed ${indexesData.length} indexes`);
    }
    processMaterialsInfo(materialsData) {
        if (!materialsData.length) {
            UtilsService.log('No materials info to process', null, 'warn');
            return;
        }
        materialsData.forEach((data) => {
            this.runtime.infoMaterials.set(data.key, data.value);
        });
        UtilsService.log(`Processed ${materialsData.length} materials`);
    }
}
export async function initializeApp(translations) {
    const appService = new AppService();
    await appService.initializeApp(translations);
}
UtilsService.log('--- services/app.ts ---');
