<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
import {storeToRefs} from "pinia";
import {onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {toRecordsPort} from "@/app/usecases/portAdapters";
import {addStockUsecase} from "@/app/usecases/stocks";

import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import StockForm from "@/adapters/ui/components/dialogs/forms/StockForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createStockFormManager, provideStockFormManager} from "@/adapters/ui/composables/useForms";
import {useOnlineStockData} from "@/adapters/ui/composables/useOnlineStockData";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const {activeAccountId} = storeToRefs(useSettingsStore());
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const {refreshOnlineData} = useOnlineStockData();
const stockForm = createStockFormManager();
provideStockFormManager(stockForm);
const {mapStockFormToDb, reset} = stockForm;
const {submitGuard, isLoading} = useDialogGuards(t);
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS AddStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "ADD_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stockData = mapStockFormToDb(activeAccountId.value);

      const res = await addStockUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime,
            stocksPage: runtime.stocksPage
          },
          {stockData}
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.addStock.title"),
          t("components.dialogs.addStock.messages.success")
      );
      reset();

      // addStockUsecase has already invalidated every page's freshness marker;
      // refresh the page the stock reports landing on so it shows live values
      // now rather than on the next visit.
      //
      // Isolated from the add itself, in its own try/catch. This is a network
      // call sitting AFTER the write committed and after the success alert has
      // been shown, and `submitGuard` reports anything thrown out of `operation`
      // through `feedbackError` with `errorContext: "ADD_STOCK"` — so a provider
      // timeout produced "stock added successfully" immediately followed by an
      // add-stock error, for a stock that was added. `importDatabaseUsecase`
      // draws the same line for the same reason: "a failure in these purely
      // cosmetic follow-up steps must not fall through to the catch below".
      //
      // Bracketed with both ref-counted loading flags, matching every other
      // caller of loadOnlineData/refreshOnlineData (CompanyContent.onCurrentItems,
      // useHeaderBarActions.updateQuote). Without them the table showed no
      // loading state and TitleBar's depot chip stayed up while the figures
      // behind it were being recomputed.
      //
      // `stockIds` names the row that was just added rather than letting
      // `resolvePageStocks` fall back to a positional slice of `portfolio.active`
      // — the shape that composable's own doc comment identifies as fetching
      // "quotes for rows nobody was looking at" once the user has sorted the
      // Company table.
      runtime.beginDownload();
      runtime.beginStockLoading();
      try {
        await refreshOnlineData(res.page, {stockIds: [res.id]});
      } catch (refreshErr) {
        log("COMPONENTS DIALOGS AddStock: post-save quote refresh failed", refreshErr, "warn");
      } finally {
        runtime.endStockLoading();
        runtime.endDownload();
      }
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.addStock.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS AddStock: onBeforeMount");
  reset();
});

log("COMPONENTS DIALOGS AddStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <StockForm :isUpdate="false"/>
  </BaseDialogForm>
</template>
