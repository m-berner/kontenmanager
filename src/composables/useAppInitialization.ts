/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {I_Exchange_Data} from '@/types'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {storeToRefs} from 'pinia'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'
import {useAppConfig} from '@/composables/useAppConfig'

const {CURRENCIES} = useAppConfig()

export const useAppInitialization = () => {
    const records = useRecordsStore()
    const settings = useSettingsStore()
    const runtime = useRuntimeStore()
    const {exchanges} = storeToRefs(settings)
    const {curUsd, curEur} = storeToRefs(runtime)
    const {getStorage, uiLanguage} = useBrowser()
    const {getDatabaseStores} = useIndexedDB()
    const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch()

    /**
     * Process base exchange rate data (USD and EUR)
     */
    function processExchangeBase(baseData: I_Exchange_Data[]): void {
        if (!baseData || baseData.length === 0) return

        baseData.forEach((data) => {
            if (data.key.includes(CURRENCIES.USD)) {
                curUsd.value = data.value
            } else if (data.key.includes(CURRENCIES.EUR)) {
                curEur.value = data.value
            }
        })
    }

    /**
     * Process exchange rate information
     */
    function processExchangeInfo(infoData: I_Exchange_Data[]): void {
        if (!infoData || infoData.length === 0) return

        infoData.forEach((data) => {
            runtime.infoExchanges.set(data.key, data.value)
        })
    }

    /**
     * Process stock index information
     */
    function processIndexesInfo(indexesData: I_Exchange_Data[]): void {
        if (!indexesData || indexesData.length === 0) return

        indexesData.forEach((data) => {
            runtime.infoIndexes.set(data.key, data.value)
        })
    }

    /**
     * Process raw materials information
     */
    function processMaterialsInfo(materialsData: I_Exchange_Data[]): void {
        if (!materialsData || materialsData.length === 0) return

        materialsData.forEach((data) => {
            runtime.infoMaterials.set(data.key, data.value)
        })
    }

    /**
     * Initialize the application by loading data from storage, database, and external APIs.
     * Critical operations (storage, database) will throw on failure.
     * Non-critical operations (exchange rates, indexes) fail gracefully.
     *
     * @param translations - Translation object for initializing records
     * @throws Error if storage or database initialization fails
     */
    async function initializeApp(translations: Record<string, string>): Promise<void> {
        // Step 1: Initialize storage (critical - will throw on failure)
        const storageData = await getStorage()
        settings.init(storageData)

        // Step 2: Initialize database (critical - will throw on failure)
        const cur = CURRENCIES.CODE.get(uiLanguage.value)
        if (!cur) {
            throw new Error(`Unsupported UI language: ${uiLanguage.value}`)
        }

        const databaseStores = await getDatabaseStores(settings.activeAccountId)
        await records.init(databaseStores, translations)

        // Step 3: Fetch external data (non-critical - fails gracefully)
        const CUR_EUR = `${cur}${CURRENCIES.EUR}`
        const CUR_USD = `${cur}${CURRENCIES.USD}`

        const [exchangesBase, exchangesInfo, indexesInfo, materialsInfo] =
            await Promise.allSettled(
                [
                    fetchExchangesData([CUR_USD, CUR_EUR]),
                    fetchExchangesData(exchanges.value),
                    fetchIndexData(),
                    fetchMaterialData()
                ]
            )

        // Process successful fetches
        if (exchangesBase.status === 'fulfilled') {
            processExchangeBase(exchangesBase.value)
        }
        if (exchangesInfo.status === 'fulfilled') {
            processExchangeInfo(exchangesInfo.value)
        }
        if (indexesInfo.status === 'fulfilled') {
            processIndexesInfo(indexesInfo.value)
        }
        if (materialsInfo.status === 'fulfilled') {
            processMaterialsInfo(materialsInfo.value)
        }
    }

    return {
        initializeApp
    }
}
