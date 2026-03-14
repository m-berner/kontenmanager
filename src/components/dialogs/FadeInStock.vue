<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import type {StockItem} from "@/types";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {log} from "@/domains/utils/utils";
import {useStocksDB} from "@/composables/useIndexedDB";
import {browserService} from "@/services/browserService";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {save} = useStocksDB();
const {isLoading, submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const records = useRecordsStore();

const selected = ref<StockItem | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS FadeInStock: onClickOk");

  if (!selected.value) {
    await alertService.feedbackInfo("FadeInStock", browserService.getMessage("xx_db_no_selected"));
    return;
  }

  await submitGuard({
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorTitle: t("components.dialogs.fadeInStock.title"),
    errorContext: "FADE_IN_STOCK",
    operation: async () => {
      const stock = selected.value!;
      stock.cFadeOut = 0;

      await save(stock);
      records.stocks.update(stock);
      await alertService.feedbackInfo("FadeInStock", browserService.getMessage("xx_db_fade_in"));
      runtime.resetTeleport();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.fadeInStock.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS FadeInStock: onBeforeMount");
  selected.value = null;
});

log("COMPONENTS DIALOGS FadeInStock: setup");
</script>

<template>
  <v-form validate-on="submit" v-on:submit.prevent>
    <v-card-text class="pa-5">
      <v-select
          v-model="selected"
          density="compact"
          item-key="cID"
          item-title="cCompany"
          v-bind:clearable="true"
          v-bind:items="records.stocks.passive"
          v-bind:label="t('components.dialogs.fadeInStock.selectLabel')"
          v-bind:return-object="true"
          variant="outlined"/>
    </v-card-text>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>

