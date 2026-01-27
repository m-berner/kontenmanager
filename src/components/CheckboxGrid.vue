<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { AppError } from "@/domains/errors";
import { UtilsService } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import type { CheckboxGridProps } from "@/types";
import { STORES } from "@/config/stores";
import { BROWSER_STORAGE } from "@/config/storage";
import { COMPONENTS } from "@/config/components";

const props = defineProps<CheckboxGridProps>();
const { t } = useI18n();
const { getStorage, setStorage } = useStorage();

const checked = ref<string[]>([]);
const isLoading = ref<boolean>(true);
const isSaving = ref<boolean>(false);
const error = ref<string | null>(null);

const config = computed(() => {
  if (props.type === COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES) {
    return {
      map: STORES.INDEXES,
      storageKey: BROWSER_STORAGE.INDEXES.key,
      labelPath: null
    };
  }
  return {
    map: STORES.MATERIALS,
    storageKey: BROWSER_STORAGE.MATERIALS.key,
    labelPath: "views.optionsIndex.materials"
  };
});
const boxes = computed((): { A: string[]; B: string[] } => {
  const keys = Array.from(config.value.map.keys());
  const half = Math.ceil(keys.length / 2);
  return {
    A: keys.slice(0, half),
    B: keys.slice(half)
  };
});

const getLabel = (item: string): string => {
  if (config.value.labelPath) {
    return t(`${config.value.labelPath}.${item}`);
  }
  return config.value.map.get(item) || item;
};

const setChecked = async (): Promise<void> => {
  isSaving.value = true;
  error.value = null;

  try {
    await setStorage(config.value.storageKey, [...checked.value]);
  } catch (err) {
    error.value =
      err instanceof AppError
        ? err.message
        : err instanceof Error
        ? err.message
        : "Failed to save selection";
    UtilsService.log("CHECKBOX_GRID: setChecked error", err);
  } finally {
    isSaving.value = false;
  }
};

onBeforeMount(async () => {
  UtilsService.log("CHECKBOX_GRID: onBeforeMount");
  isLoading.value = true;
  error.value = null;

  try {
    const storage = await getStorage([config.value.storageKey]);
    checked.value = (storage[config.value.storageKey] as string[]) || [];
  } catch (err) {
    error.value =
      err instanceof AppError
        ? err.message
        : err instanceof Error
        ? err.message
        : "Failed to load selections";
    UtilsService.log("CHECKBOX_GRID: onBeforeMount error", err);
  } finally {
    isLoading.value = false;
  }
});

UtilsService.log("--- CheckboxGrid.vue setup ---");
</script>

<template>
  <!-- Loading State -->
  <v-col v-if="isLoading" class="text-center" cols="12">
    <v-progress-circular color="primary" indeterminate />
    <p class="mt-3">{{ t("components.checkboxGrid.loading") }}</p>
  </v-col>

  <!-- Error State -->
  <v-col v-if="error && !isLoading" cols="12">
    <v-alert dismissible type="error" @click:close="error = null">
      {{ error }}
    </v-alert>
  </v-col>

  <!-- Content State with Saving Indicator -->
  <template v-if="!isLoading">
    <v-row no-gutters>
      <v-col
        v-for="(items, key) in boxes"
        :key="key"
        :class="{ 'opacity-50': isSaving }"
      >
        <v-checkbox
          v-for="item in items"
          :key="item"
          v-model="checked"
          :disabled="isSaving"
          :label="getLabel(item)"
          :value="item"
          hide-details
          @change="setChecked"
        />
      </v-col>
    </v-row>

    <!-- Optional: Saving indicator -->
    <v-col v-if="isSaving" class="text-center" cols="12">
      <v-chip color="primary" size="small">
        <v-progress-circular class="mr-2" indeterminate size="16" width="2" />
        {{ t("components.checkboxGrid.saving") }}
      </v-chip>
    </v-col>
  </template>
</template>

<style scoped>
.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}
</style>
