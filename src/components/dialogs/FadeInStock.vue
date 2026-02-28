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
import {DomainUtils} from "@/domains/utils";
import {useStocksDB} from "@/composables/useIndexedDB";
import {useBrowser} from "@/composables/useBrowser";
import {useDialogGuards} from "@/composables/useDialogGuards";
import {databaseService} from "@/services/database/service";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const {getMessage, showSystemNotification} = useBrowser();
const {update} = useStocksDB();
const {isLoading, ensureConnected, withLoading} = useDialogGuards(t);
const runtime = useRuntimeStore();
const records = useRecordsStore();

const selected = ref<StockItem | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS DIALOGS FadeInStock: onClickOk");

  if (
      !(await ensureConnected(
          databaseService.isConnected(),
          showSystemNotification
      ))
  )
    return;

  if (!selected.value) {
    await showSystemNotification("FadeInStock", getMessage("xx_db_no_selected"));
    return;
  }

  await withLoading(async () => {
    try {
      const stock = selected.value!;
      stock.cFadeOut = 0;

      await update(stock);
      records.stocks.update(stock);
      await showSystemNotification("FadeInStock", getMessage("xx_db_fade_in"));
      runtime.resetTeleport();
    } catch (err) {
      await alertService.feedbackError("FadeInStock", err, {});
    }
  });
};

defineExpose({onClickOk, title: t("components.dialogs.fadeInStock.title")});

onBeforeMount(() => {
  DomainUtils.log("COMPONENTS DIALOGS FadeInStock: onBeforeMount");
  selected.value = null;
});

DomainUtils.log("COMPONENTS DIALOGS FadeInStock: setup");
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
