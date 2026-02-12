<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
/**
 * @fileoverview HomeContent component displays the main dashboard with a searchable
 * data table of all bookings, including action menus and keyboard shortcuts.
 */
import { computed, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { DomainUtils } from "@/domains/utils";
import DotMenu from "@/components/DotMenu.vue";
import { useTheme } from "vuetify";
import { useStorage } from "@/composables/useStorage";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { databaseService } from "@/services/database";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
import { createHomeHeaders, createHomeMenuItems, VIEWS } from "@/configs/views";

const { d, n, t } = useI18n();
const { addStorageChangedListener, clearStorage, installStorageLocal } =
  useStorage();
const records = useRecordsStore();
const { items: bookingItems } = storeToRefs(records.bookings);
const settings = useSettingsStore();
const { bookingsPerPage, skin } = storeToRefs(settings);
const { setBookingsPerPage } = settings;
const theme = useTheme();

const HEADERS = computed(() => createHomeHeaders(t));
const MENU_ITEMS = computed(() => createHomeMenuItems(t));

const search = ref<string>("");

// ============================================================================
// Storage & Lifecycle
// ============================================================================

/**
 * Handles changes in browser storage and synchronizes them with the local store.
 * Updates theme skin, services, and various market/material indexes.
 *
 * @param {Record<string, unknown>} changes - Object containing changed storage keys
 */
const onChangeHandler = (
  changes: Record<string, browser.storage.StorageChange>
): void => {
  DomainUtils.log("APP_INDEX: changeHandler");
  const changesKey = Object.keys(changes);
  const { service, indexes, markets, materials, exchanges } =
    storeToRefs(settings);
  const sync = {
    [BROWSER_STORAGE.SKIN.key]: () => {
      if (theme?.global?.name) {
        theme.global.name.value = changes[BROWSER_STORAGE.SKIN.key].newValue;
      }
      skin.value = changes[BROWSER_STORAGE.SKIN.key].newValue;
    },
    [BROWSER_STORAGE.SERVICE.key]: () => {
      service.value = changes[BROWSER_STORAGE.SERVICE.key].newValue;
    },
    [BROWSER_STORAGE.INDEXES.key]: () => {
      indexes.value = changes[BROWSER_STORAGE.INDEXES.key].newValue;
    },
    [BROWSER_STORAGE.MARKETS.key]: () => {
      markets.value = changes[BROWSER_STORAGE.MARKETS.key].newValue;
    },
    [BROWSER_STORAGE.MATERIALS.key]: () => {
      materials.value = changes[BROWSER_STORAGE.MATERIALS.key].newValue;
    },
    [BROWSER_STORAGE.EXCHANGES.key]: () => {
      exchanges.value = changes[BROWSER_STORAGE.EXCHANGES.key].newValue;
    }
  };

  sync[changesKey[0]]?.();
};

const removeStorageChangedListener = addStorageChangedListener(onChangeHandler);

/**
 * Cleanup function executed before the component or window unloads.
 * Removes storage listeners and disconnects from the database.
 */
const onBeforeUnload = (): void => {
  DomainUtils.log("APP_INDEX: onBeforeUnload");
  removeStorageChangedListener();
  databaseService.disconnect();
};

window.addEventListener("beforeunload", onBeforeUnload, { once: true });

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

const { register, unregister } = useKeyboardShortcuts();

/**
 * Resets the application storage to its initial state.
 * Clears all data and re-installs default local storage values.
 *
 * @async
 * @returns {Promise<void>}
 */
const onResetStorage = async (): Promise<void> => {
  await clearStorage();
  await installStorageLocal();
};

register("Ctrl+Alt+R", onResetStorage);

onUnmounted(() => {
  unregister("Ctrl+Alt+R");
});

DomainUtils.log("VIEWS HomeContent: setup");
</script>

<template>
  <v-text-field
    v-model="search"
    :label="t('views.homeContent.search')"
    density="compact"
    hide-details
    prepend-inner-icon="$magnify"
    single-line
    variant="outlined"
  />
  <v-data-table
    :headers="HEADERS"
    :hide-no-data="false"
    :hover="true"
    :items="bookingItems"
    :items-per-page="bookingsPerPage"
    :items-per-page-options="VIEWS.ITEMS_PER_PAGE_OPTIONS"
    :items-per-page-text="t('views.homeContent.bookingsTable.itemsPerPageText')"
    :no-data-text="t('views.homeContent.bookingsTable.noDataText')"
    :search="search"
    density="compact"
    item-key="cID"
    @update:items-per-page="setBookingsPerPage"
  >
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu :items="MENU_ITEMS" :record-id="item.cID" />
        </td>
        <td>{{ d(DomainUtils.utcDate(item.cBookDate), "short") }}</td>
        <td>{{ n(item.cDebit, "currency") }}</td>
        <td>{{ n(item.cCredit, "currency") }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.bookingTypes.getNameById(item.cBookingTypeID) }}</td>
        <td class="d-none">{{ item.cAccountNumberID }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
