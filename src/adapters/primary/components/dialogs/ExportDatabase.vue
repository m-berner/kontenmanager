<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Dialog that exports the current database into a JSON backup.
 * Coordinates with the database service and provides user feedback via alerts
 * and notices. Closes itself via the dialog hub on success or cancel.
 */
import {useI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {useExportDatabaseDialogController} from "@/adapters/primary/composables/useExportDialog";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";

const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const {browserAdapter, alertAdapter, importExportAdapter, repositories} = useAdapters();

const {dialogText, run} = useExportDatabaseDialogController({
  t,
  runtime,
  services: {browserAdapter, alertAdapter, importExportAdapter, repositories}
});

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS ExportDatabase: onClickOk");

  await submitGuard({
    showSystemNotification: alertAdapter.feedbackInfo,
    errorTitle: t("components.dialogs.exportDatabase.title"),
    errorContext: "EXPORT_DATABASE",
    operation: async () => {
      await run();
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.exportDatabase.title")
});

log("COMPONENTS DIALOGS ExportDatabase: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card>
      <v-card-text class="pa-5">
        <v-textarea
            :disabled="true"
            :model-value="dialogText"
            variant="outlined"/>
      </v-card-text>
    </v-card>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
