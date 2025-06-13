<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import {useTheme} from 'vuetify'
import {useAppApi} from '@/pages/background'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const settings = useSettingsStore()
const records = useRecordsStore()
const runtime = useRuntimeStore()
const theme = useTheme()
const {CONS, log, notice} = useAppApi()
const {_debug} = storeToRefs(settings)
const keyStrokeController: string[] = []
const onBeforeUnload = async (ev: Event): Promise<void> => {
  log('APPINDEX: onBeforeUnload', {info: ev})
  const foundTabs = await browser.tabs.query({url: 'about:addons'})
  if (foundTabs.length > 0) {
    await browser.tabs.remove(foundTabs[0].id ?? 0)
  }
}
const onKeyDown = (ev: KeyboardEvent): void => {
  keyStrokeController.push(ev.key)
  log('APPINDEX: onKeyDown')
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'r'
  ) {
    browser.storage.local.clear()
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && _debug.value
  ) {
    browser.storage.local.set({sDebug: false})
  }
  if (
    keyStrokeController.includes('Control') &&
    keyStrokeController.includes('Alt') &&
    ev.key === 'd' && !_debug.value
  ) {
    browser.storage.local.set({sDebug: true})
  }
}
const onKeyUp = (ev: KeyboardEvent): void => {
  keyStrokeController.splice(keyStrokeController.indexOf(ev.key), 1)
}
const onBackgroundMessage = (backgroundMsg: IMessage): void => {
  switch (backgroundMsg.type) {
    case CONS.MESSAGES.STORES__INIT_SETTINGS__RESPONSE:
      settings.initStore(theme, backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_SKIN__RESPONSE:
      theme.global.name.value = backgroundMsg.data
      settings.setSkin(backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_SERVICE__RESPONSE:
      settings.setService(backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_INDEXES__RESPONSE:
      settings.setIndexes(backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_MATERIALS__RESPONSE:
      settings.setMaterials(backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_MARKETS__RESPONSE:
      settings.setMarkets(backgroundMsg.data)
      break
    case CONS.MESSAGES.OPTIONS__SET_EXCHANGES__RESPONSE:
      settings.setExchanges(backgroundMsg.data)
      break
    case CONS.MESSAGES.DB__TO_STORE__RESPONSE:
      const toStoreData: IStores = backgroundMsg.data
      if (toStoreData.accounts.length > 0) {
        records.initStore(toStoreData)
        if (settings.activeAccountId === undefined) {
          settings.setActiveAccountId(records.accounts[0].cID)
        }
        runtime.setLogo()
        records.sumBookings()
      }
      break
    case CONS.MESSAGES.DB__UPDATE_ACCOUNT__RESPONSE:
      notice([t('dialogs.UpdateAccount.success')])
      break
    case CONS.MESSAGES.DB__UPDATE_STOCK__RESPONSE:
      notice([t('dialogs.UpdateStock.success')])
      break
    case CONS.MESSAGES.DB__DELETE_ACCOUNT__RESPONSE:
      notice([t('dialogs.deleteAccount.success')])
      break
    case CONS.MESSAGES.DB__DELETE_STOCK__RESPONSE:
      notice([t('dialogs.deleteStock.success')])
      break
    case CONS.MESSAGES.DB__DELETE_BOOKING__RESPONSE:
      notice([t('dialogs.deleteBooking.success')])
      break
    case CONS.MESSAGES.DB__DELETE_BOOKING_TYPE__RESPONSE:
      notice([t('dialogs.deleteBookingType.success')])
      break
    case CONS.MESSAGES.DB__ADD_ACCOUNT__RESPONSE:
      const addAccountData: IAccount = backgroundMsg.data
      records.addAccount(addAccountData)
      runtime.setLogo()
      settings.setActiveAccountId(addAccountData.cID)
      notice([t('dialogs.AddAccount.success')])
      break
    case CONS.MESSAGES.DB__ADD_BOOKING__RESPONSE:
      const addBookingData: IBooking = backgroundMsg.data
      records.addBooking(addBookingData)
      notice([t('dialogs.AddBooking.success')])
      break
    case CONS.MESSAGES.DB__ADD_BOOKING_TYPE__RESPONSE:
      const addBookingTypeData: IBookingType = backgroundMsg.data
      records.addBookingType(addBookingTypeData)
      notice([t('dialogs.AddBookingType.success')])
      break
    case CONS.MESSAGES.DB__ADD_STOCK__RESPONSE:
      const addStockData: IStock = backgroundMsg.data
      records.addStock(addStockData)
      notice([t('dialogs.AddStock.success')])
      break
    default:
  }
}

window.addEventListener('keydown', onKeyDown, false)
window.addEventListener('keyup', onKeyUp, false)
window.addEventListener('beforeunload', onBeforeUnload, CONS.SYSTEM.ONCE)
browser.runtime.onMessage.addListener(onBackgroundMessage)

browser.runtime.sendMessage({type: CONS.MESSAGES.STORES__INIT_SETTINGS})
browser.runtime.sendMessage({type: CONS.MESSAGES.DB__TO_STORE})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
  <v-app v-bind:flat="true">
    <router-view name="title"></router-view>
    <router-view name="header"></router-view>
    <v-main>
      <router-view></router-view>
    </v-main>
    <router-view name="footer"></router-view>
  </v-app>
</template>
