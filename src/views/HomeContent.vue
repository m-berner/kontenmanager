<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview HomeContent component displays the main dashboard with a searchable
 * data table of all bookings, including action menus and keyboard shortcuts.
 */
import {computed, onBeforeMount, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useSettingsStore} from "@/stores/settings";
import {useRecordsStore} from "@/stores/records";
import {log, utcDate} from "@/domains/utils/utils";
import DotMenu from "@/components/DotMenu.vue";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {useKeyboardShortcuts} from "@/composables/useKeyboardShortcuts";
import {databaseService} from "@/services/database/service";
import {createHomeHeaders, createHomeMenuItems, ITEMS_PER_PAGE_OPTIONS} from "@/constants";

const {d, n, t} = useI18n();
const {clearStorage, installStorageLocal} = storageAdapter();
const records = useRecordsStore();
const settings = useSettingsStore();
const setBookingsPerPage = (value: number) => settings.setBookingsPerPage(value);

const HEADERS = computed(() => createHomeHeaders(t));
const MENU_ITEMS = computed(() => createHomeMenuItems(t));

const search = ref<string>("");

/**
 * Cleanup function executed before the component or window unloads.
 * Disconnects from the database.
 */
const onBeforeUnload = (): void => {
  log("VIEWS HomeContent: onBeforeUnload");
  databaseService.disconnect();
};

const {register, unregister} = useKeyboardShortcuts();

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

onBeforeMount(() => {
  log("VIEWS HomeContent: onBeforeMount");
  window.addEventListener("beforeunload", onBeforeUnload, {once: true});
  register("Ctrl+Alt+R", onResetStorage);
});

onUnmounted(() => {
  unregister("Ctrl+Alt+R");
});

log("VIEWS HomeContent: setup");
</script>

<template>
  <v-text-field
      v-model="search"
      :label="t('views.homeContent.search')"
      density="compact"
      hide-details
      prepend-inner-icon="$magnify"
      single-line
      variant="outlined"/>
  <v-data-table
      :headers="HEADERS"
      :hide-no-data="false"
      :hover="true"
      :items="records.bookings.items"
      :items-per-page="settings.bookingsPerPage"
      :items-per-page-options="ITEMS_PER_PAGE_OPTIONS"
      :items-per-page-text="t('views.homeContent.bookingsTable.itemsPerPageText')"
      :no-data-text="t('views.homeContent.bookingsTable.noDataText')"
      :search="search"
      density="compact"
      item-key="cID"
      @update:items-per-page="setBookingsPerPage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu :items="MENU_ITEMS" :record-id="item.cID"/>
        </td>
        <td>{{ d(utcDate(item.cBookDate), "short") }}</td>
        <td>{{ n(item.cDebit, "currency") }}</td>
        <td>{{ n(item.cCredit, "currency") }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.bookingTypes.getNameById(item.cBookingTypeID) }}</td>
        <td class="d-none">{{ item.cAccountNumberID }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
