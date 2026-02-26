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
import {storeToRefs} from "pinia";
import {useSettingsStore} from "@/stores/settings";
import {useRecordsStore} from "@/stores/records";
import {DomainUtils} from "@/domains/utils";
import DotMenu from "@/components/DotMenu.vue";
import {useStorage} from "@/composables/useStorage";
import {useKeyboardShortcuts} from "@/composables/useKeyboardShortcuts";
import {databaseService} from "@/services/database/service";
import {createHomeHeaders, createHomeMenuItems} from "@/configs/views";

const {d, n, t} = useI18n();
const {clearStorage, installStorageLocal} = useStorage();
const records = useRecordsStore();
const {items: bookingItems} = storeToRefs(records.bookings);
const settings = useSettingsStore();
const {bookingsPerPage} = storeToRefs(settings);
const setBookingsPerPage = (value: number) => settings.setBookingsPerPage(value);

const ITEMS_PER_PAGE_OPTIONS = [
  {
    value: 5,
    title: "5"
  },
  {
    value: 7,
    title: "7"
  },
  {
    value: 9,
    title: "9"
  },
  {
    value: 11,
    title: "11"
  },
  {
    value: 13,
    title: "13"
  }
];

const HEADERS = computed(() => createHomeHeaders(t));
const MENU_ITEMS = computed(() => createHomeMenuItems(t));

const search = ref<string>("");

/**
 * Cleanup function executed before the component or window unloads.
 * Disconnects from the database.
 */
const onBeforeUnload = (): void => {
  DomainUtils.log("VIEWS HomeContent: onBeforeUnload");
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
  DomainUtils.log("VIEWS HomeContent: onBeforeMount");
  window.addEventListener("beforeunload", onBeforeUnload, {once: true});
  register("Ctrl+Alt+R", onResetStorage);
});

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
      variant="outlined"/>
  <v-data-table
      :headers="HEADERS"
      :hide-no-data="false"
      :hover="true"
      :items="bookingItems"
      :items-per-page="bookingsPerPage"
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
