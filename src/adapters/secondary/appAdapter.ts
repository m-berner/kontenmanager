/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CURRENCIES, ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domain/errors";
import type {AppStatus, ExchangeData, RecordsDbData, StorageDataType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import type {BrowserAdapter} from "@/adapters/secondary/browserAdapter";
import type {Service as DatabaseAdapter} from "@/adapters/secondary/database/databaseAdapter";
import type {FetchAdapter} from "@/adapters/secondary/fetchAdapter";
import type {storageAdapter} from "@/adapters/secondary/storageAdapter";

export type AppAdapter = ReturnType<typeof createAppAdapter>;

export type AppAdapterDeps = {
    browserAdapter: BrowserAdapter;
    storageAdapter: typeof storageAdapter;
    databaseAdapter: DatabaseAdapter;
    fetchAdapter: FetchAdapter;
};

export type AppStores = {
    records: {
        init: (_storesDB: RecordsDbData, _messages: Record<string, string>, _removeAccounts?: boolean) => Promise<void>;
        $reset: () => void;
    };
    settings: {
        init: (_storage: StorageDataType) => void;
        activeAccountId: number;
        exchanges: string[];
    };
    runtime: {
        curUsd: number;
        curEur: number;
        infoExchanges: Map<string, number>;
        infoIndexes: Map<string, number>;
        infoMaterials: Map<string, number>;
        resetTeleport: () => void;
        clearStocksPages: () => void;
    };
};

/**
 * Application initialization and bootstrapping service.
 * Handles app startup, data loading, and external API coordination.
 */
export function createAppAdapter(deps: AppAdapterDeps) {
    const {browserAdapter, storageAdapter, databaseAdapter, fetchAdapter} = deps;
    const storage = storageAdapter();
    const fetch = fetchAdapter;

    // Cached result of the last initializeApp call, used by getStatus.
    let lastStatusSnapshot: AppStatus | undefined;

    /**
     * Creates a default status object with error states
     */
    function createDefaultStatus(): AppStatus {
        return {
            storage: "error",
            db: "error",
            fetch: {exchanges: false, indexes: false, materials: false}
        };
    }

    /**
     * Handles the abort scenario by marking remaining steps as aborted
     */
    function handleAbort(status: AppStatus): AppStatus {
        status.storage = status.storage === "error" ? "aborted" : status.storage;
        status.db = "aborted";
        return status;
    }

    /**
     * Logs phase duration with optional error
     */
    function logPhaseDuration(
        phase: string,
        startTime: number,
        error?: unknown
    ): void {
        const durationMs = Math.round(performance.now() - startTime);
        const logData: Record<string, unknown> = {phase, durationMs};

        if (error) {
            logData.error = error;
            log("SERVICES app", logData, "error");
        } else {
            log("SERVICES app", logData);
        }
    }

    /**
     * Executes a phase and updates status accordingly
     */
    async function executePhase(
        phaseName: string,
        phaseFunction: () => Promise<void>,
        status: AppStatus,
        statusKey: keyof Pick<AppStatus, "storage" | "db">,
        signal?: AbortSignal
    ): Promise<void> {
        const tStart = performance.now();
        await phaseFunction();
        status[statusKey] = signal?.aborted ? "aborted" : "ok";
        logPhaseDuration(phaseName, tStart);
    }

    /**
     * Extracts currency code from user locale
     */
    function getCurrencyFromLocale(): string | undefined {
        const rawLocale = browserAdapter.getUserLocale();
        if (!rawLocale) {
            return undefined;
        }

        const normalizedLocale = rawLocale.replace(/_/g, "-");

        let regionCode: string | undefined;
        try {
            regionCode = new Intl.Locale(normalizedLocale).region?.toLowerCase();
        } catch (err) {
            void err;
            regionCode = undefined;
        }

        if (!regionCode) {
            const regionMatch = normalizedLocale.match(/-(\w{2})(?:-|$)/);
            regionCode = regionMatch?.[1]?.toLowerCase();
        }

        const languageCode = normalizedLocale
            .split("-")[0]
            ?.trim()
            .toLowerCase();

        return (
            (regionCode ? CURRENCIES.CODE.get(regionCode) : undefined) ??
            (languageCode ? CURRENCIES.CODE.get(languageCode) : undefined)
        );
    }

    /**
     * Processes a fetch result and handles errors consistently
     */
    function processFetchResult<T>(
        result: PromiseSettledResult<T>,
        processor: (_data: T) => void,
        errorSection: string
    ): boolean {
        if (result.status === "fulfilled") {
            processor(result.value);
            return true;
        }

        const wrapped = appError(
            ERROR_DEFINITIONS.SERVICES.APP.FETCH.CODE,
            ERROR_CATEGORY.NETWORK,
            true,
            {section: errorSection, originalError: serializeError(result.reason)}
        );
        log(
            "SERVICES app",
            {phase: "fetchExternalData", section: errorSection, error: wrapped},
            "warn"
        );
        return false;
    }

    /**
     * Process base exchange rate data (USD and EUR)
     */
    function processExchangeBase(runtime: AppStores["runtime"], baseData: ExchangeData[]): void {
        if (!baseData.length) {
            log(
                "SERVICES app: No base exchange data to process",
                null,
                "warn"
            );
            return;
        }

        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                runtime.curUsd = data.value;
                log("SERVICES app", {
                    phase: "processExchangeBase",
                    key: "USD",
                    value: data.value
                });
            } else if (data.key.includes(CURRENCIES.EUR)) {
                runtime.curEur = data.value;
                log("SERVICES app", {
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
    function processExchangeInfo(runtime: AppStores["runtime"], infoData: ExchangeData[]): void {
        if (!infoData.length) {
            log(
                "SERVICES app",
                {phase: "processExchangeInfo", warning: "no data"},
                "warn"
            );
            return;
        }

        infoData.forEach((data) => {
            runtime.infoExchanges.set(data.key, data.value);
        });

        log("SERVICES app", {
            phase: "processExchangeInfo",
            count: infoData.length
        });
    }

    /**
     * Process stock index information
     */
    function processIndexesInfo(runtime: AppStores["runtime"], indexesData: ExchangeData[]): void {
        if (!indexesData.length) {
            log(
                "SERVICES app",
                {phase: "processIndexesInfo", warning: "no data"},
                "warn"
            );
            return;
        }

        indexesData.forEach((data) => {
            runtime.infoIndexes.set(data.key, data.value);
        });

        log("SERVICES app", {
            phase: "processIndexesInfo",
            count: indexesData.length
        });
    }

    /**
     * Process raw materials information
     */
    function processMaterialsInfo(runtime: AppStores["runtime"], materialsData: ExchangeData[]): void {
        if (!materialsData.length) {
            log(
                "SERVICES app",
                {phase: "processMaterialsInfo", warning: "no data"},
                "warn"
            );
            return;
        }

        materialsData.forEach((data) => {
            runtime.infoMaterials.set(data.key, data.value);
        });

        log("SERVICES app", {
            phase: "processMaterialsInfo",
            count: materialsData.length
        });
    }

    /**
     * Step 1: Initialize storage.
     * Fetches data from browser storage and initializes the settings store.
     *
     * @param stores - App store instances used to seed initial state.
     * @param signal - An optional abort signal.
     */
    async function initializeStorage(
        stores: AppStores,
        signal?: AbortSignal
    ): Promise<void> {
        log("SERVICES app", {
            phase: "initializeStorage",
            event: "start"
        });

        if (signal?.aborted) return;

        try {
            const storageData = await storage.getStorage();
            if (signal?.aborted) return;
            stores.settings.init(storageData);
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.APP.STORAGE.CODE,
                ERROR_CATEGORY.BUSINESS,
                false,
                {originalError: serializeError(err)}
            );
        }

        log("SERVICES app", {
            phase: "initializeStorage",
            event: "done"
        });
    }

    /**
     * Step 2: Initialize the database.
     * Connects to IndexedDB and initializes record stores.
     *
     * @param stores - App store instances used to seed initial state.
     * @param translations - Translation messages for initialization alerts.
     * @param signal - An optional abort signal.
     */
    async function initializeDatabase(
        stores: AppStores,
        translations: Record<string, string>,
        signal?: AbortSignal
    ): Promise<void> {
        log("SERVICES app", {
            phase: "initializeDatabase",
            event: "start"
        });

        const currency = getCurrencyFromLocale();
        if (!currency) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.APP.CURRENCY.CODE,
                ERROR_CATEGORY.BUSINESS,
                false
            );
        }

        if (signal?.aborted) return;

        try {
            await databaseAdapter.connect();
            if (signal?.aborted) return;

            const databaseStores = await databaseAdapter.getAccountRecords(
                stores.settings.activeAccountId
            );

            if (signal?.aborted) return;
            await stores.records.init(databaseStores, translations);
        } catch (err) {
            throw appError(
                ERROR_DEFINITIONS.SERVICES.APP.DB.CODE,
                ERROR_CATEGORY.DATABASE,
                false,
                {originalError: serializeError(err)}
            );
        }

        log("SERVICES app", {
            phase: "initializeDatabase",
            event: "done"
        });
    }

    /**
     * Step 3: Fetch external data (non-critical, fails gracefully).
     * Fetches exchange rates, stock indexes, and material prices in parallel.
     *
     * @param stores - App store instances whose runtime state is updated.
     * @param signal - An optional abort signal.
     * @returns Status flags indicating which fetch categories succeeded.
     */
    async function fetchExternalData(
        stores: AppStores,
        signal?: AbortSignal
    ): Promise<{ exchanges: boolean; indexes: boolean; materials: boolean }> {
        log("SERVICES app", {
            phase: "fetchExternalData",
            event: "start"
        });

        const currency = getCurrencyFromLocale();
        if (!currency) {
            log(
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
                fetch.fetchExchangesData([currencyUSD, currencyEUR]),
                fetch.fetchExchangesData([...stores.settings.exchanges]),
                fetch.fetchIndexData(),
                fetch.fetchMaterialData()
            ]);

        if (signal?.aborted) {
            return {exchanges: false, indexes: false, materials: false};
        }

        const runtime = stores.runtime;

        const baseExchangesOk = processFetchResult(
            exchangesBase,
            (data) => processExchangeBase(runtime, data),
            "baseExchanges"
        );

        const infoExchangesOk = processFetchResult(
            exchangesInfo,
            (data) => processExchangeInfo(runtime, data),
            "exchanges"
        );

        const exchangesOk = baseExchangesOk || infoExchangesOk;

        const indexesOk = processFetchResult(
            indexesInfo,
            (data) => processIndexesInfo(runtime, data),
            "indexes"
        );

        const materialsOk = processFetchResult(
            materialsInfo,
            (data) => processMaterialsInfo(runtime, data),
            "materials"
        );

        log("SERVICES app", {
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
     * Initialize the application by loading data from storage, database, and external APIs.
     * Critical operations (storage, database) will throw on failure unless aborted.
     * Non-critical operations (exchange rates, indexes, materials) fail gracefully.
     *
     * @param stores - App store instances used throughout initialization.
     * @param translations - Translation object for initializing records.
     * @param signal - Optional AbortSignal to cancel initialization steps.
     * @returns Status object indicating the outcome of each phase.
     * @throws AppError if storage or database initialization fails (when not aborted).
     */
    async function initializeApp(
        stores: AppStores,
        translations: Record<string, string>,
        signal?: AbortSignal
    ): Promise<AppStatus> {
        const tAppStart = performance.now();
        log("SERVICES app", {phase: "initializeApp", event: "start"});

        const status = createDefaultStatus();

        try {
            // Abort guard before any work
            if (signal?.aborted) {
                return handleAbort(status);
            }

            // Step 1: Initialize storage (critical - will throw on failure)
            await executePhase(
                "initializeStorage",
                () => initializeStorage(stores, signal),
                status,
                "storage",
                signal
            );

            if (signal?.aborted) {
                status.db = "aborted";
                lastStatusSnapshot = status;
                return status;
            }

            // Step 2: Initialize the database (critical - will throw on failure)
            await executePhase(
                "initializeDatabase",
                () => initializeDatabase(stores, translations, signal),
                status,
                "db",
                signal
            );

            if (signal?.aborted) {
                lastStatusSnapshot = status;
                return status;
            }

            // Step 3: Fetch external data (non-critical - fails gracefully)
            const tFetchStart = performance.now();
            status.fetch = await fetchExternalData(stores, signal);
            logPhaseDuration("fetchExternalData", tFetchStart);

            logPhaseDuration("initializeApp", tAppStart);
            lastStatusSnapshot = status;
            return status;
        } catch (err) {
            logPhaseDuration("initializeApp", tAppStart, err);
            lastStatusSnapshot = status;

            if (signal?.aborted) {
                return handleAbort(status);
            }

            if (isAppError(err)) {
                throw err;
            }

            throw appError(
                ERROR_DEFINITIONS.SERVICES.APP.OVERALL.CODE,
                ERROR_CATEGORY.BUSINESS,
                true
            );
        }
    }

    /**
     * Resets the application state (useful for testing or logout).
     *
     * @param stores - App store instances to reset.
     */
    async function reset(stores: AppStores): Promise<void> {
        log("SERVICES app", {phase: "reset", event: "start"});

        stores.runtime.resetTeleport();
        stores.runtime.clearStocksPages();
        stores.records.$reset();

        log("SERVICES app", {phase: "reset", event: "done"});
    }

    /**
     * Returns the current initialization status of the application.
     * Reuses the last known result from initializeApp if available,
     * otherwise derives a live snapshot from store state.
     *
     * @param stores - App store instances used to derive the live snapshot.
     */
    function getStatus(stores: AppStores): AppStatus {
        // Reuse last known initializeApp status if present, otherwise derive a snapshot
        const dbOk = databaseAdapter.isConnected();
        const derived: AppStatus = {
            storage: dbOk ? "ok" : "error",
            db: dbOk ? "ok" : "error",
            fetch: {
                exchanges: stores.runtime.infoExchanges.size > 0,
                indexes: stores.runtime.infoIndexes.size > 0,
                materials: stores.runtime.infoMaterials.size > 0
            }
        };
        return lastStatusSnapshot ?? derived;
    }

    return {
        getStatus,
        initializeApp,
        reset
    };
}
