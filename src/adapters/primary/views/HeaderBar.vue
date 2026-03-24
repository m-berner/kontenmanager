<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview HeaderBar component renders the top navigation controls for the
 * main application view. It exposes a set of dialog actions (via the dialog hub)
 * and utility commands like updating quotes, opening options, and launching CRUD
 * dialogs for Accounts, Stocks, Bookings, and Booking Types.
 */
import {useI18n} from "vue-i18n";
import {RouterLink} from "vue-router";

import type {ViewTypeSelectionType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import DialogPort from "@/adapters/primary/components/DialogPort.vue";
import {useHeaderBarActions} from "@/adapters/primary/composables/useHeaderBarActions";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

const COMPANY: ViewTypeSelectionType = "company";

const {t} = useI18n();
const runtime = useRuntimeStore();
const records = useRecordsStore();

const {onIconClick} = useHeaderBarActions(t);

log("VIEWS HeaderBar: setup");
</script>

<template>
  <v-app-bar app flat height="75">
    <v-spacer/>
    <RouterLink
        id="home"
        class="router-link-active"
        to="/"
        @click="onIconClick">
      <v-tooltip :text="t('views.headerBar.home')" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              color="grey"
              icon="$home"
              size="large"
              v-bind="props"
              variant="tonal"/>
        </template>
      </v-tooltip>
    </RouterLink>
    <RouterLink
        v-if="records.isDepot"
        id="company"
        class="router-link-active"
        to="/company"
        @click="onIconClick">
      <v-tooltip :text="t('views.headerBar.company')" location="top">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
              color="grey"
              icon="$showCompany"
              size="large"
              v-bind="props"
              variant="tonal"/>
        </template>
      </v-tooltip>
    </RouterLink>
    <v-spacer/>
    <v-tooltip
        v-if="runtime.getCurrentView === COMPANY"
        :text="t('views.headerBar.updateQuote')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="updateQuote"
            icon="$reload"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="runtime.getCurrentView === COMPANY"
        :text="t('views.headerBar.addStock')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="addStock"
            icon="$addCompany"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="runtime.getCurrentView === COMPANY"
        :text="t('views.headerBar.fadeInStock')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="fadeInStock"
            icon="$fadeInCompany"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.addAccount')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="addAccount"
            icon="$addAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.updateAccount')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="updateAccount"
            icon="$updateAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.deleteAccount')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="deleteAccountConfirmation"
            icon="$deleteAccount"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.addBooking')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="addBooking"
            icon="$addBooking"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.addBookingType')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="addBookingType"
            icon="$addBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.updateBookingType')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="updateBookingType"
            icon="$updateBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.deleteBookingType')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="deleteBookingType"
            icon="$deleteBookingType"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.exportToFile')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="exportDatabase"
            icon="$exportToFile"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.importDatabase')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="importDatabase"
            icon="$importDatabase"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip
        v-if="!(runtime.getCurrentView === COMPANY)"
        :text="t('views.headerBar.showAccounting')"
        location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="showAccounting"
            icon="$showAccounting"
            size="large"
            v-bind="props"
            variant="tonal"
            @click="onIconClick"/>
      </template>
    </v-tooltip>
    <v-spacer/>
    <v-tooltip :text="t('views.headerBar.settings')" location="top">
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon
            id="setting"
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
