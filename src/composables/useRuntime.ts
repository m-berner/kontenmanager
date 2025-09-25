/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {Ref} from 'vue'
import {ref} from 'vue'

interface ITeleport {
  dialogName: string
  dialogOk: boolean
  dialogVisibility: boolean
}

const activeId: Ref<number> = ref(-1)
const optionMenuColors: Ref<Map<number, string>> = ref(new Map())
const dialogName: Ref<string> = ref('')
const dialogOk: Ref<boolean> = ref(true)
const dialogVisibility: Ref<boolean> = ref(false)
const infoExchanges: Ref<Map<string, number>> = ref(new Map())
const infoIndexes: Ref<Map<string, number>> = ref(new Map())
const infoMaterials: Ref<Map<string, number>> = ref(new Map())
const curUsd: Ref<number> = ref(1)
const curEur: Ref<number> = ref(1)

export const useRuntime = () => {

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
    setTeleport,
    resetTeleport,
    resetOptionsMenuColors
  }
}
