<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {addAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import AccountForm from "@/adapters/primary/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createAccountFormManager, provideAccountFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {databaseAdapter, browserAdapter, alertAdapter, storageAdapter, repositories} =
    useAdapters();
const {setStorage} = storageAdapter();
const accountForm = createAccountFormManager();
provideAccountFormManager(accountForm);
const {accountFormData, mapAccountFormToDb, reset} = accountForm;
const {submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddAccount: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "ADD_ACCOUNT",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const accountData = mapAccountFormToDb();
      const title = t("components.dialogs.addAccount.title");

      await addAccountUsecase(
          {
            databaseAdapter,
            repositories,
            records: toRecordsPort(records),
            settings: toSettingsPort(settings),
            runtime,
            setStorage
          },
          {
            accountData,
            withDepot: accountFormData.withDepot,
            bookingTypeLabels: {
              buy: t("components.dialogs.addAccount.bookingTypes.buy"),
              sell: t("components.dialogs.addAccount.bookingTypes.sell"),
              dividend: t("components.dialogs.addAccount.bookingTypes.dividend")
            }
          }
      );

      await alertAdapter.feedbackInfo(
          title,
          t("components.dialogs.addAccount.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addAccount.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddAccount: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddAccount: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <AccountForm :isUpdate="false"/>
  </BaseDialogForm>
</template>
