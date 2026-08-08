/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import {CURRENCIES, ERROR_CATEGORY} from "@/domain/constants";
import {appError, ERROR_DEFINITIONS, isAppError, serializeError} from "@/domain/errors";
import type {AppStatus, ExchangeData, RecordsDbData, StorageDataType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import type {BrowserAdapter} from "@/adapters/driven/browserAdapter";
import type {Service as DatabaseAdapter} from "@/adapters/driven/database/databaseAdapter";
import type {FetchAdapter} from "@/adapters/driven/fetchAdapter";
import type {storageAdapter} from "@/adapters/driven/storageAdapter";

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
        clean: (_withAccounts?: boolean) => void;
    };
    settings: {
        init: (_storage: StorageDataType) => void;
        activeAccountId: number;
        exchanges: string[];
        service?: string;
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
     * Extracts the currency code from the user locale.
     *
     * Written defensively for arbitrary locale input, though its only current
     * input is `browserAdapter.getUserLocale()`, which clamps every locale to
     * `"de-DE"` or `"en-US"` — both well-formed, both with a region both
     * `Intl.Locale` resolves. So the `_`→`-` normalization has nothing to
     * normalize, the `try/catch` cannot throw, and the regex fallback is
     * unreachable. That is kept deliberately rather than trimmed to the
     * reachable path: these branches are the *right* logic in the wrong place,
     * and widening `getUserLocale`'s accepted set would make them live again,
     * whereas deleting them as dead code would throw away the fallback chain
     * such a change depends on.
     *
     * What was removed is the *language-code* fallback, because it was the one
     * branch that would have been wrong if revived. `CURRENCIES.CODE` is keyed
     * by lowercase **region** codes — `"at" -> EUR`, `"us" -> USD`, `"br" ->
     * BRL` — and contains no language keys at all. `get("de")` only ever
     * resolved by coincidence, Germany's region code happening to equal the
     * German language subtag, while `get("en")` returns `undefined` because no
     * country has region code `en`. Reviving it as written would have silently
     * given English-language users no currency; returning `undefined` for a
     * locale with no resolvable region is the honest answer.
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

        return regionCode ? CURRENCIES.CODE.get(regionCode) : undefined;
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

        // Keys are composed as `${localCurrency}${targetCurrency}` (see
        // fetchExternalData), so the target is the suffix. A local-currency
        // check via .includes() would misclassify e.g. "USDEUR" as USD
        // whenever the local currency itself is USD.
        baseData.forEach((data) => {
            if (data.key.endsWith(CURRENCIES.USD)) {
                runtime.curUsd = data.value;
                log("SERVICES app", {
                    phase: "processExchangeBase",
                    key: "USD",
                    value: data.value
                });
            } else if (data.key.endsWith(CURRENCIES.EUR)) {
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

        // No currency gate here any more. This function computed
        // getCurrencyFromLocale() purely to throw when it came back empty, then
        // never used the value — a hard failure of the *critical* database
        // phase for something only the *non-critical* Phase 3 needs, and Phase 3
        // already degrades gracefully on its own when the currency is missing.
        // (Unreachable in practice, since getUserLocale() clamps every locale to
        // "de-DE" or "en-US", but the coupling was backwards.)
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

        // In test/e2e scenarios we may disable external fetching by selecting
        // the special provider 'none'. When active, skip all external calls
        // gracefully to avoid noisy alerts and CORS errors in CI.
        if (stores.settings.service === "none") {
            log("SERVICES app", {phase: "fetchExternalData", info: "service=none; skipping"});
            return {exchanges: false, indexes: false, materials: false};
        }

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

        // Drop the self-pair. When the locale currency IS EUR (or USD), one of
        // the two codes above is "EUREUR" ("USDUSD") — a request asking
        // fx-rate.net to convert a currency to itself, whose answer is always 1.
        // That was one guaranteed-useless round trip on every app start, plus a
        // parse that could fail and log a partial-failure warning for a value
        // that never needed fetching. The matching runtime rate is seeded below
        // instead.
        const basePairs = [currencyUSD, currencyEUR].filter(
            (code) => code.substring(0, 3) !== code.substring(3, 6)
        );
        if (currency === CURRENCIES.USD) stores.runtime.curUsd = 1;
        if (currency === CURRENCIES.EUR) stores.runtime.curEur = 1;

        // Exclude from the info list anything the base list already covers.
        // BROWSER_STORAGE.EXCHANGES defaults to ["EURUSD"], which for a de-DE
        // install is exactly `currencyUSD` — so both calls requested the same
        // URL, and they could not share a cache entry: Promise.allSettled starts
        // them in the same tick and fetchWithCache has no in-flight
        // de-duplication (it checks getCache once, misses, and fetches;
        // setCache is only reached after the response resolves). The base
        // results for these codes are copied into infoExchanges below.
        const baseSet = new Set(basePairs);
        const infoPairs = [...stores.settings.exchanges].filter((code) => !baseSet.has(code));

        if (signal?.aborted) {
            return {exchanges: false, indexes: false, materials: false};
        }

        // Forward the signal: these four are the only calls app boot makes
        // unconditionally, and without cancellation an aborted startup left
        // them running (and retrying) against the network with nothing able to
        // stop them.
        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
            await Promise.allSettled([
                fetch.fetchExchangesData(basePairs, {signal}),
                fetch.fetchExchangesData(infoPairs, {signal}),
                fetch.fetchIndexData({signal}),
                fetch.fetchMaterialData({signal})
            ]);

        if (signal?.aborted) {
            return {exchanges: false, indexes: false, materials: false};
        }

        const runtime = stores.runtime;

        const baseExchangesOk = processFetchResult(
            exchangesBase,
            (data) => {
                processExchangeBase(runtime, data);
                // A base pair the user also has configured (the default
                // ["EURUSD"] IS the de-DE base USD pair) was excluded from the
                // info fetch above to avoid the duplicate request, so its
                // already-fetched value has to land in infoExchanges here or
                // InfoBar would render it blank. Written directly rather than
                // via processExchangeInfo, which logs a "no data" warning for
                // the (normal) empty case.
                const configured = new Set(stores.settings.exchanges);
                for (const entry of data) {
                    if (configured.has(entry.key)) {
                        runtime.infoExchanges.set(entry.key, entry.value);
                    }
                }
            },
            "baseExchanges"
        );

        const infoExchangesOk = processFetchResult(
            exchangesInfo,
            (data) => {
                // `infoPairs` is legitimately empty whenever every configured
                // exchange is already covered by the base pair — which is the
                // DEFAULT de-DE case, since BROWSER_STORAGE.EXCHANGES is
                // ["EURUSD"]. fetchExchangesData returns [] for an empty request
                // list, and that is not the "asked for rates and got none"
                // condition processExchangeInfo warns about, so calling it here
                // would log a spurious warning on every boot.
                if (infoPairs.length === 0) return;
                processExchangeInfo(runtime, data);
            },
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
            // Abort guard before any work.
            //
            // Caches the snapshot like every other exit path does. This one did
            // not, which mattered once `getStatus` started deriving live and
            // consulting the snapshot only for the `"aborted"` distinction: a
            // startup aborted before any work ran left no record that it was
            // aborted rather than failed.
            if (signal?.aborted) {
                lastStatusSnapshot = handleAbort(status);
                return lastStatusSnapshot;
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
        // `records.clean()`, not `$reset()`: useRecordsStore is a Pinia *setup*
        // store, and setup stores do not implement $reset() — Pinia throws on
        // the call. Nothing invokes reset() today, so this never fired, but the
        // dead code was also broken and would have failed immediately for
        // whoever wired it up.
        stores.records.clean();

        log("SERVICES app", {phase: "reset", event: "done"});
    }

    /**
     * Returns the application's current status, derived live from store and
     * connection state.
     *
     * **Derived first, snapshot second — this is the reverse of what it used to
     * do**, and the reversal is the point. The old body computed `derived` and
     * then returned `lastStatusSnapshot ?? derived`; since the snapshot is
     * assigned on *every* exit path of `initializeApp` (success, abort and the
     * catch), it is always set after boot and `derived` was always discarded.
     * The "otherwise derive a live snapshot" behaviour the comment described
     * was reachable only before the app had ever initialized. Wired to a status
     * indicator, that would have frozen at boot-time status and could never
     * reflect a later DB disconnect — which `connectionManager` explicitly
     * performs on `onversionchange`.
     *
     * The snapshot still contributes exactly one thing: `"aborted"`. A phase
     * that was aborted is indistinguishable from a failed one when observed
     * live (both are simply "not ok"), so a remembered `"aborted"` is preferred
     * over a live `"error"` — but never over a live `"ok"`, since a phase that
     * is working now is working now regardless of how boot went.
     *
     * @param stores - App store instances used to derive the live snapshot.
     */
    function getStatus(stores: AppStores): AppStatus {
        // Reuse last known initializeApp status if present, otherwise derive a snapshot.
        //
        // `storage` is reported from the settings store rather than from the
        // database connection: browser.storage.local and IndexedDB are
        // independent subsystems, and deriving one from the other claimed
        // storage was broken whenever the DB merely happened to be disconnected.
        // A non-sentinel activeAccountId means settings.init() ran, which is the
        // observable evidence that storage was read successfully.
        const dbOk = databaseAdapter.isConnected();
        const storageOk = stores.settings.activeAccountId !== -1;
        const derived: AppStatus = {
            storage: storageOk ? "ok" : "error",
            db: dbOk ? "ok" : "error",
            fetch: {
                exchanges: stores.runtime.infoExchanges.size > 0,
                indexes: stores.runtime.infoIndexes.size > 0,
                materials: stores.runtime.infoMaterials.size > 0
            }
        };
        if (!lastStatusSnapshot) {
            return derived;
        }

        const preferAborted = (
            live: AppStatus["storage"],
            remembered: AppStatus["storage"]
        ): AppStatus["storage"] => (live === "error" && remembered === "aborted" ? "aborted" : live);

        return {
            storage: preferAborted(derived.storage, lastStatusSnapshot.storage),
            db: preferAborted(derived.db, lastStatusSnapshot.db),
            fetch: derived.fetch
        };
    }

    return {
        getStatus,
        initializeApp,
        reset
    };
}
