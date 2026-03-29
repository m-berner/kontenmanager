<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Base dialog form wrapper component that provides:
 * - Form validation wrapper with visual feedback
 * - Loading overlay
 * - Error boundary for dialog failures
 * - Consistent structure for all dialog forms
 */
import {computed, onErrorCaptured, ref} from "vue";

import type {FormContract} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useDialogGuards} from "@/adapters/primary/composables/useDialogGuards";

const {isLoading} = useDialogGuards();
const {alertAdapter} = useAdapters();
const formRef = ref<FormContract | null>(null);
const hasError = ref(false);
const validationErrors = ref<string[]>([]);

// Error boundary for dialog component failures
onErrorCaptured((err, _instance, info) => {
  log("COMPONENTS DIALOGS FORMS BaseDialogForm: Error captured", {err, info}, "error");
  hasError.value = true;
  void alertAdapter.feedbackError("Dialog Error", err, {data: info});
  return false; // Prevent error from propagating
});

// Track validation errors
const hasValidationErrors = computed(() => validationErrors.value.length > 0);

// Enhanced form validation with error tracking
const validateForm = async (): Promise<boolean> => {
  validationErrors.value = [];

  if (!formRef.value) return false;

  try {
    const result = await formRef.value.validate();
    const errors = result?.errors ?? [];
    const valid = !!result?.valid && errors.length === 0;

    if (!valid) {
      // Extract error messages from validation result
      validationErrors.value = errors.filter(Boolean);
    }

    return valid;
  } catch (err) {
    log("COMPONENTS DIALOGS FORMS BaseDialogForm: Validation error", err, "error");
    return false;
  }
};

defineExpose({formRef, validateForm});

log("COMPONENTS DIALOGS FORMS BaseDialogForm: setup");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <template v-if="!hasError">
      <!-- Validation error summary -->
      <v-alert
          v-if="hasValidationErrors"
          class="ma-4"
          closable
          type="warning"
          variant="tonal"
          @click:close="validationErrors = []">
        <div class="text-subtitle-2 mb-2">Please fix the following errors:</div>
        <ul class="pl-4">
          <li v-for="(error, index) in validationErrors" :key="index">
            {{ error }}
          </li>
        </ul>
      </v-alert>

      <slot/>
    </template>
    <template v-else>
      <v-alert class="ma-4" type="error" variant="tonal">
        An error occurred while loading this dialog. Please try again.
      </v-alert>
    </template>
    <v-overlay
        v-model="isLoading"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
