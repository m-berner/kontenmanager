/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {useApp} from '@/composables/useApp'

type TTelePort = {
    dialogName: string
    okButton: boolean
    visibility: boolean
}

type TInfos = {
    exchanges: Map<string, number>
    indexes: Map<string, number>
    materials: Map<string, number>
}

interface IRuntimeStore {
    activeId: number
    teleport: TTelePort
    infoBar: TInfos
    exchanges: {
        curUsd: number
        curEur: number
    }
    optionMenuColors: Map<number, string>
}

const {log} = useApp()

export const useRuntimeStore = defineStore('runtime', {
    state: (): IRuntimeStore => {
        return {
            activeId: -1,
            teleport: {
                dialogName: '',
                okButton: true,
                visibility: false
            },
            infoBar: {
                exchanges: new Map(),
                indexes: new Map(),
                materials: new Map()
            },
            exchanges: {
                curUsd: 1,
                curEur: 1
            },
            optionMenuColors: new Map()
        }
    },
    getters: {
        //materials: (state: IRuntimeStore): Map<string, number> => state.infoBar.materials,
        //exchanges: (state: IRuntimeStore): Map<string, number> => state.infoBar.exchanges,
        //indexes: (state: IRuntimeStore): Map<string, number> => state.infoBar.indexes,
        //activeId: (state: IRuntimeStore): number => state.activeId,
        //exchangesCurUsd: (state: IRuntimeStore): number => state.exchanges.curUsd,
        //exchangesCurEur: (state: IRuntimeStore): number => state.exchanges.curEur,
        // Computed properties for commonly used derived state
        hasActiveBooking: (state: IRuntimeStore): boolean => state.activeId !== -1,
        isDialogVisible: (state: IRuntimeStore): boolean => state.teleport.visibility
    },
    actions: {
        setActiveId(value: number): void {
            this.activeId = value
        },
        setTeleport(entry: TTelePort): void {
            // Create a copy to avoid mutation issues
            this.teleport = {
                dialogName: entry.dialogName,
                okButton: entry.okButton,
                visibility: entry.visibility
            }
        },
        resetTeleport(): void {
            this.teleport = {
                dialogName: '',
                okButton: true,
                visibility: false,
            }
            for (const m of this.optionMenuColors.keys()) {
                this.optionMenuColors.set(m, '')
            }
        },
        resetOptionsMenuColors(): void {
            for (const m of this.optionMenuColors.keys()) {
                this.optionMenuColors.set(m, '')
            }
        },
        // Additional utility methods
        openModalDialog(dialogName: string, showOkButton: boolean = true): void {
            this.teleport = {
                dialogName,
                okButton: showOkButton,
                visibility: true
            }
        },

        closeDialog(): void {
            this.teleport.visibility = false
        },

        toggleDialog(): void {
            this.teleport.visibility = !this.teleport.visibility
        },

        updateDialogConfig(config: Partial<TTelePort>): void {
            this.teleport = {
                ...this.teleport,
                ...config
            }
        },

        clearBooking(): void {
            this.activeId = -1
        },

        // Set both booking and open related dialog
        setBookingAndOpenDialog(activeId: number, dialogName: string): void {
            this.activeId = activeId
            this.openModalDialog(dialogName)
        },

        // Reset all runtime state
        resetRuntimeState(): void {
            this.activeId = -1
            this.resetTeleport()
        },
        setExchangesUsd(value: number) {
            this.exchanges.curUsd = value
        },
        setExchangesEur(value: number) {
            this.exchanges.curEur = value
        },
    }
})

log('--- STORE runtime.js ---')
