<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { useAlert } from "@/composables/useAlert";

const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { handleUserError } = useAlert();
const { setStorage } = useStorage();
const settings = useSettingsStore();
const { activeAccountId } = storeToRefs(settings);
const { resetTeleport } = useRuntimeStore();
const records = useRecordsStore();
const { items: accountItems } = storeToRefs(records.accounts);
const { isLoading, ensureConnected, withLoading } = useDialogGuards();

const switchToNextAccount = async (): Promise<void> => {
  try {
    if (accountItems.value.length === 0) {
      activeAccountId.value = -1;
      await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, -1);
      return;
    }

    //const newActiveId = accountItems.value[0].cID;
    activeAccountId.value = accountItems.value[0].cID; //newActiveId!;
    await setStorage(
      BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key,
      activeAccountId.value
    );
  } catch (err) {
    await handleUserError("DeleteAccountConfirmation", err, {});
  }

  const storesDB = await databaseService.getAccountRecords(
    activeAccountId.value
  );
  await records.init(storesDB, {
    title: t("mixed.smImportOnly.title"),
    message: t("mixed.smImportOnly.message")
  });
};

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("DELETE_ACCOUNT_CONFIRMATION: onClickOk");

  if (
    !(await ensureConnected(
      databaseService.isConnected(),
      handleUserNotice,
      t("components.dialogs.deleteAccountConfirmation.messages.dbNotConnected")
    ))
  )
    return;

  await withLoading(async () => {
    try {
      const accountToDelete = activeAccountId.value;
      await databaseService.deleteAccountRecords(accountToDelete);
      records.accounts.remove(accountToDelete);

      await switchToNextAccount();

      resetTeleport();
      await handleUserNotice("DeleteAccountConfirmation", "success");
    } catch {
      throw new AppError(
        ERROR_CODES.DELETE_ACCOUNT_CONFIRMATION,
        ERROR_CATEGORY.VALIDATION,
        true
      );
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.deleteAccountConfirmation.title")
});

DomainUtils.log("COMPONENTS DIALOGS DeleteAccountConfirmation");
</script>

<template>
  <v-alert v-if="records.accounts.items.length === 0">{{
    t("views.headerBar.messages.noAccount")
  }}</v-alert>
  <v-alert v-else type="warning">{{
    t("components.dialogs.deleteAccountConfirmation.messages.confirm")
  }}</v-alert>
  <v-overlay v-model="isLoading" class="align-center justify-center" contained>
    <v-progress-circular color="primary" indeterminate size="64" />
  </v-overlay>
</template>
