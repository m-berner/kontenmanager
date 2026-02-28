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
import {DomainUtils} from "@/domains/utils";
import {useStocksDB} from "@/composables/useIndexedDB";
import {useStockForm} from "@/composables/useForms";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {INDEXED_DB} from "@/configs/database";
import {useBrowser} from "@/composables/useBrowser";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {getMessage, showSystemNotification} = useBrowser();
const {add} = useStocksDB();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {mapStockFormToDb, reset} = useStockForm();
const {submitGuard} = useDialogGuards(t);
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS AddStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification,
    errorContext: "ADD_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stockData = mapStockFormToDb(activeAccountId);
      const addStockID = await add(stockData);

      if (addStockID === INDEXED_DB.INVALID_ID) {
        throw new Error(t("components.dialogs.addStock.messages.error"));
      }

      records.stocks.add({...stockData, cID: addStockID});
      await alertService.feedbackInfo(t("components.dialogs.addStock.title"), t("components.dialogs.addStock.messages.success"));
      reset();

      await records.stocks.refreshOnlineData(runtime.stocksPage);
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addStock.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS AddStock: onBeforeMount");
  reset();
});

DomainUtils.log("COMPONENTS DIALOGS AddStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <StockForm :isUpdate="false"/>
  </BaseDialogForm>
</template>
