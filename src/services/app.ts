/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppStatus, ExchangeData} from "@/types";
import {useBrowser} from "@/composables/useBrowser";
import {useStorage} from "@/composables/useStorage";
import {useRecordsStore} from "@/stores/records";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {databaseService} from "@/services/database/service";
import {fetchService} from "@/services/fetch";
import {AppError, ERROR_CATEGORY, ERROR_CODES} from "@/domains/errors";
import {DomainUtils} from "@/domains/utils";
import {CURRENCIES} from "@/domains/configs/currencies";

const {getUserLocale} = useBrowser();

/**
 * Application initialization and bootstrapping service
 * Handles app startup, data loading, and external API coordination
 */
export class AppService {
    // Store references
    private records = useRecordsStore();
    private settings = useSettingsStore();
    private runtime = useRuntimeStore();

    // Composable references
    private storage = useStorage();
    private fetch = fetchService;

    constructor() {
        // Private constructor for the singleton pattern
    }

    /**
     * Application initialization status shape returned by initializeApp.
     */
    private lastStatus: AppStatus = this.createDefaultStatus();

    /**
     * Initialize the application by loading data from storage, database, and external APIs.
     * Critical operations (storage, database) will throw on failure unless aborted.
     * Non-critical operations (exchange rates, indexes, materials) fail gracefully.
     *
     * @param translations - Translation object for initializing records
     * @param signal - Optional AbortSignal to cancel initialization steps
     * @returns Status object indicating the outcome of each phase
     * @throws AppError if storage or database initialization fails (when not aborted)
     */
    async initializeApp(
        translations: Record<string, string>,
        signal?: AbortSignal
    ): Promise<AppStatus> {
        const tAppStart = performance.now();
        DomainUtils.log("SERVICES app", {phase: "initializeApp", event: "start"});

        const status = this.createDefaultStatus();

        try {
            // Abort guard before any work
            if (signal?.aborted) {
                return this.handleAbort(status);
            }

            // Step 1: Initialize storage (critical - will throw on failure)
            await this.executePhase(
                "initializeStorage",
                () => this.initializeStorage(signal),
                status,
                "storage",
                signal
            );

            if (signal?.aborted) {
                status.db = "aborted";
                this.lastStatus = status;
                return status;
            }

            // Step 2: Initialize the database (critical - will throw on failure)
            await this.executePhase(
                "initializeDatabase",
                () => this.initializeDatabase(translations, signal),
                status,
                "db",
                signal
            );

            if (signal?.aborted) {
                this.lastStatus = status;
                return status;
            }

            // Step 3: Fetch external data (non-critical - fails gracefully)
            const tFetchStart = performance.now();
            status.fetch = await this.fetchExternalData(signal);
            this.logPhaseDuration("fetchExternalData", tFetchStart);

            this.logPhaseDuration("initializeApp", tAppStart);
            this.lastStatus = status;
            return status;
        } catch (err) {
            this.logPhaseDuration("initializeApp", tAppStart, err);
            this.lastStatus = status;

            if (signal?.aborted) {
                return this.handleAbort(status);
            }

            if (err instanceof AppError) {
                throw err;
            }

            throw new AppError(
                ERROR_CODES.SERVICES.APP.OVERALL,
                ERROR_CATEGORY.BUSINESS,
                true
            );
        }
    }

    /**
     * Resets the application state (useful for testing or logout).
     *
     * @returns A promise that resolves when the reset is complete.
     */
    async reset(): Promise<void> {
        DomainUtils.log("SERVICES Resetting application state");

        // Clear runtime state
        this.runtime.resetTeleport();
        this.runtime.clearStocksPages();

        // Clear store state
        this.records.$reset();

        DomainUtils.log("SERVICES Application state reset completed");
    }

