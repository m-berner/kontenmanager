/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {defineStore} from 'pinia'
import {useAppApi} from '@/pages/background'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'

interface ITelePort {
  dialogName: string
  okButton: boolean
  visibility: boolean
}

interface IRuntimeStore {
  bookingId: number
  logo: string
  teleport: ITelePort
}

const {CONS, log} = useAppApi()

export const useRuntimeStore = defineStore('runtime', {
  state: (): IRuntimeStore => {
    return {
      bookingId: -1,
      logo: CONS.LOGOS.NO_LOGO,
      teleport: {
        dialogName: '',
        okButton: true,
        visibility: false
      }
    }
  },
  getters: {
    // Computed properties for commonly used derived state
    hasActiveBooking: (state): boolean => state.bookingId !== -1,

    isDialogVisible: (state): boolean => state.teleport.visibility,

    currentDialog: (state): string => state.teleport.dialogName,

    hasLogo: (state): boolean => state.logo !== CONS.LOGOS.NO_LOGO,

    dialogConfig: (state): ITelePort => ({...state.teleport}),

    // Get current booking info if available
    currentBookingInfo: (state) => {
      if (state.bookingId === -1) return null
      const records = useRecordsStore()
      const bookingIndex = records.getBookingById(state.bookingId)
      return bookingIndex !== -1 ? records.bookings[bookingIndex] : null
    }
  },
  actions: {
    setLogo() {
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
    setBookingId(value: number) {
      this.bookingId = value
    },
    setTeleport(entry: ITelePort) {
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

    updateDialogConfig(config: Partial<ITelePort>): void {
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
        log('ERROR: Failed to update logo', {info:error})
        this.logo = CONS.LOGOS.NO_LOGO
      }
    }
  }
})

log('--- STORE runtime.js ---')
