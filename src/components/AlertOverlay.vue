<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Global alert/confirmation overlay component.
 * Renders queued alerts from `useAlertStore` and a confirmation dialog when requested.
 * Provides non-blocking, app-wide feedback for success, info, warning, and error messages.
 */
import {computed, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useAlertStore} from "@/stores/alerts";
import {DomainUtils} from "@/domains/utils";

const alertStore = useAlertStore();
const {dismissAlert, handleConfirm, handleCancel} = alertStore;
const {
  currentAlert,
  confirmationDialog,
  showOverlay,
  showConfirmation,
  pendingCount
} = storeToRefs(alertStore);

const confirmationIcon = computed(() => {
  return `$${confirmationDialog.value.type}`;
});

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

DomainUtils.log("COMPONENTS AlertOverlay: setup");
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
            closable
            variant="tonal"
            @click:close="dismissAlert(currentAlert?.id)">
          {{ renderedAlert.message }}
        </v-alert>
      </v-card-text>
      <v-card-text
          v-if="pendingCount > 0"
          class="text-center text-caption pb-4">
        {{ pendingCount }} more alert{{ pendingCount !== 1 ? "s" : "" }} pending
      </v-card-text>
    </v-card>
  </v-overlay>

  <!-- Confirmation Dialog -->
  <v-dialog :model-value="showConfirmation" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon
            :icon="confirmationIcon"
            :color="confirmationDialog.type"
            class="mr-3"
            size="large">
        </v-icon>
        <span>{{ confirmationDialog.title }}</span>
      </v-card-title>

      <v-card-text class="pa-4">
        {{ confirmationDialog.message }}
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer/>
        <v-btn variant="text" @click="handleCancel">
          {{ confirmationDialog.cancelText }}
        </v-btn>
        <v-btn
            :color="confirmationDialog.type"
            variant="elevated"
            @click="handleConfirm">
          {{ confirmationDialog.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
