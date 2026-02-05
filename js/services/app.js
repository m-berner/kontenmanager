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
    _lastStatus = {
        storage: "error",
        db: "error",
        fetch: { exchanges: false, indexes: false, materials: false }
    };
    async initializeApp(translations, signal) {
        const tAppStart = performance.now();
        DomainUtils.log("SERVICES app", { phase: "initializeApp", event: "start" });
        const status = {
            storage: "error",
            db: "error",
            fetch: { exchanges: false, indexes: false, materials: false }
        };
        try {
            if (signal?.aborted) {
                status.storage = "aborted";
                status.db = "aborted";
                this._lastStatus = status;
                return status;
            }
            const tStorageStart = performance.now();
            await this.initializeStorage(signal);
            status.storage = signal?.aborted ? "aborted" : "ok";
            const storageDuration = Math.round(performance.now() - tStorageStart);
            DomainUtils.log("SERVICES app", {
                phase: "initializeStorage",
                durationMs: storageDuration
            });
            if (signal?.aborted) {
                status.db = "aborted";
                this._lastStatus = status;
                return status;
            }
            const tDbStart = performance.now();
            await this.initializeDatabase(translations, signal);
            status.db = signal?.aborted ? "aborted" : "ok";
            const dbDuration = Math.round(performance.now() - tDbStart);
            DomainUtils.log("SERVICES app", {
                phase: "initializeDatabase",
                durationMs: dbDuration
            });
            if (signal?.aborted) {
                this._lastStatus = status;
                return status;
            }
            const tFetchStart = performance.now();
            const fetchStatus = await this.fetchExternalData(signal);
            status.fetch = fetchStatus;
            const fetchDuration = Math.round(performance.now() - tFetchStart);
            DomainUtils.log("SERVICES app", {
                phase: "fetchExternalData",
                durationMs: fetchDuration
            });
            const appDuration = Math.round(performance.now() - tAppStart);
            DomainUtils.log("SERVICES app", {
                phase: "initializeApp",
                durationMs: appDuration
            });
            this._lastStatus = status;
            return status;
        }
        catch (err) {
            const appDuration = Math.round(performance.now() - tAppStart);
            DomainUtils.log("SERVICES app", { phase: "initializeApp", durationMs: appDuration, error: err }, "error");
            this._lastStatus = status;
            if (signal?.aborted) {
                status.storage =
                    status.storage === "error" ? "aborted" : status.storage;
                status.db = "aborted";
                return status;
            }
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(ERROR_CODES.SERVICES.APP.OVERALL, ERROR_CATEGORY.BUSINESS, {
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
        const derived = {
            storage: this.settings.activeAccountId > 0 ? "ok" : "error",
            db: databaseService.isConnected() ? "ok" : "error",
            fetch: {
                exchanges: this.runtime.infoExchanges.size > 0,
                indexes: this.runtime.infoIndexes.size > 0,
                materials: this.runtime.infoMaterials.size > 0
            }
        };
        return this._lastStatus ?? derived;
    }
    async initializeStorage(signal) {
        DomainUtils.log("SERVICES app", {
            phase: "initializeStorage",
            event: "start"
        });
        if (signal?.aborted)
            return;
        try {
            const storageData = await this.storage.getStorage();
            if (signal?.aborted)
                return;
            this.settings.init(storageData);
        }
        catch (err) {
            throw new AppError(ERROR_CODES.SERVICES.APP.STORAGE, ERROR_CATEGORY.BUSINESS, {
                input: serializeError(err),
                entity: "AppService",
                phase: "initializeStorage"
            }, false);
        }
        DomainUtils.log("SERVICES app", {
            phase: "initializeStorage",
            event: "done"
        });
    }
    async initializeDatabase(translations, signal) {
        DomainUtils.log("SERVICES app", {
            phase: "initializeDatabase",
            event: "start"
        });
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            throw new AppError(ERROR_CODES.SERVICES.APP.CURRENCY, ERROR_CATEGORY.BUSINESS, {
                input: this.browser.uiLanguage.value,
                entity: "AppService",
                phase: "initializeDatabase"
            }, false);
        }
        if (signal?.aborted)
            return;
        try {
            await databaseService.connect();
            if (signal?.aborted)
                return;
            const databaseStores = await databaseService.getAccountRecords(this.settings.activeAccountId);
            if (signal?.aborted)
                return;
            await this.records.init(databaseStores, translations);
        }
        catch (err) {
            throw new AppError(ERROR_CODES.SERVICES.APP.DB, ERROR_CATEGORY.DATABASE, {
                input: serializeError(err),
                entity: "AppService",
                phase: "initializeDatabase"
            }, false);
        }
        DomainUtils.log("SERVICES app", {
            phase: "initializeDatabase",
            event: "done"
        });
    }
    async fetchExternalData(signal) {
        DomainUtils.log("SERVICES app", {
            phase: "fetchExternalData",
            event: "start"
        });
        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
        if (!currency) {
            DomainUtils.log("SERVICES app", { phase: "fetchExternalData", warning: "missing currency" }, "warn");
            return { exchanges: false, indexes: false, materials: false };
        }
        const currencyEUR = `${currency}${CURRENCIES.EUR}`;
        const currencyUSD = `${currency}${CURRENCIES.USD}`;
        if (signal?.aborted) {
            return { exchanges: false, indexes: false, materials: false };
        }
        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] = await Promise.allSettled([
            this.fetch.fetchExchangesData([currencyUSD, currencyEUR]),
            this.fetch.fetchExchangesData(this.settings.exchanges),
            this.fetch.fetchIndexData(),
            this.fetch.fetchMaterialData()
        ]);
        if (signal?.aborted) {
            return { exchanges: false, indexes: false, materials: false };
        }
        let exchangesOk = false;
        let indexesOk = false;
        let materialsOk = false;
        if (exchangesBase.status === "fulfilled") {
            this.processExchangeBase(exchangesBase.value);
            exchangesOk = true;
        }
        else {
            const wrapped = new AppError(ERROR_CODES.SERVICES.APP.FETCH, ERROR_CATEGORY.NETWORK, {
                input: serializeError(exchangesBase.reason),
                entity: "AppService",
                section: "baseExchanges",
                phase: "fetchExternalData"
            }, true);
            DomainUtils.log("SERVICES app", {
                phase: "fetchExternalData",
                section: "baseExchanges",
                error: wrapped
            }, "warn");
        }
        if (exchangesInfo.status === "fulfilled") {
            this.processExchangeInfo(exchangesInfo.value);
            exchangesOk = true;
        }
        else {
            const wrapped = new AppError(ERROR_CODES.SERVICES.APP.FETCH, ERROR_CATEGORY.NETWORK, {
                input: serializeError(exchangesInfo.reason),
                entity: "AppService",
                section: "exchanges",
                phase: "fetchExternalData"
            }, true);
            DomainUtils.log("SERVICES app", { phase: "fetchExternalData", section: "exchanges", error: wrapped }, "warn");
        }
        if (indexesInfo.status === "fulfilled") {
            this.processIndexesInfo(indexesInfo.value);
            indexesOk = true;
        }
        else {
            const wrapped = new AppError(ERROR_CODES.SERVICES.APP.FETCH, ERROR_CATEGORY.NETWORK, {
                input: serializeError(indexesInfo.reason),
                entity: "AppService",
                section: "indexes",
                phase: "fetchExternalData"
            }, true);
            DomainUtils.log("SERVICES app", { phase: "fetchExternalData", section: "indexes", error: wrapped }, "warn");
        }
        if (materialsInfo.status === "fulfilled") {
            this.processMaterialsInfo(materialsInfo.value);
            materialsOk = true;
        }
        else {
            const wrapped = new AppError(ERROR_CODES.SERVICES.APP.FETCH, ERROR_CATEGORY.NETWORK, {
                input: serializeError(materialsInfo.reason),
                entity: "AppService",
                section: "materials",
                phase: "fetchExternalData"
            }, true);
            DomainUtils.log("SERVICES app", { phase: "fetchExternalData", section: "materials", error: wrapped }, "warn");
        }
        DomainUtils.log("SERVICES app", {
            phase: "fetchExternalData",
            event: "done"
        });
        return {
            exchanges: exchangesOk,
            indexes: indexesOk,
            materials: materialsOk
        };
    }
    processExchangeBase(baseData) {
        if (!baseData.length) {
            DomainUtils.log("No base exchange data to process", null, "warn");
            return;
        }
        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                this.runtime.curUsd = data.value;
                DomainUtils.log("SERVICES app", {
                    phase: "processExchangeBase",
                    key: "USD",
                    value: data.value
                });
            }
            else if (data.key.includes(CURRENCIES.EUR)) {
                this.runtime.curEur = data.value;
                DomainUtils.log("SERVICES app", {
                    phase: "processExchangeBase",
                    key: "EUR",
                    value: data.value
                });
            }
        });
    }
    processExchangeInfo(infoData) {
        if (!infoData.length) {
            DomainUtils.log("SERVICES app", { phase: "processExchangeInfo", warning: "no data" }, "warn");
            return;
        }
        infoData.forEach((data) => {
            this.runtime.infoExchanges.set(data.key, data.value);
        });
        DomainUtils.log("SERVICES app", {
            phase: "processExchangeInfo",
            count: infoData.length
        });
    }
    processIndexesInfo(indexesData) {
        if (!indexesData.length) {
            DomainUtils.log("SERVICES app", { phase: "processIndexesInfo", warning: "no data" }, "warn");
            return;
        }
        indexesData.forEach((data) => {
            this.runtime.infoIndexes.set(data.key, data.value);
        });
        DomainUtils.log("SERVICES app", {
            phase: "processIndexesInfo",
            count: indexesData.length
        });
    }
    processMaterialsInfo(materialsData) {
        if (!materialsData.length) {
            DomainUtils.log("SERVICES app", { phase: "processMaterialsInfo", warning: "no data" }, "warn");
            return;
        }
        materialsData.forEach((data) => {
            this.runtime.infoMaterials.set(data.key, data.value);
        });
        DomainUtils.log("SERVICES app", {
            phase: "processMaterialsInfo",
            count: materialsData.length
        });
    }
}
export async function initializeApp(translations, signal) {
    const appService = new AppService();
    return appService.initializeApp(translations, signal);
}
DomainUtils.log("SERVICES app", { phase: "module", event: "loaded" });
