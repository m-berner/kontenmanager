<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {toRecordsPort} from "@/app/usecases/portAdapters";
import {addStockUsecase} from "@/app/usecases/stocks";

import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import StockForm from "@/adapters/primary/components/dialogs/forms/StockForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createStockFormManager, provideStockFormManager} from "@/adapters/primary/composables/useForms";
import {useOnlineStockData} from "@/adapters/primary/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {databaseService, browserService, alertService, repositories} = useServices();
const {refreshOnlineData} = useOnlineStockData();
const stockForm = createStockFormManager();
provideStockFormManager(stockForm);
const {mapStockFormToDb, reset} = stockForm;
const {submitGuard} = useDialogGuards(t);
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "ADD_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stockData = mapStockFormToDb(activeAccountId);

      const res = await addStockUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime,
            stocksPage: runtime.stocksPage
          },
          {stockData}
      );

      await alertService.feedbackInfo(
          t("components.dialogs.addStock.title"),
          t("components.dialogs.addStock.messages.success")
      );
      reset();
      await refreshOnlineData(res.page);
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addStock.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddStock: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <StockForm :isUpdate="false"/>
  </BaseDialogForm>
</template>
