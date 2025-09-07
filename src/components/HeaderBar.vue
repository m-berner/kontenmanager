<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import type {IAccountDB, IBookingDB, IBookingTypeDB, IStockDB, IStockOnlyMemory} from '@/types'
import {computed, toRaw} from 'vue'
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useAccountsDB, useBookingsDB, useBookingTypesDB, useStocksDB} from '@/composables/useIndexedDB'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useSettingsStore} from '@/stores/settings'
import DialogPort from '@/components/dialogs/childs/DialogPort.vue'

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {setStorage, openOptionsPage} = useBrowser()
const {deleteAccount, getAllAccounts} = useAccountsDB()
const {deleteBooking, getAllBookings} = useBookingsDB()
const {deleteBookingType, getAllBookingTypes} = useBookingTypesDB()
const {deleteStock, getAllStocks} = useStocksDB()
const runtime = useRuntimeStore()
const settings = useSettingsStore()
const records = useRecordsStore()

const onIconClick = async (ev: Event): Promise<void> => {
  log('HEADER_BAR: onIconClick')
  const parse = async (elem: Element | null, loop = 0): Promise<void> => {
    if (loop > 6 || elem === null) return
    switch (elem!.id) {
      case CONS.COMPONENTS.DIALOGS.ADD_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT:
        const r = confirm('Möchten Sie das aktuelle Konto und\ndie dazugehörigen Datensätze löschen?')
        if (r) {
          try {
            for (let i = 0; i < records.bookings.items.length; i++) {
              records.bookings.deleteBooking(records.bookings.items[i].cID)
              await deleteBooking(records.bookings.items[i].cID)
            }
            for (let i = 0; i < records.bookingTypes.items.length; i++) {
              records.bookingTypes.deleteBookingType(records.bookingTypes.items[i].cID)
              await deleteBookingType(records.bookingTypes.items[i].cID)
            }
            for (let i = 0; i < records.stocks.items.length; i++) {
              records.stocks.deleteStock(records.stocks.items[i].cID)
              await deleteStock(records.stocks.items[i].cID)
            }
            records.accounts.deleteAccount(settings.activeAccountId)
            await deleteAccount(toRaw(settings.activeAccountId))
            if (records.accounts.items.length > 1) {
              settings.setActiveAccountId(records.accounts.items[1].cID)
              await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, toRaw(records.accounts.items[1].cID))
            } else {
              settings.setActiveAccountId(0)
              await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, 0)
            }
            const accounts: IAccountDB[] = await getAllAccounts()
            const bookings: IBookingDB[] = await getAllBookings()
            const bookingTypes: IBookingTypeDB[] = await getAllBookingTypes()
            const stocks: IStockDB[] = await getAllStocks()
            const stocksOnlyMemory: IStockOnlyMemory = {
              mPortfolio: 0,
              mChange: 0,
              mBuyValue: 0,
              mEuroChange: 0,
              mMin: 0,
              mValue: 0,
              mMax: 0
            }
            const stores = {
              accounts,
              bookings,
              bookingTypes,
              stocks: stocks.map((stock) => {
                return {...stock, ...stocksOnlyMemory}
              })
            }
            if (stores.accounts.length > 0) {
              records.initStore(stores)
              records.bookings.sumBookings()
            }
            await notice([t('dialogs.deleteAccount.success')])
          } catch (e) {
            log('HEADER_BAR: onIconClick', {error: e})
            await notice([t('dialogs.deleteAccount.error')])
          }
        }
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING,
          dialogOk: false,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.SETTING:
        await openOptionsPage()
        break
      default:
        loop += 1
        await parse(elem!.parentElement, loop)
    }
  }
  if (ev.target instanceof Element) {
    await parse(ev.target)
  }
}
const isStockAccount = computed((): boolean => {
  const ind = records.accounts.getAccountIndexById(settings.activeAccountId)
  if (ind > -1) {
    return records.accounts.items[ind].cStockAccount
  } else {
    return false
  }
})

log('--- HeaderBar.vue setup ---')
</script>

<template>
  <v-app-bar app flat height="75">
    <v-spacer/>
    <router-link class="router-link-active" to="/">
      <v-tooltip :text="t('headerBar.home')" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              icon="$home"
              size="large"
              v-bind="props"
              variant="tonal"/>
        </template>
      </v-tooltip>
    </router-link>
    <router-link
        v-if="isStockAccount"
        class="router-link-active"
        to="/company">
      <v-tooltip :text="t('headerBar.home')" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              icon="$showCompany"
              size="large"
              v-bind="props"
              variant="tonal"/>
        </template>
      </v-tooltip>
    </router-link>
    <v-spacer/>
    <v-tooltip
        v-if="isStockAccount"
        :text="t('headerBar.addStock')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_STOCK"
            icon="$addCompany"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT"
            icon="$addAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.updateAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT"
            icon="$updateAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.deleteAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT"
            icon="$deleteAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addBooking')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING"
            icon="$addBooking"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addBookingType')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE"
            icon="$addBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.deleteBookingType')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE"
            icon="$deleteBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.exportToFile')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE"
            icon="$exportToFile"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.importDatabase')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE"
            icon="$importDatabase"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.showAccounting')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING"
            icon="$showAccounting"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.settings')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.SETTING"
            icon="$settings"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
  </v-app-bar>
  <DialogPort/>
</template>
