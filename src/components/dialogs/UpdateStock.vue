<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import type {StockDb} from "@/types";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRecordsStore} from "@/stores/records";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {useBrowser} from "@/composables/useBrowser";
import {useStockForm} from "@/composables/useForms";
import {useStocksDB} from "@/composables/useIndexedDB";
import {DomainUtils} from "@/domains/utils";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useAlert} from "@/composables/useAlert";

const {t} = useI18n();
const {getMessage, showSystemNotification} = useBrowser();
const {update} = useStocksDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {activeAccountId} = useSettingsStore();
const {activeId} = storeToRefs(runtime);
const {stockFormData, mapStockFormToDb, reset: resetForm} = useStockForm();
const {submitGuard} = useDialogGuards();
const {handleUserInfo} = useAlert();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentStock = (): void => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateStock: loadCurrentStock");
  resetForm();
  const currentStock = records.stocks.getById(activeId.value);

  Object.assign(stockFormData, {
    id: activeId.value,
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
  DomainUtils.log("COMPONENTS DIALOGS UpdateStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseService.isConnected(),
    connectionErrorMessage: getMessage("xx_db_connection_err"),
    showSystemNotification,
    errorContext: "UPDATE_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stock = mapStockFormToDb(activeAccountId) as StockDb;
      records.stocks.update(stock);
      await update(stock);
      runtime.resetTeleport()
      await handleUserInfo(t("components.dialogs.updateStock.title"), t("components.dialogs.updateStock.messages.success"));
      runtime.resetOptionsMenuColors();
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateStock.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS UpdateStock: onBeforeMount");
  loadCurrentStock();
});

DomainUtils.log("COMPONENTS DIALOGS UpdateStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef">
    <StockForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
