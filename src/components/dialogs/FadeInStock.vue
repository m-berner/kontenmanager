<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import type { StockItem } from "@/types";
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import {
  AppError,
  ERROR_CATEGORY,
  ERROR_CODES,
  serializeError
} from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useStocksDB } from "@/composables/useIndexedDB";
import { useUserInfo } from "@/composables/useUserInfo";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";

const { t } = useI18n();
const { handleUserInfo } = useUserInfo();
const { update } = useStocksDB();
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const runtime = useRuntimeStore();
const records = useRecordsStore();

const selected = ref<StockItem | null>(null);

const onClickOk = async (): Promise<void> => {
  DomainUtils.log("FADE_IN_STOCK: onClickOk");

  if (
    !(await ensureConnected(
      databaseService.isConnected(),
      handleUserInfo,
      t("components.dialogs.fadeInStock.messages.dbNotConnected")
    ))
  )
    return;

  if (!selected.value) {
    await handleUserInfo("notice", "FadeInStock", "no stock", {
      noticeLines: [t("messages.noStockSelected")]
    });
    return;
  }

  await withLoading(async () => {
    try {
      const stock = selected.value!;
      stock.cFadeOut = 0;

      await update(stock);
      records.stocks.update(stock);
      await handleUserInfo("notice", "FadeInStock", "success", {
        noticeLines: [t("components.dialogs.fadeInStock.messages.success")]
      });
      runtime.resetTeleport();
    } catch (err) {
      throw new AppError(
        ERROR_CODES.FADE_IN_STOCK,
        ERROR_CATEGORY.VALIDATION,
        {
          input: serializeError(err),
          entity: "FadeInStock",
          stockId: selected.value!.cID as number
        },
        true
      );
    }
  });
};

defineExpose({ onClickOk, title: t("components.dialogs.fadeInStock.title") });

onBeforeMount(() => {
  DomainUtils.log("FADE_IN_STOCK: onBeforeMount");
  selected.value = null;
});

handleUserInfo("console", "FadeInStock", "--- vue setup ---", {
  logLevel: "log"
});
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
        variant="outlined"
      />
    </v-card-text>
    <v-overlay
      v-model="isLoading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>
  </v-form>
</template>
