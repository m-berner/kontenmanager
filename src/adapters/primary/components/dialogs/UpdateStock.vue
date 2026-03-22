<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {toRecordsPort} from "@/app/usecases/portAdapters";
import {updateStockUsecase} from "@/app/usecases/stocks";

import type {StockDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import BaseDialogForm from "@/adapters/primary/components/dialogs/forms/BaseDialogForm.vue";
import StockForm from "@/adapters/primary/components/dialogs/forms/StockForm.vue";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";
import {createStockFormManager, provideStockFormManager} from "@/adapters/primary/composables/useForms";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {activeAccountId} = useSettingsStore();
const stockForm = createStockFormManager();
provideStockFormManager(stockForm);
const {stockFormData, mapStockFormToDb, reset: resetForm} = stockForm;
const {submitGuard} = useDialogGuards(t);
const {databaseService, browserService, alertService, repositories} = useServices();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentStock = (): void => {
  log("COMPONENTS DIALOGS UpdateStock: loadCurrentStock");
  resetForm();
  const currentStock = records.stocks.getById(runtime.activeId);

  Object.assign(stockFormData, {
    id: runtime.activeId,
    isin: currentStock?.cISIN.toUpperCase().replace(/\s/g, ""),
    company: currentStock?.cCompany,
    symbol: currentStock?.cSymbol,
    meetingDay: currentStock?.cMeetingDay,
    quarterDay: currentStock?.cQuarterDay,
    fadeOut: currentStock?.cFadeOut,
    firstPage: currentStock?.cFirstPage,
    url: currentStock?.cURL,
    askDates: currentStock?.cAskDates
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: browserService.getMessage("xx_db_connection_err"),
    showSystemNotification: alertService.feedbackInfo,
    errorContext: "UPDATE_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stock = mapStockFormToDb(activeAccountId) as StockDb;
      await updateStockUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {stock}
      );

      await alertService.feedbackInfo(
          t("components.dialogs.updateStock.title"),
          t("components.dialogs.updateStock.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateStock.title")});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateStock: onBeforeMount");
  loadCurrentStock();
});

log("COMPONENTS DIALOGS UpdateStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <StockForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
