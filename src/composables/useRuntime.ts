/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {ref} from 'vue'

interface ITeleport {
    dialogName: string
    dialogOk: boolean
    dialogVisibility: boolean
}

const activeId = ref<number>(-1)
const optionMenuColors = ref<Map<number, string>>(new Map())
const dialogName = ref<string>('')
const dialogOk = ref<boolean>(true)
const dialogVisibility= ref<boolean>(false)
const infoExchanges = ref<Map<string, number>>(new Map())
const infoIndexes = ref<Map<string, number>>(new Map())
const infoMaterials = ref<Map<string, number>>(new Map())
const curUsd = ref<number>(1)
const curEur = ref<number>(1)
const stocksPage = ref<number>(1)
const loadedStocksPages = new Set()
const isCompanyPage = ref(false)
const isDownloading = ref(false)

export function useRuntime(){

    function clearStocksPages() {
        loadedStocksPages.clear()
    }

    function setTeleport(entry: ITeleport): void {
        dialogName.value = entry.dialogName
        dialogOk.value = entry.dialogOk
        dialogVisibility.value = entry.dialogVisibility
    }

    function resetTeleport(): void {
        dialogName.value = ''
        dialogOk.value = true
        dialogVisibility.value = false
        for (const m of optionMenuColors.value.keys()) {
            optionMenuColors.value.set(m, '')
        }
    }

    function resetOptionsMenuColors(): void {
        for (const m of optionMenuColors.value.keys()) {
            optionMenuColors.value.set(m, '')
        }
    }

    return {
        activeId,
        optionMenuColors,
        dialogName,
        dialogOk,
        dialogVisibility,
        infoExchanges,
        infoIndexes,
        infoMaterials,
        curUsd,
        curEur,
        stocksPage,
        loadedStocksPages,
        isCompanyPage,
        isDownloading,
        setTeleport,
        resetTeleport,
        resetOptionsMenuColors,
        clearStocksPages
    }
}
