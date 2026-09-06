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
import {updateStockUsecase} from "@/app/usecases/stocks";

import type {StockDb} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import BaseDialogForm from "@/adapters/ui/components/dialogs/forms/BaseDialogForm.vue";
import StockForm from "@/adapters/ui/components/dialogs/forms/StockForm.vue";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {createStockFormManager, provideStockFormManager} from "@/adapters/ui/composables/useForms";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {t} = useI18n();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {activeAccountId} = storeToRefs(useSettingsStore());
const stockForm = createStockFormManager();
provideStockFormManager(stockForm);
const {stockFormData, mapStockFormToDb, reset: resetForm} = stockForm;
const {submitGuard, isLoading} = useDialogGuards(t);
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();
const baseDialogRef = ref<typeof BaseDialogForm | null>(null);

const loadCurrentStock = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateStock: loadCurrentStock");
  resetForm();
  const currentStock = records.stocks.getById(runtime.activeId);

  // Bail out instead of leaving the dialog open on a blank form, mirroring
  // UpdateBooking.vue's guard — a failed lookup must not be able to turn an
  // update into an insert. `resetForm()` above leaves `id` at -1, so
  // mapStockFormToDb's `data.id > 0` gate is false, and it returns an object
  // with NO cID. validateStock then rebuilds that as `cID: 0`,
  // baseRepository.save() reads 0 as "not an update" and `store.add()`s a
  // duplicate stock — while records.stocks.update() resolves the same cID 0 to
  // the placeholder "no stock" sentinel (createPlaceholderStock) and
  // overwrites it, destroying BookingForm's blank picker option for the
  // session.
  if (!currentStock) {
    await alertAdapter.feedbackError(
        t("components.dialogs.updateStock.title"),
        browserAdapter.getMessage("xx_missing_record"),
        {data: {activeId: runtime.activeId}}
    );
    runtime.resetTeleport();
    return;
  }

  Object.assign(stockFormData, {
    id: runtime.activeId,
    isin: currentStock.cISIN.toUpperCase().replace(/\s/g, ""),
    company: currentStock.cCompany,
    symbol: currentStock.cSymbol,
    meetingDay: currentStock.cMeetingDay,
    quarterDay: currentStock.cQuarterDay,
    // Converted rather than copied: the DB columns are 1/0 while the form
    // fields are booleans bound to `v-checkbox`. `Object.assign<T, U>` returns
    // `T & U` and does not check assignability into `T`, so copying the raw
    // number through was silently accepted by TypeScript and left the field
    // holding a number until the first click replaced it with a boolean.
    fadeOut: currentStock.cFadeOut === 1,
    firstPage: currentStock.cFirstPage === 1,
    url: currentStock.cURL,
    askDates: currentStock.cAskDates
  });
};

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS UpdateStock: onClickOk");

  await submitGuard({
    formRef: baseDialogRef.value?.formRef,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorContext: "UPDATE_STOCK",
    errorTitle: t("components.dialogs.onClickOk"),
    operation: async () => {
      const stock = mapStockFormToDb(activeAccountId.value) as StockDb;
      await updateStockUsecase(
          {
            repositories,
            records: toRecordsPort(records),
            runtime
          },
          {stock}
      );

      await alertAdapter.feedbackInfo(
          t("components.dialogs.updateStock.title"),
          t("components.dialogs.updateStock.messages.success")
      );
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.updateStock.title"), isLoading: () => isLoading.value});

onBeforeMount(() => {
  log("COMPONENTS DIALOGS UpdateStock: onBeforeMount");
  void loadCurrentStock();
});

log("COMPONENTS DIALOGS UpdateStock: setup");
</script>

<template>
  <BaseDialogForm ref="baseDialogRef" :is-loading="isLoading">
    <StockForm :isUpdate="true"/>
  </BaseDialogForm>
</template>
