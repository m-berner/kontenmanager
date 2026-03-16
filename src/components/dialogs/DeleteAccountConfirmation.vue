<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";
import {useSettingsStore} from "@/stores/settings";
import {useRuntimeStore} from "@/stores/runtime";
import {useRecordsStore} from "@/stores/records";
import {log} from "@/domains/utils/utils";
import {storageAdapter} from "@/domains/storage/storageAdapter";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {BROWSER_STORAGE} from "@/constants";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {setStorage} = storageAdapter();
const settings = useSettingsStore();
const {resetTeleport} = useRuntimeStore();
const records = useRecordsStore();
const {isLoading, submitGuard} = useDialogGuards(t);

const switchToNextAccount = async (): Promise<void> => {
  if (records.accounts.items.length === 0) {
    settings.activeAccountId = -1;
    await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, -1);
    return;
  }

  settings.activeAccountId = records.accounts.items[0].cID; //newActiveId!;
  await setStorage(
      BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
      settings.activeAccountId
  );

  const storesDB = await databaseService.getAccountRecords(
      settings.activeAccountId
  );
  await records.init(storesDB, {
    title: t("mixed.smImportOnly.title"),
    message: t("mixed.smImportOnly.message")
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS DeleteAccountConfirmation: onClickOk");

  await submitGuard({
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t("components.dialogs.deleteAccountConfirmation.messages.dbNotConnected"),
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.deleteAccountConfirmation.title"),
    errorContext: "DELETE_ACCOUNT",
    operation: async () => {
      const accountToDelete = settings.activeAccountId;
      await databaseService.deleteAccountRecords(accountToDelete);
      records.accounts.remove(accountToDelete);

      await switchToNextAccount();
      resetTeleport();
      await alertService.feedbackInfo(t("components.dialogs.deleteAccountConfirmation.title"), t("components.dialogs.deleteAccountConfirmation.messages.success"));
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteAccountConfirmation.title")
});

log("COMPONENTS DIALOGS DeleteAccountConfirmation: setup");
</script>

<template>
  <v-alert v-if="records.accounts.items.length === 0">{{
      t("views.headerBar.messages.noAccount")
    }}
  </v-alert>
  <v-alert v-else type="warning">{{
      t("components.dialogs.deleteAccountConfirmation.messages.confirm")
    }}
  </v-alert>
  <v-overlay v-model="isLoading" class="align-center justify-center" contained>
    <v-progress-circular color="primary" indeterminate size="64"/>
  </v-overlay>
</template>
