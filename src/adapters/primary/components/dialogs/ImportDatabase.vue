<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Dialog that imports a JSON backup into IndexedDB.
 * Validates the file, runs integrity checks, executes an atomic import, and
 * reports results via the alert overlay. Offers creating defaults when needed.
 */
import {useI18n} from "vue-i18n";

import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {useImportDatabaseDialogController} from "@/adapters/primary/composables/useImportDialog";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {browserService, alertService, storageAdapter, importExportService, databaseService, fetchService} =
    useServices();
const {isLoading, submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();

const {
  files,
  fileInputKey,
  isFileSelected,
  onChange,
  runImport
} = useImportDatabaseDialogController({
  t,
  runtime,
  settings,
  records,
  services: {browserService, alertService, storageAdapter, importExportService, databaseService, fetchService}
});

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS ImportDatabase: onClickOk");

  if (!isFileSelected.value) {
    await alertService.feedbackInfo(
        t("components.dialogs.importDatabase.title"),
        browserService.getMessage("xx_db_no_file")
    );
    return;
  }

  await submitGuard({
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.importDatabase.title"),
    errorContext: "IMPORT_DATABASE",
    operation: async () => {
      await runImport();
    }
  });
};

defineExpose({
  onClickOk,
  title: t("components.dialogs.importDatabase.title")
});

log("COMPONENTS DIALOGS ImportDatabase: setup");
</script>

<template>
  <v-form validate-on="submit" @submit.prevent>
    <v-card-text class="pa-5">
      <v-text-field
          :label="t('components.dialogs.importDatabase.messageDelete')"
          readonly
          variant="plain"/>
      <v-file-input
          :key="fileInputKey"
          v-model="files"
          :clearable="true"
          :label="t('components.dialogs.importDatabase.fileLabel')"
          :show-size="true"
          accept=".json"
          prepend-icon="$fileUpload"
          variant="outlined"
          @update:model-value="onChange"/>
    </v-card-text>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
