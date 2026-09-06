<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Global alert/confirmation overlay component.
 * Renders queued alerts from `useAlertsStore` and a confirmation dialog when requested.
 * Provides non-blocking, app-wide feedback for success, info, warning, and error messages.
 */
import {storeToRefs} from "pinia";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

import type {ConfirmationDialogData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAlertsStore} from "@/adapters/ui/stores/alerts";

const {t} = useI18n();
const alertStore = useAlertsStore();
const {dismissAlert, handleConfirm, handleCancel} = alertStore;
const {
  currentAlert,
  confirmationDialog,
  showOverlay,
  showConfirmation,
  pendingCount
} = storeToRefs(alertStore);

/**
 * Cache the last non-empty alert payload.
 * This avoids a brief empty render while the overlay is leaving:
 * store state is reset immediately, but Vuetify still runs the leave transition.
 */
const renderedAlert = ref({
  title: "",
  message: "",
  type: "info" as "error" | "success" | "warning" | "info"
});

watch(
    currentAlert,
    (next) => {
      if (next && next.id > -1) {
        renderedAlert.value = {
          title: next.title,
          message: next.message,
          type: next.type ?? "info"
        };
      }
    },
    {immediate: true}
);

/**
 * Same caching as `renderedAlert` above, applied to the confirmation dialog:
 * handleConfirm/handleCancel reset confirmationDialog synchronously (back to
 * empty title/message/generic labels and the default "warning" icon), but
 * the v-dialog still runs its own leave transition - without this cache the
 * confirmation text/icon visibly flash to blank/generic defaults on every
 * dismissal, mid-transition.
 */
const renderedConfirmation = ref({
  title: "",
  message: "",
  confirmText: "",
  cancelText: "",
  type: "warning" as ConfirmationDialogData["type"]
});

watch(
    confirmationDialog,
    (next) => {
      if (next.id > -1) {
        renderedConfirmation.value = {
          title: next.title,
          message: next.message,
          confirmText: next.confirmText,
          cancelText: next.cancelText,
          type: next.type
        };
      }
    },
    {immediate: true}
);

const confirmationIcon = computed(() => {
  return `$${renderedConfirmation.value.type}`;
});

log("COMPONENTS AlertOverlay: setup");
</script>

<template>
  <!-- Standard Alert Overlay -->
  <v-overlay
      :model-value="showOverlay"
      class="align-center justify-center"
      persistent>
    <v-card class="mx-auto" max-width="500">
      <v-card-text class="pa-6">
        <v-alert
            :title="renderedAlert.title"
            :type="renderedAlert.type"
            variant="tonal">
          {{ renderedAlert.message }}
          <template #append>
            <v-btn
                density="compact"
                icon="$close"
                variant="text"
                @click="dismissAlert(currentAlert?.id)"/>
          </template>
        </v-alert>
      </v-card-text>
      <!--
        Translated, not a literal. This was the app's only hardcoded English
        string in user-visible markup, so a German user read "3 more alerts
        pending"; scripts/i18n-lint cannot catch that, since it verifies that
        used keys EXIST rather than that rendered text is keyed.
        Phrased with a trailing count instead of an English plural-`s` so it
        needs no pluralization rules to read correctly for any value.
      -->
      <v-card-text
          v-if="pendingCount > 0"
          class="text-center text-caption pb-4">
        {{ t("components.alertOverlay.pendingAlerts", {count: pendingCount}) }}
      </v-card-text>
    </v-card>
  </v-overlay>

  <!-- Confirmation Dialog -->
  <v-dialog :model-value="showConfirmation" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon
            :color="renderedConfirmation.type"
            :icon="confirmationIcon"
            class="mr-3"
            size="large">
        </v-icon>
        <span>{{ renderedConfirmation.title }}</span>
      </v-card-title>

      <v-card-text class="pa-4">
        {{ renderedConfirmation.message }}
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer/>
        <v-btn variant="text" @click="handleCancel">
          {{ renderedConfirmation.cancelText }}
        </v-btn>
        <v-btn
            :color="renderedConfirmation.type"
            variant="elevated"
            @click="handleConfirm">
          {{ renderedConfirmation.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

