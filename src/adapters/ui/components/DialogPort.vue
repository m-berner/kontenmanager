<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Central dialog hub component.
 * Renders dialog components by name via Vue Teleport, driven by `useRuntimeStore`.
 * Ensures a single, centralized point for modal orchestration across the app.
 */
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import type {DialogComponent} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useRuntimeStore} from "@/adapters/ui/stores/runtime";

const {t} = useI18n();
const runtime = useRuntimeStore();

const dialogRef = ref<DialogComponent>();
const isLoading = computed(() => dialogRef.value?.isLoading?.() ?? false);

log("COMPONENTS DialogPort: setup");
</script>

<template>
  <Teleport to="body">
    <v-dialog
        :model-value="runtime.dialogVisibility"
        :persistent="true"
        width="500">
      <v-card>
        <v-card-title class="text-center">
          {{ dialogRef?.title }}
        </v-card-title>
        <v-card-text class="pa-5">
          <component :is="runtime.dialogName" ref="dialogRef"/>
        </v-card-text>
        <v-card-actions class="pa-5">
          <!--
            No `type="submit"` on the OK button, deliberately.

            It carried one and it was inert: this button lives in
            `<v-card-actions>`, while each dialog's `<v-form>` is inside the
            component rendered into `<v-card-text>` above. The button is
            therefore a SIBLING of the form, not a descendant, so it submits
            nothing. Every dialog's form also has `@submit.prevent`.

            The real mechanism is the `@click` below: `submitGuard` calls
            `formRef.validate()` explicitly and gates the operation on it. The
            attribute stated a mechanism that is not the one in use, which is
            worse than stating nothing — `validate-on="submit"` on each form
            reads as though it pairs with it.
          -->
          <v-tooltip :text="t('components.dialogs.ok')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                  v-if="runtime.dialogOk"
                  :disabled="isLoading"
                  :loading="isLoading"
                  class="ml-auto"
                  icon="$check"
                  type="button"
                  v-bind="props"
                  variant="outlined"
                  @click="dialogRef?.onClickOk"/>
            </template>
          </v-tooltip>
          <v-spacer/>
          <v-tooltip :text="t('components.dialogs.cancel')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                  :disabled="isLoading"
                  class="ml-auto"
                  icon="$close"
                  v-bind="props"
                  variant="outlined"
                  @click="runtime.resetTeleport"/>
            </template>
          </v-tooltip>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </Teleport>
</template>

