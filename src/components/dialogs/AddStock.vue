<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { UtilsService } from "@/domains/utils";
import { useUserInfo } from "@/composables/useUserInfo";
import { useStocksDB } from "@/composables/useIndexedDB";
import { useStockForm } from "@/composables/useForms";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import type { FormInterface } from "@/types";

const { t } = useI18n();
const { handleUserInfo } = useUserInfo();
const { add } = useStocksDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const { mapStockFormToDb, reset } = useStockForm();
const { isLoading, submitGuard } = useDialogGuards();
const formRef = ref<FormInterface | null>(null);

const onClickOk = async (): Promise<void> => {
  UtilsService.log("ADD_STOCK : onClickOk");

  await submitGuard({
    formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: t(
      "components.dialogs.addStock.messages.dbNotConnected"
    ),
    handleUserInfo,
    errorContext: "ADD_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stockData = mapStockFormToDb(activeAccountId);
      const addStockID = await add(stockData);

      if (addStockID === -1) {
        UtilsService.log(
          "ADD_STOCK: onClickOk",
          t("components.dialogs.addStock.messages.error")
        );
        await handleUserInfo("notice", "AddStock", "add failed", {
          noticeLines: [t("components.dialogs.addStock.messages.error")]
        });
        return;
      }

      records.stocks.add({ ...stockData, cID: addStockID });

      await records.stocks.refreshOnlineData(runtime.stocksPage);

      runtime.resetTeleport();
      await handleUserInfo("notice", "AddStock", "success", {
        noticeLines: [t("components.dialogs.addStock.messages.success")]
      });
    }
  });
};

defineExpose({ onClickOk, title: t("components.dialogs.addStock.title") });

onMounted(() => {
  UtilsService.log("ADD_STOCK: onMounted");
  reset();
});

UtilsService.log("--- AddStock.vue setup ---");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <StockForm :isUpdate="false" />
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
