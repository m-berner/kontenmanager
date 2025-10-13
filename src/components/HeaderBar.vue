<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onUpdated} from 'vue'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useRuntime} from '@/composables/useRuntime'
import {useBrowser} from '@/composables/useBrowser'
import {useRecordsStore} from '@/stores/records'
import DialogPort from '@/components/childs/DialogPort.vue'
import {useRouter} from 'vue-router'

const {t} = useI18n()
const {CONS, log} = useApp()
const {openOptionsPage} = useBrowser()
const {isCompanyPage, setTeleport} = useRuntime()
const records = useRecordsStore()
const router = useRouter()

const onIconClick = async (ev: Event): Promise<void> => {
  log('HEADER_BAR: onIconClick')
  const parse = async (elem: Element | null, loop = 0): Promise<void> => {
    if (loop > 6 || elem === null) return
    switch (elem!.id) {
      case CONS.COMPONENTS.DIALOGS.FADE_IN_STOCK:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.FADE_IN_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_STOCK:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_STOCK:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_STOCK:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_STOCK,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_ACCOUNT,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_ACCOUNT,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT_CONFIRMATION:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_ACCOUNT_CONFIRMATION,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING_TYPE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING_TYPE:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.UPDATE_BOOKING_TYPE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.DELETE_BOOKING_TYPE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.ADD_BOOKING:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.ADD_BOOKING,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.EXPORT_DATABASE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE:
        setTeleport({
          dialogName: CONS.COMPONENTS.DIALOGS.IMPORT_DATABASE,
          dialogOk: true,
          dialogVisibility: true
        })
        break
      case CONS.COMPONENTS.DIALOGS.SHOW_ACCOUNTING:
        setTeleport({
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

onUpdated(() => {
  isCompanyPage.value = router.currentRoute.value.path.includes('company')
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
              variant="tonal"
              @click="onIconClick"/>
        </template>
      </v-tooltip>
    </router-link>
    <router-link
        v-if="records.accounts.isDepot"
        class="router-link-active"
        to="/company">
      <v-tooltip :text="t('headerBar.company')" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              icon="$showCompany"
              size="large"
              v-bind="props"
              variant="tonal"
              @click="onIconClick"/>
        </template>
      </v-tooltip>
    </router-link>
    <v-spacer/>
    <v-tooltip
        v-if="isCompanyPage"
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
    <v-tooltip
        v-if="isCompanyPage"
        :text="t('headerBar.fadeInStock')"
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
        :text="t('headerBar.addAccount')"
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
        :text="t('headerBar.updateAccount')"
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
        :text="t('headerBar.deleteAccount')"
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
        :text="t('headerBar.addBooking')"
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
        :text="t('headerBar.addBookingType')"
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
        :text="t('headerBar.updateBookingType')"
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
        :text="t('headerBar.deleteBookingType')"
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
        :text="t('headerBar.exportToFile')"
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
        :text="t('headerBar.importDatabase')"
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
        :text="t('headerBar.showAccounting')"
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
        v-if="!isCompanyPage"
        :text="t('headerBar.settings')"
        location="top">
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
