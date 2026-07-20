<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {updateAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort} from "@/app/usecases/portAdapters";

import type {AccountDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import AccountForm from "@/adapters/ui/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createAccountFormManager, provideAccountFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {activeAccountId} = storeToRefs(useSettingsStore());
const runtime = useRuntimeStore();
const accountForm = createAccountFormManager();
provideAccountFormManager(accountForm);
const {accountFormData, mapAccountFormToDb} = accountForm;
const records = useRecordsStore();
const {submitGuard, isLoading} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentAccount = (): void => {
  const currentAccount = records.accounts.getById(activeAccountId.value);
  if (!currentAccount) {
    log("COMPONENTS DIALOGS UpdateAccount: Account not found", activeAccountId.value);
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

defineExpose({onClickOk, title: t("components.dialogs.updateAccount.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateAccount: onBeforeMount");
  loadCurrentAccount();
});

log("COMPONENTS DIALOGS UpdateAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <AccountForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
