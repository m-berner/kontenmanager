<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import connectionIcon from "@/assets/connection48.png";
import defaultIcon from "@/assets/icon48.png";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {useRecordsStore} from "@/stores/records";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {log} from "@/domains/utils/utils";
import {fetchService} from "@/services/fetch";
import {BROWSER_STORAGE, COMPONENTS, INDEXED_DB} from "@/constants";
import {databaseService} from "@/services/database/service";
import {alertService} from "@/services/alert";
import type {ViewTypeSelectionType} from "@/types";

const COMPANY: ViewTypeSelectionType = "company";

const {n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const {setStorage} = storageAdapter();

let depotTimer: number | undefined;
let accountUpdateSeq = 0;

const connectionState = ref<"checking" | "online" | "offline">("checking");
const showDepotChip = ref(false);

/**
 * A computed property that determines the URL of the logo to be displayed based on the connection state
 * and the active account information.
 *
 * - If the `connectionState` is "checking" or "offline", it returns the `connectionIcon`.
 * - If an account with the active account ID is found in the `records.accounts.items`, it returns the
 *   `cLogoUrl` of that account.
 * - If no account is found or the `cLogoUrl` is not available, it returns the `defaultIcon`.
 *
 * The returned value is always a string representing the URL of the logo.
 *
 * Dependencies:
 * - `connectionState.value`: A reactive property that holds the current connection state.
 * - `records.accounts.items`: An array of account records to look for the active account.
 * - `activeAccountId.value`: The ID of the currently active account.
 * - `connectionIcon`: The icon shown for specific connection states.
 * - `defaultIcon`: The fallback icon is shown when no other logo is determined.
 */
const logoUrl = computed((): string => {
  if (connectionState.value === "checking") {
    return connectionIcon;
  }

  if (connectionState.value === "offline") {
    return connectionIcon;
  }

  const account = records.accounts.items.find(
      (a) => a.cID === settings.activeAccountId
  );
  return account?.cLogoUrl || defaultIcon;
});
/** Mapped balance value formatted as the currency string. */
const balance = computed((): string => {
  return n(records.bookings.sumBookings(), "currency");
});
/** Mapped depot value formatted as the currency string. */
const depot = computed((): string => {
  return n(records.stocks.sumDepot(), "currency");
});

/**
 * Event handler for account selection changes.
 * Loads records for the newly selected account.
 */
const onUpdateTitleBar = async (): Promise<void> => {
  log("VIEWS TitleBar: onUpdateTitleBar");

  const seq = ++accountUpdateSeq;
  const selectedAccountId = settings.activeAccountId;

  try {
    const storesDB = await databaseService.getAccountRecords(selectedAccountId);
    if (seq !== accountUpdateSeq) return; // stale selection

    await records.init(storesDB, {
      title: t("mixed.smImportOnly.title"),
      message: t("mixed.smImportOnly.message")
    });

    if (seq !== accountUpdateSeq) return; // stale selection
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, selectedAccountId);
  } catch (err) {
    await alertService.feedbackError("VIEWS TitleBar", err, {});
  }
};

watch(
    [() => runtime.getCurrentView, () => runtime.isDownloading],
    () => {
      if (
          runtime.getCurrentView === "company" &&
          !runtime.isDownloading
      ) {
        if (depotTimer) clearTimeout(depotTimer);
        depotTimer = window.setTimeout(() => {
          showDepotChip.value = true;
        }, 180);
      } else {
        if (depotTimer) clearTimeout(depotTimer);
        showDepotChip.value = false; // hide instantly
      }
    },
    {immediate: true}
);

/**
 * Component initialization.
 * Performs a connectivity check to external services.
 */
onMounted(async () => {
  try {
    const online = await fetchService.fetchIsOk();
    connectionState.value = online ? "online" : "offline";
  } catch (err) {
    void err;
    connectionState.value = "offline";
  }
});

onBeforeUnmount(() => {
  if (depotTimer) clearTimeout(depotTimer);
});

log("VIEWS TitleBar: setup");
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <template #prepend>
      <img
          :alt="t('views.titleBar.iconsAlt.logo')"
          :src="COMPONENTS.TITLE_BAR.LOGO"/>
    </template>
    <v-app-bar-title>{{ t("views.titleBar.title") }}</v-app-bar-title>
    <v-spacer/>
    <v-chip
        v-if="!(runtime.getCurrentView === COMPANY)"
        class="text-h6"
        color="secondary"
        variant="flat"
    >{{ t("views.titleBar.bookingsSumLabel") }} : {{ balance }}
    </v-chip>
    <v-chip
        v-if="showDepotChip"
        class="text-h6"
        color="secondary"
        variant="flat"
    >{{ t("views.titleBar.depotSumLabel") }} : {{ depot }}
    </v-chip>
    <v-spacer/>
    <v-select
        v-if="settings.activeAccountId > 0"
        v-model="settings.activeAccountId"
        :disabled="runtime.getCurrentView === COMPANY"
        :item-title="INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN"
        :item-value="INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID"
        :items="records.accounts.items"
        :label="t('views.titleBar.selectAccountLabel')"
        density="compact"
        hide-details
        max-width="350"
        variant="outlined"
        @update:model-value="onUpdateTitleBar">
      <template #prepend>
        <img :alt="t('views.titleBar.iconsAlt.logo')" :src="logoUrl"/>
      </template>
    </v-select>
  </v-app-bar>
</template>
