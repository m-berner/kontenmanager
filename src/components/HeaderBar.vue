<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/apis/useApp'
import DialogPort from '@/components/helper/DialogPort.vue'
import {useRuntimeStore} from '@/stores/runtime'
import {useSettingsStore} from '@/stores/settings'
import {useRecordsStore} from '@/stores/records'
import {computed, toRaw} from 'vue'

const {t} = useI18n()
const {CONS, log, notice} = useApp()
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
              await browser.runtime.sendMessage(JSON.stringify({
                type: CONS.MESSAGES.DB__DELETE_BOOKING,
                data: toRaw(settings.activeAccountId)
              }))
            }
            for (let i = 0; i < records.bookingTypes.length; i++) {
              records.deleteBookingType(records.bookingTypes[i].cID)
              await browser.runtime.sendMessage(JSON.stringify({
                type: CONS.MESSAGES.DB__DELETE_BOOKING_TYPE,
                data: toRaw(settings.activeAccountId)
              }))
            }
            for (let i = 0; i < records.stocks.length; i++) {
              records.deleteStock(records.stocks[i].cID)
              await browser.runtime.sendMessage(JSON.stringify({
                type: CONS.MESSAGES.DB__DELETE_STOCK,
                data: toRaw(settings.activeAccountId)
              }))
            }
            records.deleteAccount(settings.activeAccountId)
            await browser.runtime.sendMessage(JSON.stringify({
              type: CONS.MESSAGES.DB__DELETE_ACCOUNT,
              data: toRaw(settings.activeAccountId)
            }))
            if (records.accounts.length > 1) {
              settings.setActiveAccountId(records.accounts[1].cID)
              await browser.runtime.sendMessage(JSON.stringify({
                type: CONS.MESSAGES.STORAGE__SET_ID,
                data: toRaw(records.accounts[1].cID)
              }))
            } else {
              settings.setActiveAccountId(0)
              await browser.runtime.sendMessage(JSON.stringify({type: CONS.MESSAGES.STORAGE__SET_ID, data: 0}))
            }
            const getStoresResponseString = await browser.runtime.sendMessage(JSON.stringify({
              type: CONS.MESSAGES.DB__GET_STORES,
              data: settings.activeAccountId
            }))
            records.initStore(JSON.parse(getStoresResponseString).data)
            records.sumBookings()
            await notice([t('dialogs.deleteAccount.success')])
          } catch (e) {
            console.error(e)
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
        await browser.runtime.openOptionsPage()
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
  <v-app-bar app height="75" v-bind:flat="true">
    <v-spacer></v-spacer>
    <router-link class="router-link-active" to="/">
      <v-tooltip location="top" v-bind:text="t('headerBar.home')">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              icon="$home"
              size="large"
              v-bind="props"
              variant="tonal"></v-app-bar-nav-icon>
        </template>
      </v-tooltip>
    </router-link>
    <router-link
        v-if="isStockAccount"
        class="router-link-active"
        to="/company">
      <v-tooltip location="top" v-bind:text="t('headerBar.home')">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              icon="$home"
              size="large"
              v-bind="props"
              variant="tonal"></v-app-bar-nav-icon>
        </template>
      </v-tooltip>
    </router-link>
    <v-spacer></v-spacer>
    <v-tooltip
        v-if="isStockAccount"
        location="top" v-bind:text="t('headerBar.addStock')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.ADD_STOCK"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$addStock"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.addAccount')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$addAccount"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-tooltip location="top" v-bind:text="t('headerBar.updateAccount')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$updateAccount"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-tooltip location="top" v-bind:text="t('headerBar.deleteAccount')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$deleteAccount"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.addBooking')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$addBooking"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.addBookingType')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$addBookingType"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-tooltip location="top" v-bind:text="t('headerBar.deleteBookingType')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$deleteBookingType"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.exportToFile')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$exportToFile"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-tooltip location="top" v-bind:text="t('headerBar.importDatabase')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$importDatabase"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.showAccounting')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick">
          <v-icon icon="$showAccounting"></v-icon>
        </v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
    <v-tooltip location="top" v-bind:text="t('headerBar.settings')">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            v-bind:id="CONS.COMPONENTS.DIALOGS.SETTING"
            icon="$settings"
            size="large"
            v-bind="props"
            variant="tonal"
            v-on:click="onIconClick"></v-app-bar-nav-icon>
      </template>
    </v-tooltip>
    <v-spacer></v-spacer>
  </v-app-bar>
  <DialogPort></DialogPort>
</template>
