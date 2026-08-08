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

import {
    BROWSER_STORAGE,
    createHomeHeaders,
    createHomeMenuItems,
    ITEMS_PER_PAGE_OPTIONS
} from "@/domain/constants";
import {isConfirmDialogBusyError} from "@/domain/errors";
import {isValidISODate, log, utcDate} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import DotMenu from "@/adapters/ui/components/DotMenu.vue";
import {useKeyboardShortcuts} from "@/adapters/ui/composables/useKeyboardShortcuts";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {d, n, t} = useI18n();
const {alertAdapter, databaseAdapter, storageAdapter} = useAdapters();
const {clearStorage, installStorageLocal, setStorage} = storageAdapter();
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
  databaseAdapter.disconnect();
};

const {register, unregister} = useKeyboardShortcuts();

/**
 * Resets the application storage to its initial state.
 * Clears all data and re-installs default local storage values.
 * Asks for explicit confirmation first, since this is destructive and
 * triggered by a global keyboard shortcut that is easy to hit by accident.
 *
 * @async
 * @returns {Promise<void>}
 */
const onResetStorage = async (): Promise<void> => {
  // Handled here rather than left to `useKeyboardShortcuts`' wrapper. That
  // wrapper's `Promise.resolve(handler()).catch(...)` is a *blanket* catch —
  // correct for its own purpose (an async handler behind a synchronous type must
  // not produce an unhandled rejection), but it cannot tell "a confirmation was
  // already open" from "the confirmation could not be presented at all", and it
  // logs both at `warn` and moves on. Absorbing the second one there would undo
  // the distinction `alertAdapter.getAlertSinkOrThrow` exists to create.
  //
  // So: the busy rejection means "not confirmed" and returns quietly, matching
  // `useMenu.confirmDestructive`; anything else is a real failure and is
  // reported. Nothing hostile reaches the blanket catch, which stays the safety
  // net for genuinely unexpected rejections.
  let confirmed: boolean | void;
  try {
    confirmed = await alertAdapter.feedbackConfirm(
        t("views.homeContent.resetStorage.confirmTitle"),
        t("views.homeContent.resetStorage.confirmMessage"),
        {
          confirm: {
            confirmText: t("views.homeContent.resetStorage.confirmOk"),
            cancelText: t("views.homeContent.resetStorage.confirmCancel"),
            type: "warning"
          }
        }
    );
  } catch (err) {
    if (isConfirmDialogBusyError(err)) {
      log("VIEWS HomeContent: a confirmation is already open", err, "warn");
      return;
    }
    await alertAdapter.feedbackError(t("views.homeContent.resetStorage.confirmTitle"), err, {});
    return;
  }

  if (!confirmed) return;

  try {
    await clearStorage();
    await installStorageLocal();

    // Re-hydrate before reporting success. Only browser.storage.local is reset
    // here — IndexedDB is untouched — so without this the app was left
    // internally inconsistent while claiming the reset had worked:
    // settings.activeAccountId went back to -1 (via the storage-change
    // listener), but the record stores still held the previous account's
    // bookings/stocks/booking types. `records.isDepot` then reads false and
    // hides the Company nav while that depot's data is still listed, and any
    // subsequent write stamps cAccountNumberID: -1 onto the row — which
    // addBookingUsecase/addStockUsecase now reject outright, but which used to
    // create an orphan that blocks every future export.
    //
    // settings.load() re-reads the freshly seeded storage deterministically
    // rather than waiting on the async onChanged listener, so the id used below
    // is the one that was actually persisted.
    await settings.load();

    // getAccountRecords returns EVERY account regardless of the id passed
    // (findAll), so this first read doubles as "which accounts still exist?".
    const initialRecords = await databaseAdapter.getAccountRecords(settings.activeAccountId);
    const fallbackAccountId = initialRecords.accountsDB[0]?.cID;

    // Landing on the "no account selected" sentinel while accounts still exist
    // is a dead end, not a neutral state: TitleBar's switcher is the only way to
    // choose an account, and the app has no other route back to one. Adopt the
    // first account the same way deleteActiveAccountUsecase already does, so the
    // reset ends on a usable selection instead of an unreachable one.
    const needsAdoption =
        settings.activeAccountId <= 0 && fallbackAccountId !== undefined;
    if (needsAdoption) {
      settings.activeAccountId = fallbackAccountId;
      await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, fallbackAccountId);
    }

    // Re-read only when adopting: the first read carried no bookings/stocks/
    // booking types, because findByAccount(-1) matches nothing.
    const storesDB = needsAdoption
        ? await databaseAdapter.getAccountRecords(fallbackAccountId)
        : initialRecords;
    await records.init(storesDB, {
      title: t("mixed.smImportOnly.title"),
      message: t("mixed.smImportOnly.message")
    });

    await alertAdapter.feedbackInfo(
        t("views.homeContent.resetStorage.confirmTitle"),
        t("views.homeContent.resetStorage.successMessage")
    );
  } catch (err) {
    await alertAdapter.feedbackError(
        t("views.homeContent.resetStorage.confirmTitle"),
        err,
        {}
    );
  }
};

onBeforeMount(() => {
  log("VIEWS HomeContent: onBeforeMount");
  window.addEventListener("beforeunload", onBeforeUnload, {once: true});
  register("Ctrl+Alt+R", onResetStorage);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
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
      item-value="cID"
      @update:items-per-page="setBookingsPerPage">
    <template v-slot:[`item`]="{ item }">
      <tr class="table-row">
        <td class="d-none">{{ item.cID }}</td>
        <td>
          <DotMenu :items="MENU_ITEMS" :record-id="item.cID"/>
        </td>
        <!--
          Same crash class as ShowDividend.vue's ex-date cell: utcDate("") returns
          an Invalid Date (its documented empty-string branch) and
          Intl.DateTimeFormat.format() throws RangeError on that, so converting to a
          Date is not on its own enough. A single booking with a missing/malformed
          cBookDate - reachable via backup import, since normalizeDate() maps that to
          "" - would take out the entire bookings table, not just its own row.
        -->
        <td>
          <template v-if="isValidISODate(item.cBookDate)">
            {{ d(utcDate(item.cBookDate), "short") }}
          </template>
        </td>
        <td>{{ n(item.cDebit, "currency") }}</td>
        <td>{{ n(item.cCredit, "currency") }}</td>
        <td>{{ item.cDescription }}</td>
        <td>{{ records.bookingTypes.getNameById(item.cBookingTypeID) }}</td>
        <td class="d-none">{{ item.cAccountNumberID }}</td>
      </tr>
    </template>
  </v-data-table>
</template>
