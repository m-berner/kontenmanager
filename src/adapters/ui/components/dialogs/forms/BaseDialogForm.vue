<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Base dialog form wrapper component that provides:
 * - Loading overlay
 * - Error boundary for dialog failures
 * - Consistent structure for all dialog forms
 */
import {onErrorCaptured, ref} from "vue";
import {useI18n} from "vue-i18n";

import type {FormContract} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";

const props = defineProps<{isLoading?: boolean}>();

const {t} = useI18n();
const {alertAdapter} = useAdapters();
const formRef = ref<FormContract | null>(null);
const hasError = ref(false);

// Error boundary for dialog component failures
onErrorCaptured((err, _instance, info) => {
  log("COMPONENTS DIALOGS FORMS BaseDialogForm: Error captured", {err, info}, "error");
  hasError.value = true;
  void alertAdapter.feedbackError(t("components.dialogs.forms.baseDialogForm.errorTitle"), err, {data: info});
  return false; // Prevent error from propagating
});

defineExpose({formRef});

log("COMPONENTS DIALOGS FORMS BaseDialogForm: setup");
</script>

<template>
  <v-form ref="formRef" validate-on="submit" @submit.prevent>
    <template v-if="!hasError">
      <slot/>
    </template>
    <template v-else>
      <v-alert class="ma-4" type="error" variant="tonal">
        {{ t("components.dialogs.forms.baseDialogForm.loadError") }}
      </v-alert>
    </template>
    <v-overlay
        :model-value="props.isLoading ?? false"
        class="align-center justify-center"
        contained>
      <v-progress-circular color="primary" indeterminate size="64"/>
    </v-overlay>
  </v-form>
</template>
