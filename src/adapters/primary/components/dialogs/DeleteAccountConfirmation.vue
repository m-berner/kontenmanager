<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {useI18n} from "vue-i18n";

import {deleteActiveAccountUsecase} from "@/app/usecases/accounts";
import {toRecordsPort, toSettingsPort} from "@/app/usecases/portAdapters";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {databaseAdapter, alertAdapter, storageAdapter} = useAdapters();
const {setStorage} = storageAdapter();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {isLoading, submitGuard} = useDialogGuards(t);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS DeleteAccountConfirmation: onClickOk");

  await submitGuard({
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: t("components.dialogs.deleteAccountConfirmation.messages.dbNotConnected"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorTitle: t("components.dialogs.deleteAccountConfirmation.title"),
    errorContext: "DELETE_ACCOUNT",
    operation: async () => {
      await deleteActiveAccountUsecase(
          {
            databaseAdapter,
            records: toRecordsPort(records),
            settings: toSettingsPort(settings),
            runtime,
            setStorage
          },
          {
            initMessages: {
              title: t("mixed.smImportOnly.title"),
              message: t("mixed.smImportOnly.message")
            }
          }
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.deleteAccountConfirmation.title"),
          t("components.dialogs.deleteAccountConfirmation.messages.success")
      );
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
