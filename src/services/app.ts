/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type { AppStatus, ExchangeData } from "@/types";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database";
import { fetchService } from "@/services/fetch";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES,
  serializeError
} from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { CURRENCIES } from "@/domains/config/currencies";

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
  private browser = useBrowser();
  private storage = useStorage();
  private fetch = fetchService;

  constructor() {
    // Private constructor for the singleton pattern
  }

  /**
   * Application initialization status shape returned by initializeApp.
   */
  private _lastStatus: AppStatus = {
    storage: "error",
    db: "error",
    fetch: { exchanges: false, indexes: false, materials: false }
  };

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
    DomainUtils.log("SERVICES app", { phase: "initializeApp", event: "start" });

    // local mutable status we also persist to _lastStatus at the end
    const status: AppStatus = {
      storage: "error",
      db: "error",
      fetch: { exchanges: false, indexes: false, materials: false }
    };

    try {
      // Abort guard before any work
      if (signal?.aborted) {
        status.storage = "aborted";
        status.db = "aborted";
        this._lastStatus = status;
        return status;
      }

      // Step 1: Initialize storage (critical - will throw on failure)
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

      // Step 2: Initialize the database (critical - will throw on failure)
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

      // Step 3: Fetch external data (non-critical - fails gracefully)
      const tFetchStart = performance.now();
      status.fetch = await this.fetchExternalData(signal);
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
    } catch (err) {
      const appDuration = Math.round(performance.now() - tAppStart);
      DomainUtils.log(
        "SERVICES app",
        { phase: "initializeApp", durationMs: appDuration, error: err },
        "error"
      );

      // Persist whatever partial status we have before throwing
      this._lastStatus = status;

      if (signal?.aborted) {
        // Treat as aborted without throwing an AppError
        status.storage =
          status.storage === "error" ? "aborted" : status.storage;
        status.db = "aborted";
        return status;
      }

      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(
        ERROR_CODES.SERVICES.APP.OVERALL,
        ERROR_CATEGORY.BUSINESS,
        {
          input: serializeError(err),
          entity: "AppService",
          phase: "initializeApp"
        },
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
    DomainUtils.log("Resetting application state");

    // Clear runtime state
    this.runtime.resetTeleport();
    this.runtime.clearStocksPages();

    // Clear store state
    this.records.$reset();

    DomainUtils.log("Application state reset completed");
  }

  /**
   * Gets the current initialization status of the application.
   *
   * @returns An object with boolean status flags for various subsystems.
   */
  getStatus() {
    // Reuse last known initializeApp status if present, otherwise derive a snapshot
    const derived = {
      storage: this.settings.activeAccountId > 0 ? "ok" : "error",
      db: databaseService.isConnected() ? "ok" : "error",
      fetch: {
        exchanges: this.runtime.infoExchanges.size > 0,
        indexes: this.runtime.infoIndexes.size > 0,
        materials: this.runtime.infoMaterials.size > 0
      }
    } as const;
    return this._lastStatus ?? derived;
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
    } catch (err) {
      throw new AppError(
        ERROR_CODES.SERVICES.APP.STORAGE,
        ERROR_CATEGORY.BUSINESS,
        {
          input: serializeError(err),
          entity: "AppService",
          phase: "initializeStorage"
        },
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

    const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
    if (!currency) {
      throw new AppError(
        ERROR_CODES.SERVICES.APP.CURRENCY,
        ERROR_CATEGORY.BUSINESS,
        {
          input: this.browser.uiLanguage.value,
          entity: "AppService",
          phase: "initializeDatabase"
        },
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
    } catch (err) {
      throw new AppError(
        ERROR_CODES.SERVICES.APP.DB,
        ERROR_CATEGORY.DATABASE,
        {
          input: serializeError(err),
          entity: "AppService",
          phase: "initializeDatabase"
        },
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

    const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value);
    if (!currency) {
      DomainUtils.log(
        "SERVICES app",
        { phase: "fetchExternalData", warning: "missing currency" },
        "warn"
      );
      return { exchanges: false, indexes: false, materials: false };
    }

    const currencyEUR = `${currency}${CURRENCIES.EUR}`;
    const currencyUSD = `${currency}${CURRENCIES.USD}`;

    if (signal?.aborted) {
      return { exchanges: false, indexes: false, materials: false };
    }

    const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
      await Promise.allSettled([
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

    // Process successful fetches
    if (exchangesBase.status === "fulfilled") {
      this.processExchangeBase(exchangesBase.value);
      exchangesOk = true;
    } else {
      const wrapped = new AppError(
        ERROR_CODES.SERVICES.APP.FETCH,
        ERROR_CATEGORY.NETWORK,
        {
          input: serializeError(exchangesBase.reason as any),
          entity: "AppService",
          section: "baseExchanges",
          phase: "fetchExternalData"
        },
        true
      );
      DomainUtils.log(
        "SERVICES app",
        {
          phase: "fetchExternalData",
          section: "baseExchanges",
          error: wrapped
        },
        "warn"
      );
    }

    if (exchangesInfo.status === "fulfilled") {
      this.processExchangeInfo(exchangesInfo.value);
      exchangesOk = true;
    } else {
      const wrapped = new AppError(
        ERROR_CODES.SERVICES.APP.FETCH,
        ERROR_CATEGORY.NETWORK,
        {
          input: serializeError(exchangesInfo.reason as any),
          entity: "AppService",
          section: "exchanges",
          phase: "fetchExternalData"
        },
        true
      );
      DomainUtils.log(
        "SERVICES app",
        { phase: "fetchExternalData", section: "exchanges", error: wrapped },
        "warn"
      );
    }

    if (indexesInfo.status === "fulfilled") {
      this.processIndexesInfo(indexesInfo.value);
      indexesOk = true;
    } else {
      const wrapped = new AppError(
        ERROR_CODES.SERVICES.APP.FETCH,
        ERROR_CATEGORY.NETWORK,
        {
          input: serializeError(indexesInfo.reason as any),
          entity: "AppService",
          section: "indexes",
          phase: "fetchExternalData"
        },
        true
      );
      DomainUtils.log(
        "SERVICES app",
        { phase: "fetchExternalData", section: "indexes", error: wrapped },
        "warn"
      );
    }

    if (materialsInfo.status === "fulfilled") {
      this.processMaterialsInfo(materialsInfo.value);
      materialsOk = true;
    } else {
      const wrapped = new AppError(
        ERROR_CODES.SERVICES.APP.FETCH,
        ERROR_CATEGORY.NETWORK,
        {
          input: serializeError(materialsInfo.reason as any),
          entity: "AppService",
          section: "materials",
          phase: "fetchExternalData"
        },
        true
      );
      DomainUtils.log(
        "SERVICES app",
        { phase: "fetchExternalData", section: "materials", error: wrapped },
        "warn"
      );
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

  /**
   * Process base exchange rate data (USD and EUR)
   */
  private processExchangeBase(baseData: ExchangeData[]): void {
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
        { phase: "processExchangeInfo", warning: "no data" },
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
        { phase: "processIndexesInfo", warning: "no data" },
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
        { phase: "processMaterialsInfo", warning: "no data" },
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
): Promise<{
  storage: "ok" | "aborted" | "error";
  db: "ok" | "aborted" | "error";
  fetch: { exchanges: boolean; indexes: boolean; materials: boolean };
}> {
  const appService = new AppService();
  return appService.initializeApp(translations, signal);
}

DomainUtils.log("SERVICES app", { phase: "module", event: "loaded" });
