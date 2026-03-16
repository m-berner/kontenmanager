/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import type {AppStatus, ExchangeData} from "@/types";
import {browserService} from "@/services/browserService";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {useRecordsStore} from "@/stores/records";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {databaseService} from "@/services/database/service";
import {fetchService} from "@/services/fetch";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domains/errors";
import {log} from "@/domains/utils/utils";
import {CURRENCIES, ERROR_CATEGORY} from "@/constants";

/**
 * Application initialization and bootstrapping service
 * Handles app startup, data loading, and external API coordination
 */

// Store references
type RecordsStore = ReturnType<typeof useRecordsStore>;
type SettingsStore = ReturnType<typeof useSettingsStore>;
type RuntimeStore = ReturnType<typeof useRuntimeStore>;

let records: RecordsStore | undefined;
let settings: SettingsStore | undefined;
let runtime: RuntimeStore | undefined;

/**
 * Initializes store references when needed.
 */
function getStores(): {
    records: RecordsStore;
    settings: SettingsStore;
    runtime: RuntimeStore;
} {
    if (!records) records = useRecordsStore();
    if (!settings) settings = useSettingsStore();
    if (!runtime) runtime = useRuntimeStore();

    // Fail fast if Pinia isn't set up; otherwise we'd propagate undefined.
    if (!records || !settings || !runtime) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.APP.OVERALL.CODE,
            ERROR_CATEGORY.STORE,
            false,
            {reason: "Pinia stores not initialized"}
        );
    }

    return {records, settings, runtime};
}

// Composable references
const storage = storageAdapter();
const fetch = fetchService;

/**
 * Application initialization status shape returned by initializeApp.
 */
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
    const rawLocale = browserService.getUserLocale();
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
        true
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
function processExchangeBase(baseData: ExchangeData[]): void {
    const {runtime} = getStores();
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
function processExchangeInfo(infoData: ExchangeData[]): void {
    const {runtime} = getStores();
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
function processIndexesInfo(indexesData: ExchangeData[]): void {
    const {runtime} = getStores();
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
function processMaterialsInfo(materialsData: ExchangeData[]): void {
    const {runtime} = getStores();
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
 * @returns A promise that resolves when storage is initialized.
 */
async function initializeStorage(signal?: AbortSignal): Promise<void> {
    log("SERVICES app", {
        phase: "initializeStorage",
        event: "start"
    });

    if (signal?.aborted) return;
    const {settings} = getStores();

    try {
        const storageData = await storage.getStorage();
        if (signal?.aborted) return;
        settings.init(storageData);
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
 * @param translations - Translation messages for initialization alerts.
 * @param signal - An optional abort signal.
 * @returns A promise that resolves when the database is initialized.
 */
async function initializeDatabase(
    translations: Record<string, string>,
    signal?: AbortSignal
): Promise<void> {
    const {records, settings} = getStores();
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
        await databaseService.connect();
        if (signal?.aborted) return;

        const databaseStores = await databaseService.getAccountRecords(
            settings.activeAccountId
        );

        if (signal?.aborted) return;
        await records.init(databaseStores, translations);
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
 * Step 3: Fetch external data (non-critical)
 */
async function fetchExternalData(
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

    const {settings} = getStores();
    const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
        await Promise.allSettled([
            fetch.fetchExchangesData([currencyUSD, currencyEUR]),
            fetch.fetchExchangesData([...settings.exchanges]),
            fetch.fetchIndexData(),
            fetch.fetchMaterialData()
        ]);

    if (signal?.aborted) {
        return {exchanges: false, indexes: false, materials: false};
    }

    // Process successful fetches
    const baseExchangesOk = processFetchResult(
        exchangesBase,
        (data) => processExchangeBase(data),
        "baseExchanges"
    );

    const infoExchangesOk = processFetchResult(
        exchangesInfo,
        (data) => processExchangeInfo(data),
        "exchanges"
    );

    const exchangesOk = baseExchangesOk || infoExchangesOk;

    const indexesOk = processFetchResult(
        indexesInfo,
        (_data) => indexesInfo.status === "fulfilled" ? processIndexesInfo(indexesInfo.value) : undefined,
        "indexes"
    );

    const materialsOk = processFetchResult(
        materialsInfo,
        (data) => processMaterialsInfo(data),
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
 * @param translations - Translation object for initializing records
 * @param signal - Optional AbortSignal to cancel initialization steps
 * @returns Status object indicating the outcome of each phase
 * @throws AppError if storage or database initialization fails (when not aborted)
 */
async function initializeApp(
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
            () => initializeStorage(signal),
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
            () => initializeDatabase(translations, signal),
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
        status.fetch = await fetchExternalData(signal);
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
 * @returns A promise that resolves when the reset is complete.
 */
async function reset(): Promise<void> {
    const {records, runtime} = getStores();
    log("SERVICES Resetting application state");

    // Clear runtime state
    runtime.resetTeleport();
    runtime.clearStocksPages();

    // Clear store state
    records.$reset();

    log("SERVICES Application state reset completed");
}

/**
 * Gets the current initialization status of the application.
 *
 * @returns An object with boolean status flags for various subsystems.
 */
function getStatus(): AppStatus {
    const {settings, runtime} = getStores();
    // Reuse last known initializeApp status if present, otherwise derive a snapshot
    const derived: AppStatus = {
        storage: settings.activeAccountId > 0 ? "ok" : "error",
        db: databaseService.isConnected() ? "ok" : "error",
        fetch: {
            exchanges: runtime.infoExchanges.size > 0,
            indexes: runtime.infoIndexes.size > 0,
            materials: runtime.infoMaterials.size > 0
        }
    };
    return lastStatusSnapshot ?? derived;
}

export const appService = {
    getStatus,
    initializeApp,
    reset
};
