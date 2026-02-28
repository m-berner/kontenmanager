<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";
import {useBrowser} from "@/composables/useBrowser";
import {useAccountsDB} from "@/composables/useIndexedDB";
import {useAccountForm} from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {INDEXED_DB} from "@/configs/database";
import type {AccountDb} from "@/types";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {getMessage} = useBrowser();
const {update} = useAccountsDB();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const {accountFormData, mapAccountFormToDb} = useAccountForm();
const records = useRecordsStore();
const {items: accountItems} = storeToRefs(records.accounts);
const {submitGuard} = useDialogGuards(t);
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentAccount = (): void => {
  const accountIndex = records.accounts.getIndexById(activeAccountId);
  if (accountIndex === INDEXED_DB.INVALID_ID) {
    DomainUtils.log("COMPONENTS DIALOGS UpdateAcount: Account not found", activeAccountId);
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
  DomainUtils.log("COMPONENTS DIALOGS UpdateAccount: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "UPDATE_ACCOUNT",
    errorTitle: t("components.dialogs.updateAccount.title"),
    operation: async () => {
      const account = mapAccountFormToDb(activeAccountId) as AccountDb;
      records.accounts.update(account);
      await update(account);
      runtime.resetTeleport();
      await alertService.feedbackInfo(t("components.dialogs.updateAccount.title"), t("components.dialogs.updateAccount.messages.success"));
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateAccount.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateAccount: onBeforeMount");
  loadCurrentAccount();
});

DomainUtils.log("COMPONENTS DIALOGS UpdateAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <AccountForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
