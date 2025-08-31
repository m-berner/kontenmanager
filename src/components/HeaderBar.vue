<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useIndexedDB} from '@/composables/useIndexedDB'
import DialogPort from '@/components/helper/DialogPort.vue'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {computed, toRaw} from 'vue'

const {t} = useI18n()
const {CONS} = useConstant()
const {log, notice} = useNotification()
const {setStorage, openOptionsPage} = useBrowser()
const {deleteAccount, deleteBooking, deleteBookingType, deleteStock, exportStores} = useIndexedDB()
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
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_STOCK,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_STOCK:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_STOCK,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT:
        const r = confirm('Möchten Sie das aktuelle Konto und\ndie dazugehörigen Datensätze löschen?')
        if (r) {
          try {
            for (let i = 0; i < records.bookings.length; i++) {
              records.deleteBooking(records.bookings[i].cID)
              await deleteBooking(toRaw(settings.activeAccountId))
            }
            for (let i = 0; i < records.bookingTypes.length; i++) {
              records.deleteBookingType(records.bookingTypes[i].cID)
              await deleteBookingType(toRaw(settings.activeAccountId))
            }
            for (let i = 0; i < records.stocks.length; i++) {
              records.deleteStock(records.stocks[i].cID)
              await deleteStock(toRaw(settings.activeAccountId))
            }
            records.deleteAccount(settings.activeAccountId)
            await deleteAccount(toRaw(settings.activeAccountId))
            if (records.accounts.length > 1) {
              settings.setActiveAccountId(records.accounts[1].cID)
              await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, toRaw(records.accounts[1].cID))
            } else {
              settings.setActiveAccountId(0)
              await setStorage(CONS.STORAGE.PROPS.ACTIVE_ACCOUNT_ID, 0)
            }
            const stores = await exportStores(settings.activeAccountId)
            if (stores.accounts.length > 0) {
              records.initStore(stores)
              records.sumBookings()
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
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE,
          okButton: true,
          visibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING,
          okButton: false,
          visibility: true
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
  const ind = records.getAccountIndexById(settings.activeAccountId)
  if (ind > -1) {
    return records.accounts[ind].cStockAccount
  } else {
    return false
  }
})

log('--- HeaderBar.vue setup ---')
</script>

<template>
  <v-app-bar flat app height="75">
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
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$addCompany"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$addAccount"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.updateAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$updateAccount"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.deleteAccount')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$deleteAccount"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addBooking')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$addBooking"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.addBookingType')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$addBookingType"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.deleteBookingType')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$deleteBookingType"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.exportToFile')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$exportToFile"/>
      </template>
    </v-tooltip>
    <v-tooltip :text="t('headerBar.importDatabase')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$importDatabase"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('headerBar.showAccounting')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"
            icon="$showAccounting"/>
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