    /**
     * Gets the current initialization status of the application.
     *
     * @returns An object with boolean status flags for various subsystems.
     */
    getStatus(): AppStatus {
        // Reuse last known initializeApp status if present, otherwise derive a snapshot
        const derived: AppStatus = {
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

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * Creates a default status object with error states
     */
    private createDefaultStatus(): AppStatus {
        return {
            storage: "error",
            db: "error",
            fetch: {exchanges: false, indexes: false, materials: false}
        };
    }

    /**
     * Handles the abort scenario by marking remaining steps as aborted
     */
    private handleAbort(status: AppStatus): AppStatus {
        status.storage = status.storage === "error" ? "aborted" : status.storage;
        status.db = "aborted";
        return status;
    }

    /**
     * Executes a phase and updates status accordingly
     */
    private async executePhase(
        phaseName: string,
        phaseFunction: () => Promise<void>,
        status: AppStatus,
        statusKey: keyof Pick<AppStatus, "storage" | "db">,
        signal?: AbortSignal
    ): Promise<void> {
        const tStart = performance.now();
        await phaseFunction();
        status[statusKey] = signal?.aborted ? "aborted" : "ok";
        this.logPhaseDuration(phaseName, tStart);
    }

    /**
     * Logs phase duration with optional error
     */
    private logPhaseDuration(
        phase: string,
        startTime: number,
        error?: unknown
    ): void {
        const durationMs = Math.round(performance.now() - startTime);
        const logData: Record<string, unknown> = {phase, durationMs};

        if (error) {
            logData.error = error;
            DomainUtils.log("SERVICES app", logData, "error");
        } else {
            DomainUtils.log("SERVICES app", logData);
        }
    }

    /**
     * Extracts currency code from user locale
     */
    private getCurrencyFromLocale(): string | undefined {
        const locale = getUserLocale().toLowerCase();
        const countryCode = locale.substring(3, 5);
        return CURRENCIES.CODE.get(countryCode);
    }

    /**
     * Step 1: Initialize storage.
     * Fetches data from browser storage and initializes the settings store.
     *
     * @returns A promise that resolves when storage is initialized.
     */
    private async initializeStorage(signal?: AbortSignal): Promise<void> {
        DomainUtils.log("SERVICES app", {
            phase: "initializeStorage",
            event: "start"
        });

        if (signal?.aborted) return;

        try {
            const storageData = await this.storage.getStorage();
            if (signal?.aborted) return;
            this.settings.init(storageData);
        } catch {
            throw new AppError(
                ERROR_CODES.SERVICES.APP.STORAGE,
                ERROR_CATEGORY.BUSINESS,
                false
            );
        }

        DomainUtils.log("SERVICES app", {
            phase: "initializeStorage",
            event: "done"
        });
    }

    /**
     * Step 2: Initialize the database.
     * Connects to IndexedDB and initializes record stores.
     *
     * @param translations - Translation messages for initialization alerts.
     * @param signal - An optional abort signal.
     * @returns A promise that resolves when the database is initialized.
     */
    private async initializeDatabase(
        translations: Record<string, string>,
        signal?: AbortSignal
    ): Promise<void> {
        DomainUtils.log("SERVICES app", {
            phase: "initializeDatabase",
            event: "start"
        });

        const currency = this.getCurrencyFromLocale();
        if (!currency) {
            throw new AppError(
                ERROR_CODES.SERVICES.APP.CURRENCY,
                ERROR_CATEGORY.BUSINESS,
                false
            );
        }

        if (signal?.aborted) return;

        try {
            await databaseService.connect();
            if (signal?.aborted) return;

            const databaseStores = await databaseService.getAccountRecords(
                this.settings.activeAccountId
            );

            if (signal?.aborted) return;
            await this.records.init(databaseStores, translations);
        } catch {
            throw new AppError(
                ERROR_CODES.SERVICES.APP.DB,
                ERROR_CATEGORY.DATABASE,
                false
            );
        }

        DomainUtils.log("SERVICES app", {
            phase: "initializeDatabase",
            event: "done"
        });
    }

    /**
     * Step 3: Fetch external data (non-critical)
     */
    private async fetchExternalData(
        signal?: AbortSignal
    ): Promise<{ exchanges: boolean; indexes: boolean; materials: boolean }> {
        DomainUtils.log("SERVICES app", {
            phase: "fetchExternalData",
            event: "start"
        });

        const currency = this.getCurrencyFromLocale();
        if (!currency) {
            DomainUtils.log(
                "SERVICES app",
                {phase: "fetchExternalData", warning: "missing currency"},
                "warn"
            );
            return {exchanges: false, indexes: false, materials: false};
        }

        const currencyEUR = `${currency}${CURRENCIES.EUR}`;
        const currencyUSD = `${currency}${CURRENCIES.USD}`;

        if (signal?.aborted) {
            return {exchanges: false, indexes: false, materials: false};
        }

        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
            await Promise.allSettled([
                this.fetch.fetchExchangesData([currencyUSD, currencyEUR]),
                this.fetch.fetchExchangesData([...this.settings.exchanges]),
                this.fetch.fetchIndexData(),
                this.fetch.fetchMaterialData()
            ]);

        if (signal?.aborted) {
            return {exchanges: false, indexes: false, materials: false};
        }

        // Process successful fetches
        const baseExchangesOk = this.processFetchResult(
            exchangesBase,
            (data) => this.processExchangeBase(data),
            "baseExchanges"
        );

        const infoExchangesOk = this.processFetchResult(
            exchangesInfo,
            (data) => this.processExchangeInfo(data),
            "exchanges"
        );

        const exchangesOk = baseExchangesOk || infoExchangesOk;

        const indexesOk = this.processFetchResult(
            indexesInfo,
            (data) => this.processIndexesInfo(data),
            "indexes"
        );

        const materialsOk = this.processFetchResult(
            materialsInfo,
            (data) => this.processMaterialsInfo(data),
            "materials"
        );

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

    /**
     * Processes a fetch result and handles errors consistently
     */
    private processFetchResult<T>(
        result: PromiseSettledResult<T>,
        processor: (_data: T) => void,
        errorSection: string
    ): boolean {
        if (result.status === "fulfilled") {
            processor(result.value);
            return true;
        }

        const wrapped = new AppError(
            ERROR_CODES.SERVICES.APP.FETCH,
            ERROR_CATEGORY.NETWORK,
            true
        );
        DomainUtils.log(
            "SERVICES app",
            {phase: "fetchExternalData", section: errorSection, error: wrapped},
            "warn"
        );
        return false;
    }

    /**
     * Process base exchange rate data (USD and EUR)
     */
    private processExchangeBase(baseData: ExchangeData[]): void {
        if (!baseData.length) {
            DomainUtils.log(
                "SERVICES app: No base exchange data to process",
                null,
                "warn"
            );
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
            } else if (data.key.includes(CURRENCIES.EUR)) {
                this.runtime.curEur = data.value;
                DomainUtils.log("SERVICES app", {
                    phase: "processExchangeBase",
                    key: "EUR",
                    value: data.value
                });
            }
        });
    }

    /**
     * Process exchange rate information
     */
    private processExchangeInfo(infoData: ExchangeData[]): void {
        if (!infoData.length) {
            DomainUtils.log(
                "SERVICES app",
                {phase: "processExchangeInfo", warning: "no data"},
                "warn"
            );
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

    /**
     * Process stock index information
     */
    private processIndexesInfo(indexesData: ExchangeData[]): void {
        if (!indexesData.length) {
            DomainUtils.log(
                "SERVICES app",
                {phase: "processIndexesInfo", warning: "no data"},
                "warn"
            );
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

    /**
     * Process raw materials information
     */
    private processMaterialsInfo(materialsData: ExchangeData[]): void {
        if (!materialsData.length) {
            DomainUtils.log(
                "SERVICES app",
                {phase: "processMaterialsInfo", warning: "no data"},
                "warn"
            );
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

/**
 * Convenience function for app initialization
 * Use this in your main.ts or app setup
 */
export async function initializeApp(
    translations: Record<string, string>,
    signal?: AbortSignal
): Promise<AppStatus> {
    const appService = new AppService();
    return appService.initializeApp(translations, signal);
}

DomainUtils.log("SERVICES app", {phase: "module", event: "loaded"}, "info");
