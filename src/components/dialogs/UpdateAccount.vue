<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {log} from "@/domains/utils/utils";
import {browserService} from "@/services/browserService";
import {useAccountForm} from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import type {AccountDb} from "@/types";
import {alertService} from "@/services/alert";
import {accountsRepository} from "@/services/database/repositories";

const {t} = useI18n();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const {accountFormData, mapAccountFormToDb} = useAccountForm();
const records = useRecordsStore();
const {submitGuard} = useDialogGuards(t);
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
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "UPDATE_ACCOUNT",
    errorTitle: t("components.dialogs.updateAccount.title"),
    operation: async () => {
      const account = mapAccountFormToDb() as AccountDb;
      records.accounts.update(account);
      await accountsRepository.save(account);
      runtime.resetTeleport();
      await alertService.feedbackInfo(t("components.dialogs.updateAccount.title"), t("components.dialogs.updateAccount.messages.success"));
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
