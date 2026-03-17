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
import {log} from "@/domains/utils/utils";
import {useStockForm} from "@/composables/useForms";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {ERROR_CATEGORY, INDEXED_DB} from "@/constants";
import {browserService} from "@/services/browserService";
import {alertService} from "@/services/alert";
import {formMapper} from "@/domains/mapping/formMapper";
import {stocksRepository} from "@/services/database/repositories";
import {appError, ERROR_DEFINITIONS} from "@/domains/errors";

const {t} = useI18n();
const {activeAccountId} = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {stockFormData, reset} = useStockForm();
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
      const stockData = formMapper().mapStockForm(stockFormData, activeAccountId);
      const addStockID = await stocksRepository.save(stockData);

      if (addStockID === INDEXED_DB.INVALID_ID) {
        throw appError(
            ERROR_DEFINITIONS.SERVICES.DATABASE.BASE.B.CODE,
            ERROR_CATEGORY.DATABASE,
            true,
            {entity: "stock"}
        );
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
