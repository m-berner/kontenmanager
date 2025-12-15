/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {I_Exchange_Data} from '@/types'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useRuntimeStore} from '@/stores/runtime'
import {storeToRefs} from 'pinia'
import {useIndexedDB} from '@/composables/useIndexedDB'
import {useFetch} from '@/composables/useFetch'

const {CONS} = useApp()

const processExchangeBase = (baseData: I_Exchange_Data[]) => {
    const runtime = useRuntimeStore()
    const {curUsd, curEur} = storeToRefs(runtime)
    baseData.forEach((data) => {
        if (data.key.includes(CONS.CURRENCIES.USD)) {
            curUsd.value = data.value
        } else {
            curEur.value = data.value
        }
    })
}

const processExchangeInfo = (infoData: I_Exchange_Data[]) => {
    const runtime = useRuntimeStore()
    infoData.forEach((data) => {
        runtime.infoExchanges.set(data.key, data.value)
    })
}

const processIndexesInfo = (indexesData: I_Exchange_Data[]) => {
    const runtime = useRuntimeStore()
    indexesData.forEach((data) => {
        runtime.infoIndexes.set(data.key, data.value)
    })
}

const processMaterialsInfo = (materialsData: I_Exchange_Data[]) => {
    const runtime = useRuntimeStore()
    materialsData.forEach((data) => {
        runtime.infoMaterials.set(data.key, data.value)
    })
}

export const useAppInitialization = () => {
    const records = useRecordsStore()
    const settings = useSettingsStore()
    const {exchanges} = storeToRefs(settings)
    const {installStorageLocal, uiLanguage} = useBrowser()
    const {getDatabaseStores} = useIndexedDB()
    const {fetchExchangesData, fetchIndexData, fetchMaterialData} = useFetch()

    const initializeApp = async (T: Record<string, Record<string, string>>) => {
        const results = {
            storage: null as any,
            database: null as any,
            exchanges: [] as I_Exchange_Data[],
            indexes: [] as I_Exchange_Data[],
            materials: [] as I_Exchange_Data[]
        }

        try {
            const cur = CONS.CURRENCIES.CODE.get(uiLanguage.value)
            const CUR_EUR = `${cur}${CONS.CURRENCIES.EUR}`
            const CUR_USD = `${cur}${CONS.CURRENCIES.USD}`
            // Initialize storage first (critical)
            results.storage = await installStorageLocal()
            settings.init(results.storage)

            // Initialize database (critical)
            results.database = await getDatabaseStores(settings.activeAccountId)
            await records.init(results.database, T.MESSAGES)

            // Fetch external data (non-critical, can fail gracefully)
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

            return {success: true, results}
        } catch (error) {
            return {success: false, error}
        }
    }

    return {
        initializeApp
    }
}
