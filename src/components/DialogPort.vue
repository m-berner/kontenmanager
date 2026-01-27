<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRuntimeStore } from "@/stores/runtime";
import { UtilsService } from "@/domains/utils";
import { useDialogGuards } from "@/composables/useDialogGuards";

const { t } = useI18n();
const runtime = useRuntimeStore();
const { isLoading } = useDialogGuards();

const dialogRef = ref<{ onClickOk: () => Promise<void>; title: string }>();

UtilsService.log("--- DialogPort.vue setup ---");
</script>

<template>
  <Teleport to="body">
    <v-dialog
      :model-value="runtime.dialogVisibility"
      :persistent="true"
      width="500"
    >
      <v-card>
        <v-card-title class="text-center">
          {{ dialogRef?.title }}
        </v-card-title>
        <v-card-text class="pa-5">
          <component :is="runtime.dialogName" ref="dialogRef" />
        </v-card-text>
        <v-card-actions class="pa-5">
          <v-tooltip :text="t('components.dialogs.ok')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                v-if="runtime.dialogOk"
                :disabled="isLoading"
                :loading="isLoading"
                class="ml-auto"
                icon="$check"
                type="submit"
                v-bind="props"
                variant="outlined"
                @click="dialogRef?.onClickOk"
              />
            </template>
          </v-tooltip>
          <v-spacer />
          <v-tooltip :text="t('components.dialogs.cancel')" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                class="ml-auto"
                icon="$close"
                v-bind="props"
                variant="outlined"
                @click="runtime.resetTeleport"
              />
            </template>
          </v-tooltip>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </Teleport>
</template>
