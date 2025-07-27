/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {useApp} from '@/pages/background'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

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
  bookingId: number
  logo: string
  teleport: TTelePort
  infoBar: TInfos
  exchanges: {
    curUsd: number
    curEur: number
  }
  optionMenuColors: Map<number, string>
}

const {CONS, log} = useApp()

export const useRuntimeStore = defineStore('runtime', {
  state: (): IRuntimeStore => {
    return {
      bookingId: -1,
      logo: CONS.LOGOS.NO_LOGO,
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
    //bookingId: (state: IRuntimeStore): number => state.bookingId,
    //exchangesCurUsd: (state: IRuntimeStore): number => state.exchanges.curUsd,
    //exchangesCurEur: (state: IRuntimeStore): number => state.exchanges.curEur,
    // Computed properties for commonly used derived state
    hasActiveBooking: (state: IRuntimeStore): boolean => state.bookingId !== -1,
    isDialogVisible: (state: IRuntimeStore): boolean => state.teleport.visibility,
    //optionMenuColors: (state: IRuntimeStore): Map<number, string> => state.optionMenuColors,
    //logo: (state: IRuntimeStore): string => state.logo,

    hasLogo: (state: IRuntimeStore): boolean => state.logo !== CONS.LOGOS.NO_LOGO,
    //teleport: (state: IRuntimeStore): TTelePort => state.teleport
  },
  actions: {
    setLogo(): void {
      const records = useRecordsStore()
      const settings = useSettingsStore()

      this.logo = CONS.LOGOS.NO_LOGO
      if (settings.activeAccountId > -1) {
        const accountIndex = records.getAccountIndexById(settings.activeAccountId)
        if (accountIndex !== -1) {
          const account: IAccount = records.accounts[accountIndex]
          this.logo = account.cLogoUrl
        }
      }
    },
    setBookingId(value: number): void {
      this.bookingId = value
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
    },
    // Additional utility methods
    openDialog(dialogName: string, showOkButton: boolean = true): void {
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
      this.bookingId = -1
    },

    // Set both booking and open related dialog
    setBookingAndOpenDialog(bookingId: number, dialogName: string): void {
      this.bookingId = bookingId
      this.openDialog(dialogName)
    },

    // Reset all runtime state
    resetRuntimeState(): void {
      this.bookingId = -1
      this.logo = CONS.LOGOS.NO_LOGO
      this.resetTeleport()
    },

    // Safe logo update with error handling
    updateLogoSafely(): void {
      try {
        this.setLogo()
      } catch (error) {
        log('ERROR: Failed to update logo', {info: error})
        this.logo = CONS.LOGOS.NO_LOGO
      }
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
