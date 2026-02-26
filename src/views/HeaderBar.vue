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
import {onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {RouterLink} from "vue-router";
import {storeToRefs} from "pinia";
import {useRuntimeStore} from "@/stores/runtime";
import {useRecordsStore} from "@/stores/records";
import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import {useAlert} from "@/composables/useAlert";
import DialogPort from "@/components/DialogPort.vue";
import type {MenuActionType} from "@/types";
import {VIEW_CODES} from "@/configs/codes";

const {t} = useI18n();
const {getMessage, openOptionsPage} = useBrowser();
const {handleUserInfo} = useAlert();
type BrowserMessageKey = Parameters<typeof getMessage>[0];
const runtime = useRuntimeStore();
const {isStockLoading} = storeToRefs(runtime);
const records = useRecordsStore();
const {items: accountItems} = storeToRefs(records.accounts);
const {items: bookingItems} = storeToRefs(records.bookings);
const {items: bookingTypeItems} = storeToRefs(records.bookingTypes);

const openDialog = (dialogName: string, dialogOk: boolean = true): void => {
  runtime.setTeleport({
    dialogName,
    dialogOk,
    dialogVisibility: true
  });
};

const notifyInfo = async (messageKey: BrowserMessageKey): Promise<void> => {
  await handleUserInfo(
      t("views.headerBar.infoTitle"),
      getMessage(messageKey)
  );
};

onBeforeMount(() => {
  DomainUtils.log("VIEWS HeaderBar: onBeforeMount");
});

/**
 * Registry of dialog actions for the header bar menu.
 * Maps action identifiers to functions that trigger component teleports or
 * perform side effects (like fetching quotes).
 *
 * Each action returns either `void` or a `Promise<void>` depending on whether
 * it performs asynchronous work.
 */
const dialogActions: Record<MenuActionType, () => void | Promise<void>> = {
  updateQuote: async () => {
    // Fetches the latest quotes for the current stocks page with loading flags
    try {
      isStockLoading.value = true;
      runtime.isDownloading = true;
      await records.stocks.loadOnlineData(runtime.stocksPage);
    } catch {
      // optionally surface an alert
    } finally {
      isStockLoading.value = false;
      runtime.isDownloading = false;
    }
  },

  fadeInStock: async () => {
    // Opens the fade-in dialog only when passive stocks exist; otherwise informs the user
    if (records.stocks.passive.length === 0) {
      await notifyInfo("xx_no_company");
    } else {
      openDialog("fadeInStock");
    }
  },

  addStock: () => {
    // Open the Add Stock dialog
    openDialog("addStock");
  },

  updateStock: () => {
    // Open Update Stock dialog
    openDialog("updateStock");
  },

  addAccount: () => {
    // Open the Add Account dialog
    openDialog("addAccount");
  },

  updateAccount: async () => {
    // Open the Update Account dialog or inform the user if no accounts exist
    if (accountItems.value.length === 0) {
      await notifyInfo("xx_no_account");
    } else {
      openDialog("updateAccount");
    }
  },

  deleteAccountConfirmation: async () => {
    if (accountItems.value.length === 0) {
      await notifyInfo("xx_no_account");
    } else {
      openDialog("deleteAccountConfirmation");
    }
  },

  addBookingType: async () => {
    if (accountItems.value.length === 0) {
      await notifyInfo("xx_no_account");
    } else {
      openDialog("addBookingType");
    }
  },

  updateBookingType: async () => {
    if (bookingTypeItems.value.length === 0) {
      await notifyInfo("xx_no_bookingType");
    } else {
      openDialog("updateBookingType");
    }
  },

  deleteBookingType: async () => {
    if (bookingTypeItems.value.length === 0) {
      void notifyInfo("xx_no_bookingType");
    } else {
      openDialog("deleteBookingType");
    }
  },

  addBooking: async () => {
    if (accountItems.value.length === 0) {
      void notifyInfo("xx_no_account");
    } else {
      openDialog("addBooking");
    }
  },

  exportDatabase: () => {
    if (accountItems.value.length === 0) {
      void notifyInfo("xx_no_account");
    } else {
      openDialog("exportDatabase");
    }
  },

  importDatabase: () => {
    openDialog("importDatabase");
  },

  showAccounting: () => {
    if (bookingItems.value.length === 0) {
      void notifyInfo("xx_no_booking");
    } else {
      openDialog("showAccounting", false);
    }
  },

  deleteAccount: () => {
  },

  updateBooking: () => {
  },

  deleteBooking: () => {
  },

  showDividend: () => {
  },

  openLink: () => {
  },

  deleteStock: () => {
  },

  home: () => {
    runtime.setCurrentView(VIEW_CODES.HOME);
  },

  company: () => {
    runtime.setCurrentView(VIEW_CODES.COMPANY);
  },

  setting: async () => {
    await openOptionsPage();
  }
};

const onIconClick = async (ev: Event): Promise<void> => {
  const target = ev.target as Element;
  const dialogId = target.closest("[id]")?.id;

  if (!dialogId) return;
  if (!(dialogId in dialogActions)) {
    return;
  }

  await dialogActions[dialogId as MenuActionType]();
};

DomainUtils.log("VIEWS HeaderBar: setup");
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
        v-if="records.accounts.isDepot"
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
        v-if="runtime.getCurrentView === VIEW_CODES.COMPANY"
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
        v-if="runtime.getCurrentView === VIEW_CODES.COMPANY"
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
        v-if="runtime.getCurrentView === VIEW_CODES.COMPANY"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
