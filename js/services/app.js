import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database/service";
import { fetchService } from "@/services/fetch";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { CURRENCIES } from "@/domains/configs/currencies";
const { getUserLocale } = useBrowser();
export class AppService {
    records = useRecordsStore();
    settings = useSettingsStore();
    runtime = useRuntimeStore();
    storage = useStorage();
    fetch = fetchService;
    constructor() {
    }
    lastStatus = this.createDefaultStatus();
    async initializeApp(translations, signal) {
        const tAppStart = performance.now();
        DomainUtils.log("SERVICES app", { phase: "initializeApp", event: "start" });
        const status = this.createDefaultStatus();
        try {
            if (signal?.aborted) {
                return this.handleAbort(status);
            }
            await this.executePhase("initializeStorage", () => this.initializeStorage(signal), status, "storage", signal);
            if (signal?.aborted) {
                status.db = "aborted";
                this.lastStatus = status;
                return status;
            }
            await this.executePhase("initializeDatabase", () => this.initializeDatabase(translations, signal), status, "db", signal);
            if (signal?.aborted) {
                this.lastStatus = status;
                return status;
            }
            const tFetchStart = performance.now();
            status.fetch = await this.fetchExternalData(signal);
            this.logPhaseDuration("fetchExternalData", tFetchStart);
            this.logPhaseDuration("initializeApp", tAppStart);
            this.lastStatus = status;
            return status;
        }
        catch (err) {
            this.logPhaseDuration("initializeApp", tAppStart, err);
            this.lastStatus = status;
            if (signal?.aborted) {
                return this.handleAbort(status);
            }
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(ERROR_CODES.SERVICES.APP.OVERALL, ERROR_CATEGORY.BUSINESS, true);
        }
    }
    async reset() {
        DomainUtils.log("SERVICES Resetting application state");
        this.runtime.resetTeleport();
        this.runtime.clearStocksPages();
        this.records.$reset();
        DomainUtils.log("SERVICES Application state reset completed");
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
        return this.lastStatus ?? derived;
    }
    createDefaultStatus() {
        return {
            storage: "error",
            db: "error",
            fetch: { exchanges: false, indexes: false, materials: false }
        };
    }
    handleAbort(status) {
        status.storage = status.storage === "error" ? "aborted" : status.storage;
        status.db = "aborted";
        return status;
    }
    async executePhase(phaseName, phaseFunction, status, statusKey, signal) {
        const tStart = performance.now();
        await phaseFunction();
        status[statusKey] = signal?.aborted ? "aborted" : "ok";
        this.logPhaseDuration(phaseName, tStart);
    }
    logPhaseDuration(phase, startTime, error) {
        const durationMs = Math.round(performance.now() - startTime);
        const logData = { phase, durationMs };
        if (error) {
            logData.error = error;
            DomainUtils.log("SERVICES app", logData, "error");
        }
        else {
            DomainUtils.log("SERVICES app", logData);
        }
    }
    getCurrencyFromLocale() {
        const locale = getUserLocale().toLowerCase();
        const countryCode = locale.substring(3, 5);
        return CURRENCIES.CODE.get(countryCode);
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
        catch {
            throw new AppError(ERROR_CODES.SERVICES.APP.STORAGE, ERROR_CATEGORY.BUSINESS, false);
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
        const currency = this.getCurrencyFromLocale();
        if (!currency) {
            throw new AppError(ERROR_CODES.SERVICES.APP.CURRENCY, ERROR_CATEGORY.BUSINESS, false);
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
        catch {
            throw new AppError(ERROR_CODES.SERVICES.APP.DB, ERROR_CATEGORY.DATABASE, false);
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
        const currency = this.getCurrencyFromLocale();
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
            this.fetch.fetchExchangesData([...this.settings.exchanges]),
            this.fetch.fetchIndexData(),
            this.fetch.fetchMaterialData()
        ]);
        if (signal?.aborted) {
            return { exchanges: false, indexes: false, materials: false };
        }
        const exchangesOk = this.processFetchResult(exchangesBase, (data) => this.processExchangeBase(data), "baseExchanges") ||
            this.processFetchResult(exchangesInfo, (data) => this.processExchangeInfo(data), "exchanges");
        const indexesOk = this.processFetchResult(indexesInfo, (data) => this.processIndexesInfo(data), "indexes");
        const materialsOk = this.processFetchResult(materialsInfo, (data) => this.processMaterialsInfo(data), "materials");
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
    processFetchResult(result, processor, errorSection) {
        if (result.status === "fulfilled") {
            processor(result.value);
            return true;
        }
        const wrapped = new AppError(ERROR_CODES.SERVICES.APP.FETCH, ERROR_CATEGORY.NETWORK, true);
        DomainUtils.log("SERVICES app", { phase: "fetchExternalData", section: errorSection, error: wrapped }, "warn");
        return false;
    }
    processExchangeBase(baseData) {
        if (!baseData.length) {
            DomainUtils.log("SERVICES app: No base exchange data to process", null, "warn");
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
DomainUtils.log("SERVICES app", { phase: "module", event: "loaded" }, "info");
