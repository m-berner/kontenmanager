<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import connectionIcon from "@/assets/connection48.png";
import defaultIcon from "@/assets/icon48.png";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {useRecordsStore} from "@/stores/records";
import {useStorage} from "@/composables/useStorage";
import {DomainUtils} from "@/domains/utils";
import {fetchService} from "@/services/fetch";
import {INDEXED_DB} from "@/configs/database";
import {databaseService} from "@/services/database/service";
import {BROWSER_STORAGE} from "@/domains/configs/storage";
import {COMPONENTS} from "@/configs/components";
import {VIEW_CODES} from "@/configs/codes";
import {useAlert} from "@/composables/useAlert";

const {n, t} = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const {handleUserError} = useAlert();
const {setStorage} = useStorage();
const {activeAccountId} = storeToRefs(settings);

let depotTimer: number | undefined;

const connectionState = ref<"checking" | "online" | "offline">("checking");
const showDepotChip = ref(false);

const logoUrl = computed((): string => {
  if (connectionState.value === "checking") {
    return connectionIcon;
  }

  if (connectionState.value === "offline") {
    return connectionIcon;
  }

  const account = records.accounts.items.find(
      (a) => a.cID === activeAccountId.value
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
  DomainUtils.log("VIEWS TitleBar: onUpdateTitleBar");

  try {
    await setStorage(
        BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
        activeAccountId.value
    );
    const storesDB = await databaseService.getAccountRecords(
        activeAccountId.value
    );
    await records.init(storesDB, {
      title: t("mixed.smImportOnly.title"),
      message: t("mixed.smImportOnly.message")
    });
  } catch (err) {
    await handleUserError("VIEWS TitleBar", err, {});
  }
};

watch(
    [() => runtime.getCurrentView, () => runtime.isDownloading],
    () => {
      if (
          runtime.getCurrentView === VIEW_CODES.COMPANY &&
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
  } catch {
    connectionState.value = "offline";
  }
});

DomainUtils.log("VIEWS TitleBar: setup");
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
        v-if="!(runtime.getCurrentView === VIEW_CODES.COMPANY)"
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
        v-if="activeAccountId > 0"
        v-model="activeAccountId"
        :disabled="runtime.getCurrentView === VIEW_CODES.COMPANY"
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
