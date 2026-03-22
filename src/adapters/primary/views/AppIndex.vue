<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview AppIndex is the application shell for the popup/app context.
 * It orchestrates startup initialization, theme application, and renders the
 * named view outlets (title, header, info, default, footer). Displays a
 * loading indicator until initialization completes.
 */

import {onBeforeMount, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {RouterView} from "vue-router";

import {log} from "@/domain/utils/utils";

import {useServices} from "@/adapters/context";
import AlertOverlay from "@/adapters/primary/components/AlertOverlay.vue";
import {useRecordsStore} from "@/adapters/primary/stores/records";
import {useRuntimeStore} from "@/adapters/primary/stores/runtime";
import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const settings = useSettingsStore();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const {alertService, appService, fetchService} = useServices();

// Invalidate online-rate caches when provider settings change (single instance for the app lifetime).
watch(() => settings.service, () => { runtime.clearStocksPages(); fetchService.clearCache?.(); });
watch(() => settings.activeAccountId, () => runtime.clearStocksPages());
watch(() => settings.stocksPerPage, () => runtime.clearStocksPages());

const isInitialized = ref(false);
let controller: AbortController | null = null;

onBeforeMount(async () => {
  log("VIEWS AppIndex: onBeforeMount");

  try {
    controller = new AbortController();
    const status = await appService.initializeApp(
        {records, settings, runtime},
        {
          title: t("mixed.smImportOnly.title"),
          message: t("mixed.smImportOnly.message")
        },
        controller.signal
    );
    log(
        "VIEWS AppIndex: onBeforeMount - Initialization successful",
        status,
        "info"
    );

    isInitialized.value = true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      log("VIEWS AppIndex: Initialization aborted");
      return;
    }
    await alertService.feedbackError(t("views.appIndex.init"), err, {});
  }
});

onUnmounted(() => {
  if (controller) {
    controller.abort();
  }
});

log("VIEWS AppIndex: setup", window.location.href, "info");
</script>

<template>
  <v-app :flat="true">
    <template v-if="isInitialized">
      <RouterView name="title"/>
      <RouterView name="header"/>
      <RouterView name="info"/>
      <v-main>
        <RouterView/>
      </v-main>
      <RouterView name="footer"/>
    </template>
    <template v-else>
      <v-main>
        <v-container
            class="d-flex align-center justify-center"
            style="min-height: 100vh">
          <v-progress-circular color="primary" indeterminate size="64"/>
        </v-container>
      </v-main>
    </template>
    <AlertOverlay/>
  </v-app>
</template>
