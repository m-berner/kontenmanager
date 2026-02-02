<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { UtilsService } from "@/domains/utils";
import { useUserInfo } from "@/composables/useUserInfo";
import { useAccountsDB } from "@/composables/useIndexedDB";
import { useAccountForm } from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import type { AccountDb, FormInterface } from "@/types";

const { t } = useI18n();
const { handleUserInfo } = useUserInfo();
const { update } = useAccountsDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const { accountFormData, mapAccountFormToDb } = useAccountForm();
const records = useRecordsStore();
const { items: accountItems } = storeToRefs(records.accounts);
const { isLoading, submitGuard } = useDialogGuards();
const formRef = ref<FormInterface | null>(null);

const loadCurrentAccount = (): void => {
  const accountIndex = records.accounts.getIndexById(activeAccountId);
  if (accountIndex === -1) {
    UtilsService.log("UPDATE_ACCOUNT: Account not found", activeAccountId);
    return;
  }
  const currentAccount = accountItems.value[accountIndex];

  Object.assign(accountFormData, {
    id: currentAccount.cID,
    swift: currentAccount.cSwift,
    iban: currentAccount.cIban,
    logoUrl: currentAccount.cLogoUrl,
    withDepot: currentAccount.cWithDepot
  });
};

const onClickOk = async (): Promise<void> => {
  UtilsService.log("UPDATE_ACCOUNT: onClickOk");

  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.updateAccount.messages.dbNotConnected"
    ),
    handleUserInfo,
    errorContext: "UPDATE_ACCOUNT",
    errorTitle: t("components.dialogs.updateAccount.title"),
    operation: async () => {
      const account = mapAccountFormToDb(activeAccountId) as AccountDb;
      records.accounts.update(account);
      await update(account);
      runtime.resetTeleport();
      await handleUserInfo(
        "notice",
        "UpdateAccount",
        "success",
        { noticeLines: [t("components.dialogs.updateAccount.messages.success")] }
      );
    }
  });
};

defineExpose({ onClickOk, title: t("components.dialogs.updateAccount.title") });

onBeforeMount(() => {
  UtilsService.log("UPDATE_ACCOUNT: onBeforeMount");
  loadCurrentAccount();
});

UtilsService.log("--- components/dialogs/UpdateAccount.vue setup ---");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <AccountForm :isUpdate="true" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
