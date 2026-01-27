/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import type {ExchangeData} from '@/types'
import {useBrowser} from '@/composables/useBrowser'
import {useStorage} from '@/composables/useStorage'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {databaseService} from '@/services/database'
import {fetchService} from '@/services/fetch'
import {AppError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import {CURRENCIES} from '@/domains/config/currencies'
import {ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'

/**
 * Application initialization and bootstrapping service
 * Handles app startup, data loading, and external API coordination
 */
export class AppService {
    // Store references
    private records = useRecordsStore()
    private settings = useSettingsStore()
    private runtime = useRuntimeStore()

    // Composable references
    private browser = useBrowser()
    private storage = useStorage()
    private fetch = fetchService

    constructor() {
        // Private constructor for the singleton pattern
    }

    /**
     * Initialize the application by loading data from storage, database, and external APIs.
     * Critical operations (storage, database) will throw on failure.
     * Non-critical operations (exchange rates, indexes) fail gracefully.
     *
     * @param translations - Translation object for initializing records
     * @throws AppError if storage or database initialization fails
     */
    async initializeApp(translations: Record<string, string>): Promise<void> {
        UtilsService.log('Starting application initialization')

        try {
            // Step 1: Initialize storage (critical - will throw on failure)
            await this.initializeStorage()

            // Step 2: Initialize the database (critical - will throw on failure)
            await this.initializeDatabase(translations)

            // Step 3: Fetch external data (non-critical - fails gracefully)
            await this.fetchExternalData()

            UtilsService.log('Application initialization completed successfully')
        } catch (error) {
            UtilsService.log('Application initialization failed', error, 'error')
            throw error
        }
    }

    /**
     * Resets the application state (useful for testing or logout).
     *
     * @returns A promise that resolves when the reset is complete.
     */
    async reset(): Promise<void> {
        UtilsService.log('Resetting application state')

        // Clear runtime state
        this.runtime.resetTeleport()
        this.runtime.clearStocksPages()

        // Clear store state
        this.records.$reset()

        UtilsService.log('Application state reset completed')
    }

    /**
     * Gets the current initialization status of the application.
     *
     * @returns An object with boolean status flags for various subsystems.
     */
    getStatus() {
        return {
            storageInitialized: this.settings.activeAccountId > 0,
            databaseConnected: databaseService.isConnected(),
            recordsLoaded: this.records.stocks.items.length > 0,
            exchangeRatesLoaded: this.runtime.curUsd > 0 && this.runtime.curEur > 0
        }
    }

    /**
     * Step 1: Initialize storage.
     * Fetches data from browser storage and initializes the settings store.
     *
     * @returns A promise that resolves when storage is initialized.
     */
    private async initializeStorage(): Promise<void> {
        UtilsService.log('Initializing storage...')

        const storageData = await this.storage.getStorage()
        this.settings.init(storageData)

        UtilsService.log('Storage initialized successfully')
    }

    /**
     * Step 2: Initialize the database.
     * Connects to IndexedDB and initializes record stores.
     *
     * @param translations - Translation messages for initialization alerts.
     * @returns A promise that resolves when the database is initialized.
     */
    private async initializeDatabase(translations: Record<string, string>): Promise<void> {
        UtilsService.log('Initializing database...')

        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value)
        if (!currency) {
            throw new AppError(
                ERROR_CODES.APP_SERVICE,
                ERROR_CATEGORY.BUSINESS,
                {input: this.browser.uiLanguage.value, entity: 'AppService'},
                false
            )
        }

        await databaseService.connect()
        const databaseStores = await databaseService.getAccountRecords(this.settings.activeAccountId)

        await this.records.init(databaseStores, translations)

        UtilsService.log('Database initialized successfully')
    }

    /**
     * Step 3: Fetch external data (non-critical)
     */
    private async fetchExternalData(): Promise<void> {
        UtilsService.log('Fetching external data...')

        const currency = CURRENCIES.CODE.get(this.browser.uiLanguage.value)
        if (!currency) {
            UtilsService.log('Cannot fetch external data without valid currency', null, 'warn')
            return
        }

        const currencyEUR = `${currency}${CURRENCIES.EUR}`
        const currencyUSD = `${currency}${CURRENCIES.USD}`

        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
            await Promise.allSettled(
                [
                    this.fetch.fetchExchangesData([currencyUSD, currencyEUR]),
                    this.fetch.fetchExchangesData(this.settings.exchanges),
                    this.fetch.fetchIndexData(),
                    this.fetch.fetchMaterialData()
                ]
            )

        // Process successful fetches
        if (exchangesBase.status === 'fulfilled') {
            this.processExchangeBase(exchangesBase.value)
        } else {
            UtilsService.log('Failed to fetch base exchange rates', exchangesBase.reason, 'warn')
        }

        if (exchangesInfo.status === 'fulfilled') {
            this.processExchangeInfo(exchangesInfo.value)
        } else {
            UtilsService.log('Failed to fetch exchange info', exchangesInfo.reason, 'warn')
        }

        if (indexesInfo.status === 'fulfilled') {
            this.processIndexesInfo(indexesInfo.value)
        } else {
            UtilsService.log('Failed to fetch index info', indexesInfo.reason, 'warn')
        }

        if (materialsInfo.status === 'fulfilled') {
            this.processMaterialsInfo(materialsInfo.value)
        } else {
            UtilsService.log('Failed to fetch materials info', materialsInfo.reason, 'warn')
        }

        UtilsService.log('External data fetch completed')
    }

    /**
     * Process base exchange rate data (USD and EUR)
     */
    private processExchangeBase(baseData: ExchangeData[]): void {
        if (!baseData.length) {
            UtilsService.log('No base exchange data to process', null, 'warn')
            return
        }

        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                this.runtime.curUsd = data.value
                UtilsService.log(`USD exchange rate: ${data.value}`)
            } else if (data.key.includes(CURRENCIES.EUR)) {
                this.runtime.curEur = data.value
                UtilsService.log(`EUR exchange rate: ${data.value}`)
            }
        })
    }

    /**
     * Process exchange rate information
     */
    private processExchangeInfo(infoData: ExchangeData[]): void {
        if (!infoData.length) {
            UtilsService.log('No exchange info to process', null, 'warn')
            return
        }

        infoData.forEach((data) => {
            this.runtime.infoExchanges.set(data.key, data.value)
        })

        UtilsService.log(`Processed ${infoData.length} exchange rates`)
    }

    /**
     * Process stock index information
     */
    private processIndexesInfo(indexesData: ExchangeData[]): void {
        if (!indexesData.length) {
            UtilsService.log('No index info to process', null, 'warn')
            return
        }

        indexesData.forEach((data) => {
            this.runtime.infoIndexes.set(data.key, data.value)
        })

        UtilsService.log(`Processed ${indexesData.length} indexes`)
    }

    /**
     * Process raw materials information
     */
    private processMaterialsInfo(materialsData: ExchangeData[]): void {
        if (!materialsData.length) {
            UtilsService.log('No materials info to process', null, 'warn')
            return
        }

        materialsData.forEach((data) => {
            this.runtime.infoMaterials.set(data.key, data.value)
        })

        UtilsService.log(`Processed ${materialsData.length} materials`)
    }
}

/**
 * Convenience function for app initialization
 * Use this in your main.ts or app setup
 */
export async function initializeApp(translations: Record<string, string>): Promise<void> {
    const appService = new AppService()
    await appService.initializeApp(translations)
}

UtilsService.log('--- services/app.ts ---')
