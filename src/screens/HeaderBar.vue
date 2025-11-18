<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onUpdated} from 'vue'
import {useI18n} from 'vue-i18n'
import {RouterLink, useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import {useRuntimeStore} from '@/stores/runtime'
import {useRecordsStore} from '@/stores/records'
import {useAlertStore} from '@/stores/alerts'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import DialogPort from '@/components/DialogPort.vue'

const {t} = useI18n()
const {CONS, log} = useApp()
const {openOptionsPage} = useBrowser()
const runtime = useRuntimeStore()
const {isCompanyPage} = storeToRefs(runtime)
const records = useRecordsStore()
const router = useRouter()
const {info} = useAlertStore()

const MESSAGES = Object.freeze({
  INFO_TITLE: t('headerBar.messages.infoTitle'),
  SHOW_ACCOUNTING: t('headerBar.messages.noBookings'),
  NOTHING_TO_EXPORT: t('headerBar.messages.nothingToExport'),
  NO_BOOKING_TYPES: t('headerBar.messages.noBookingTypes'),
  CREATE_ACCOUNT: t('headerBar.messages.createAccount'),
  NO_ACCOUNT: t('headerBar.messages.noAccount'),
  ALL_STOCKS_VISIBLE: t('headerBar.messages.allStocksVisible')
})

const STRINGS = Object.freeze({
  HOME: t('headerBar.home'),
  COMPANY: t('headerBar.company'),
  UPDATE_QUOTE: t('headerBar.updateQuote'),
  ADD_STOCK: t('headerBar.addStock'),
  SHOW: t('headerBar.fadeInStock'),
  ADD_ACCOUNT: t('headerBar.addAccount'),
  UPDATE_ACCOUNT: t('headerBar.updateAccount'),
  DELETE_ACCOUNT: t('headerBar.deleteAccount'),
  ADD_BOOKING: t('headerBar.addBooking'),
  ADD_BOOKING_TYPE: t('headerBar.addBookingType'),
  UPDATE_BOOKING_TYPE: t('headerBar.updateBookingType'),
  DELETE_BOOKING_TYPE: t('headerBar.deleteBookingType'),
  EXPORT_TO_FILE: t('headerBar.exportToFile'),
  IMPORT_DATABASE: t('headerBar.importDatabase'),
  SHOW_ACCOUNTING: t('headerBar.showAccounting'),
  SETTINGS: t('headerBar.settings')
})

const onIconClick = async (ev: Event): Promise<void> => {
  log('HEADER_BAR: onIconClick')
  const {items: accountItems} = storeToRefs(records.accounts)
  const {items: bookingItems} = storeToRefs(records.bookings)
  const {items: bookingTypeItems} = storeToRefs(records.bookingTypes)
  const parse = async (elem: Element | null, loop = 0): Promise<void> => {
    if (loop > 6 || elem === null) return
    switch (elem!.id) {
      case CONS.COMPONENTS.DIALOGS.FADE_IN_STOCK:
        if (records.stocks.passive.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.ALL_STOCKS_VISIBLE, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.FADE_IN_STOCK,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
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
        if (accountItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.NO_ACCOUNT, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT_CONFIRMATION:
        if (accountItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.NO_ACCOUNT, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT_CONFIRMATION,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE:
        if (accountItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.CREATE_ACCOUNT, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING_TYPE:
        if (bookingTypeItems.value.length < 2) {
          info(MESSAGES.INFO_TITLE, MESSAGES.NO_BOOKING_TYPES, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING_TYPE,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE:
        if (bookingTypeItems.value.length < 2) {
          info(MESSAGES.INFO_TITLE, MESSAGES.NO_BOOKING_TYPES, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING:
        if (accountItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.CREATE_ACCOUNT, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE:
        if (accountItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.NOTHING_TO_EXPORT, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE,
            dialogOk: true,
            dialogVisibility: true
          })
        }
        break
      case CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE:
        runtime.setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING:
        if (bookingItems.value.length === 0) {
          info(MESSAGES.INFO_TITLE, MESSAGES.SHOW_ACCOUNTING, null)
        } else {
          runtime.setTeleport({
            dialogName: CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING,
            dialogOk: false,
            dialogVisibility: true
          })
        }
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

onUpdated(() => {
  isCompanyPage.value = router.currentRoute.value.path.includes('company')
})

log('--- HeaderBar.vue setup ---')
</script>

<template>
  <v-app-bar app flat height="75">
    <v-spacer/>
    <RouterLink class="router-link-active" to="/">
      <v-tooltip :text="STRINGS.HOME" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              color="grey"
              icon="$home"
              size="large"
              v-bind="props"
              variant="tonal"
              @click="onIconClick"/>
        </template>
      </v-tooltip>
    </RouterLink>
    <RouterLink
        v-if="records.accounts.isDepot"
        class="router-link-active"
        to="/company">
      <v-tooltip :text="STRINGS.COMPANY" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              color="grey"
              icon="$showCompany"
              size="large"
              v-bind="props"
              variant="tonal"
              @click="onIconClick"/>
        </template>
      </v-tooltip>
    </RouterLink>
    <v-spacer/>
    <v-tooltip
        v-if="isCompanyPage"
        :text="STRINGS.UPDATE_QUOTE"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.UPDATE_QUOTE"
            icon="$reload"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="isCompanyPage"
        :text="STRINGS.ADD_STOCK"
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
    <v-tooltip
        v-if="isCompanyPage"
        :text="STRINGS.SHOW"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.FADE_IN_STOCK"
            icon="$fadeInCompany"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.ADD_ACCOUNT"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.UPDATE_ACCOUNT"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.DELETE_ACCOUNT"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT_CONFIRMATION"
            icon="$deleteAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.ADD_BOOKING"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.ADD_BOOKING_TYPE"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.UPDATE_BOOKING_TYPE"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING_TYPE"
            icon="$updateBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.DELETE_BOOKING_TYPE"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.EXPORT_TO_FILE"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.IMPORT_DATABASE"
        location="top">
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
    <v-tooltip
        v-if="!isCompanyPage"
        :text="STRINGS.SHOW_ACCOUNTING"
        location="top">
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
    <v-tooltip
        :text="STRINGS.SETTINGS"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            :id="CONS.COMPONENTS.DIALOGS.SETTING"
            color="grey"
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
