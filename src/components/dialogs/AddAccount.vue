<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type { FormInterface } from "@/types";
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { useUserInfo } from "@/composables/useUserInfo";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useAccountForm } from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { BROWSER_STORAGE } from "@/config/storage";
import { databaseService } from "@/services/database";
import { useAccountsDB, useBookingTypesDB } from "@/composables/useIndexedDB";
import { INDEXED_DB } from "@/config/database";
import { UtilsService } from "@/domains/utils";

const { t } = useI18n();
const { notice } = useBrowser();
const { setStorage } = useStorage();
const { add: addAccountDB } = useAccountsDB();
const { add: addBookingTypeDB } = useBookingTypesDB();
const { accountFormData, mapAccountFormToDb, reset } = useAccountForm();
const { isLoading, submitGuard } = useDialogGuards();
const { handleUserInfo } = useUserInfo();
const runtime = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();
const formRef = ref<FormInterface | null>(null);

const onClickOk = async (): Promise<void> => {
  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.addAccount.messages.dbNotConnected"
    ),
    notice,
    errorContext: "ADD_ACCOUNT",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const accountData = mapAccountFormToDb();

      // 1) Run all DB writes atomically
      const { accountId, createdTypes } = await databaseService.withTransaction(
        [INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKING_TYPES.NAME],
        "readwrite",
        async (tx) => {
          // Add the account, get the generated ID
          const accountId = await addAccountDB(accountData, tx);
          if (accountId === -1) throw new Error("Failed to add account");

          // Optionally add default booking types
          const createdTypes: {
            cID: number;
            cName: string;
            cAccountNumberID: number;
          }[] = [];
          if (accountFormData.withDepot) {
            const defaults = [
              {
                cName: UtilsService.normalizeBookingTypeName(
                  t("components.dialogs.addAccount.bookingTypes.buy")
                ),
                cAccountNumberID: accountId
              },
              {
                cName: UtilsService.normalizeBookingTypeName(
                  t("components.dialogs.addAccount.bookingTypes.sell")
                ),
                cAccountNumberID: accountId
              },
              {
                cName: UtilsService.normalizeBookingTypeName(
                  t("components.dialogs.addAccount.bookingTypes.dividend")
                ),
                cAccountNumberID: accountId
              }
            ];

            for (const bt of defaults) {
              const id = await addBookingTypeDB(bt, tx);
              if (id === -1) throw new Error("Failed to add booking type");
              createdTypes.push({ cID: id, ...bt });
            }
          }

          // Returning from callback does NOT commit immediately; it waits for tx complete
          return { accountId, createdTypes };
        }
      );

      // 2) Only if the transaction completed successfully, update UI state
      const { activeAccountId } = storeToRefs(settings);
      records.accounts.add({ ...accountData, cID: accountId });
      for (const bt of createdTypes) records.bookingTypes.add(bt);

      activeAccountId.value = accountId;
      await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, accountId);

      records.clean(false);
      runtime.resetTeleport();
      await notice([t("components.dialogs.addAccount.messages.success")]);
    }
  });
};

defineExpose({ onClickOk, title: t("components.dialogs.addAccount.title") });

onBeforeMount(() => {
  UtilsService.log("ADD_ACCOUNT: onBeforeMount");
  reset();
});

await handleUserInfo("console", "AddAccount", "--- vue setup ---", {
  logLevel: "log"
});
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <AccountForm :isUpdate="false" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
