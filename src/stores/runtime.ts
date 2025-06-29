/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2014-2025, Martin Berner, stockmanager@gmx.de. All rights reserved.
 */
import {defineStore, type StoreDefinition} from 'pinia'
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

interface IRuntimeGetter {
  //
}

interface IRuntimeActions {
  setLogo: () => void
  setBookingId: (bookingId: number) => void
  setTeleport: (teleport: ITelePort) => void
  resetTeleport: () => void
}

const {CONS, log} = useAppApi()

export const useRuntimeStore: StoreDefinition<'runtime', IRuntimeStore, IRuntimeGetter, IRuntimeActions> = defineStore('runtime', {
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
    //
  },
  actions: {
    setLogo() {
      const records = useRecordsStore()
      const settings = useSettingsStore()
      if (settings.activeAccountId > -1) {
        this.logo = records.accounts[records.getAccountIndexById(settings.activeAccountId)].cLogoUrl
      } else {
        this.logo = CONS.LOGOS.NO_LOGO
      }
    },
    setBookingId(value) {
      this.bookingId = value
    },
    setTeleport(entry) {
      this.teleport = entry
    },
    resetTeleport() {
      this.teleport = {
        dialogName: '',
        okButton: true,
        visibility: false,
      }
    }
  }
})

log('--- STORE runtime.js ---')
