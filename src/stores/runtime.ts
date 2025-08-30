/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {useNotification} from '@/composables/useNotification'

interface ITeleport {
    dialogName: string
    okButton: boolean
    visibility: boolean
}

interface IInfos {
    exchanges: Map<string, number>
    indexes: Map<string, number>
    materials: Map<string, number>
}

interface IRuntimeStore {
    activeId: number
    teleport: ITeleport
    infoBar: IInfos
    exchanges: {
        curUsd: number
        curEur: number
    }
    optionMenuColors: Map<number, string>
}

const {log} = useNotification()

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
        hasActiveBooking: (state: IRuntimeStore): boolean => state.activeId !== -1,
        isDialogVisible: (state: IRuntimeStore): boolean => state.teleport.visibility
    },
    actions: {
        setActiveId(value: number): void {
            this.activeId = value
        },
        setTeleport(entry: ITeleport): void {
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
                visibility: false
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
        updateDialogConfig(config: Partial<ITeleport>): void {
            this.teleport = {
                ...this.teleport,
                ...config
            }
        },
        clearBooking(): void {
            this.activeId = -1
        },
        setExchangesUsd(value: number) {
            this.exchanges.curUsd = value
        },
        setExchangesEur(value: number) {
            this.exchanges.curEur = value
        }
    }
})

log('--- STORE runtime.js ---')
