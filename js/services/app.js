import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database";
import { fetchService } from "@/services/fetch";
import { AppError, ERROR_CATEGORY, ERROR_CODES, serializeError } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { CURRENCIES } from "@/domains/config/currencies";
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
        DomainUtils.log("Starting application initialization");
        try {
            await this.initializeStorage();
            await this.initializeDatabase(translations);
            await this.fetchExternalData();
            DomainUtils.log("Application initialization completed successfully");
        }
        catch (err) {
            DomainUtils.log("Application initialization failed", err, "error");
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(ERROR_CODES.APP_SERVICE, ERROR_CATEGORY.BUSINESS, {
                input: serializeError(err),
                entity: "AppService",
                phase: "initializeApp"
            }, true);
        }
    }
    async reset() {
        DomainUtils.log("Resetting application state");
        this.runtime.resetTeleport();
        this.runtime.clearStocksPages();
        this.records.$reset();
        DomainUtils.log("Application state reset completed");
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
        DomainUtils.log("Initializing storage...");
        const storageData = await this.storage.getStorage();
        this.settings.init(storageData);
        DomainUtils.log("Storage initialized successfully");
    }
    async initializeDatabase(translations) {
        DomainUtils.log("Initializing database...");
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            throw new AppError(ERROR_CODES.APP_SERVICE, ERROR_CATEGORY.BUSINESS, { input: this.browser.uiLanguage.value, entity: "AppService" }, false);
        }
        await databaseService.connect();
        const databaseStores = await databaseService.getAccountRecords(this.settings.activeAccountId);
        await this.records.init(databaseStores, translations);
        DomainUtils.log("Database initialized successfully");
    }
    async fetchExternalData() {
        DomainUtils.log("Fetching external data...");
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            DomainUtils.log("Cannot fetch external data without valid currency", null, "warn");
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
        if (exchangesBase.status === "fulfilled") {
            this.processExchangeBase(exchangesBase.value);
        }
        else {
            DomainUtils.log("Failed to fetch base exchange rates", exchangesBase.reason, "warn");
        }
        if (exchangesInfo.status === "fulfilled") {
            this.processExchangeInfo(exchangesInfo.value);
        }
        else {
            DomainUtils.log("Failed to fetch exchange info", exchangesInfo.reason, "warn");
        }
        if (indexesInfo.status === "fulfilled") {
            this.processIndexesInfo(indexesInfo.value);
        }
        else {
            DomainUtils.log("Failed to fetch index info", indexesInfo.reason, "warn");
        }
        if (materialsInfo.status === "fulfilled") {
            this.processMaterialsInfo(materialsInfo.value);
        }
        else {
            DomainUtils.log("Failed to fetch materials info", materialsInfo.reason, "warn");
        }
        DomainUtils.log("External data fetch completed");
    }
    processExchangeBase(baseData) {
        if (!baseData.length) {
            DomainUtils.log("No base exchange data to process", null, "warn");
            return;
        }
        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                this.runtime.curUsd = data.value;
                DomainUtils.log(`USD exchange rate: ${data.value}`);
            }
            else if (data.key.includes(CURRENCIES.EUR)) {
                this.runtime.curEur = data.value;
                DomainUtils.log(`EUR exchange rate: ${data.value}`);
            }
        });
    }
    processExchangeInfo(infoData) {
        if (!infoData.length) {
            DomainUtils.log("No exchange info to process", null, "warn");
            return;
        }
        infoData.forEach((data) => {
            this.runtime.infoExchanges.set(data.key, data.value);
        });
        DomainUtils.log(`Processed ${infoData.length} exchange rates`);
    }
    processIndexesInfo(indexesData) {
        if (!indexesData.length) {
            DomainUtils.log("No index info to process", null, "warn");
            return;
        }
        indexesData.forEach((data) => {
            this.runtime.infoIndexes.set(data.key, data.value);
        });
        DomainUtils.log(`Processed ${indexesData.length} indexes`);
    }
    processMaterialsInfo(materialsData) {
        if (!materialsData.length) {
            DomainUtils.log("No materials info to process", null, "warn");
            return;
        }
        materialsData.forEach((data) => {
            this.runtime.infoMaterials.set(data.key, data.value);
        });
        DomainUtils.log(`Processed ${materialsData.length} materials`);
    }
}
export async function initializeApp(translations) {
    const appService = new AppService();
    await appService.initializeApp(translations);
}
DomainUtils.log("--- services/app.ts ---");
