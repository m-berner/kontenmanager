<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import type {AccountDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import AccountForm from "@/adapters/primary/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createAccountFormManager, provideAccountFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const accountForm = createAccountFormManager();
provideAccountFormManager(accountForm);
const {accountFormData, mapAccountFormToDb} = accountForm;
const records = useRecordsStore();
const {submitGuard} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentAccount = (): void => {
  const currentAccount = records.accounts.getById(activeAccountId);
  if (!currentAccount) {
    log("COMPONENTS DIALOGS UpdateAccount: Account not found", activeAccountId);
    return;
  }

  Object.assign(accountFormData, {
    id: currentAccount.cID,
    swift: currentAccount.cSwift,
    iban: currentAccount.cIban,
    logoUrl: currentAccount.cLogoUrl,
    withDepot: currentAccount.cWithDepot
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateAccount: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_ACCOUNT",
    errorTitle: t("components.dialogs.updateAccount.title"),
    operation: async () => {
      const account = mapAccountFormToDb() as AccountDb;
      await updateAccountUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {account}
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.updateAccount.title"),
          t("components.dialogs.updateAccount.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateAccount.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateAccount: onBeforeMount");
  loadCurrentAccount();
});

log("COMPONENTS DIALOGS UpdateAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <AccountForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
