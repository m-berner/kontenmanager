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

import type {StockItem} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/ui/composables/useDialogGuards";
import {useRecordsStore} from "@/adapters/ui/stores/recordsHub";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";

const {t} = useI18n();
const {isLoading, submitGuard} = useDialogGuards(t);
const runtime = useRuntimeStore();
const records = useRecordsStore();
const {databaseAdapter, browserAdapter, alertAdapter, repositories} = useAdapters();

const selected = ref<StockItem | null>(null);

const onClickOk = async (): Promise<void> => {
  log("COMPONENTS DIALOGS FadeInStock: onClickOk");

  await submitGuard({
    // no fillable form — a single selector, checked inside the operation.
    // Declared explicitly because submitGuard's validation gate is
    // fail-closed: omitting formRef no longer means "skip validation", so an
    // accidental undefined cannot pass for a deliberate omission.
    skipValidation: true,
    isConnected: databaseAdapter.isConnected(),
    connectionErrorMessage: browserAdapter.getMessage("xx_db_connection_err"),
    showSystemNotification: alertAdapter.feedbackInfo,
    errorTitle: t("components.dialogs.fadeInStock.title"),
    errorContext: "FADE_IN_STOCK",
    operation: async () => {
      // Moved inside submitGuard, following DeleteBookingType's fix: as a
      // pre-check this sat outside the isLoading reentrancy guard, and reading
      // the selection here rather than at click time is what makes the
      // non-null assertion below sound rather than merely true-in-practice.
      if (!selected.value) {
        await alertAdapter.feedbackInfo("FadeInStock", browserAdapter.getMessage("xx_db_no_selected"));
        return;
      }

      // Build a fresh object instead of mutating `selected.value` in place:
      // with return-object, v-model is bound directly to the
      // live store record (records.stocks.passive doesn't clone), so writing
      // to it here would flip the stock to "active" in the UI immediately,
      // before the DB write below even starts - if repositories.stocks.save
      // then throws, the store would be left permanently out of sync with
      // the database until a reload. Only update the store after the save
      // actually succeeds, matching UpdateStock.vue's pattern.
      const stock = {...selected.value!, cFadeOut: 0};

      await updateStockUsecase(
          {repositories, records: toRecordsPort(records), runtime},
          {stock}
      );
      await alertAdapter.feedbackInfo("FadeInStock", browserAdapter.getMessage("xx_db_fade_in"));
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.fadeInStock.title"), isLoading: () => isLoading.value});

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
          item-title="cCompany"
          item-value="cID"
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
