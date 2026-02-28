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
import {useDialogGuards} from "@/composables/useDialogGuards";
import {DomainUtils} from "@/domains/utils";
import type {FormContract} from "@/types";
import {alertService} from "@/services/alert";

const {isLoading} = useDialogGuards();
const formRef = ref<FormContract | null>(null);
const hasError = ref(false);
const validationErrors = ref<string[]>([]);

// Error boundary for dialog component failures
onErrorCaptured((err, _instance, info) => {
  DomainUtils.log("COMPONENTS DIALOGS FORMS BaseDialogForm: Error captured", {err, info}, "error");
  hasError.value = true;
  void alertService.feedbackError("Dialog Error", err, {data: info});
  return false; // Prevent error from propagating
});

// Track validation errors
const hasValidationErrors = computed(() => validationErrors.value.length > 0);

// Enhanced form validation with error tracking
const validateForm = async (): Promise<boolean> => {
  validationErrors.value = [];

  if (!formRef.value) return false;

  try {
    const result = formRef.value.validate();
    const valid = result?.valid && !result?.errors?.length;

    if (!valid) {
      // Extract error messages from validation result
      validationErrors.value = result
          .errors!.map((err: string) => err)
          .flat()
          .filter(Boolean) as string[];
    }

    return valid;
  } catch (err) {
    DomainUtils.log("COMPONENTS DIALOGS FORMS BaseDialogForm: Validation error", err, "error");
    return false;
  }
};

defineExpose({formRef, validateForm});

DomainUtils.log("COMPONENTS DIALOGS FORMS BaseDialogForm: setup");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <template v-if="!hasError">
      <!-- Validation error summary -->
      <v-alert
          v-if="hasValidationErrors"
          type="warning"
          variant="tonal"
          class="ma-4"
          closable
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
      <v-alert type="error" variant="tonal" class="ma-4">
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
