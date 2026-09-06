<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Checkbox grid for toggling visibility/selection of indexed
 * options (e.g., materials, indexes). Emits changes back to the parent via
 * props/model bindings.
 */
import {storeToRefs} from "pinia";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS, createMaterialLabel, SETTINGS} from "@/domain/constants";
import {ERROR_DEFINITIONS, isAppError} from "@/domain/errors";
import type {CheckboxGridProps, MaterialItemKeyType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

const toErrorMessage = (err: unknown): string =>
    isAppError(err) ? err.message : err instanceof Error ? err.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG;

const props = defineProps<CheckboxGridProps>();
const {t} = useI18n();
const settings = useSettingsStore();
const {indexes, materials} = storeToRefs(settings);

/**
 * The checkbox model — an editing buffer over the store, not a second copy of
 * it.
 *
 * This used to be loaded by a `getStorage` call of its own in `onBeforeMount`
 * and written back with a bare `setStorage`, so the same four keys had two
 * owners and this component carried its own hand-rolled optimistic-update and
 * rollback. It now seeds from `settings` and persists through the store's
 * setter, which owns both. The `watch` keeps it current when the value changes
 * elsewhere — including `settings.load()` resolving after this mounts, which is
 * the normal case on the options page (`options.ts` does not await it).
 */
const checked = ref<string[]>([]);
const isSaving = ref<boolean>(false);
const error = ref<string | null>(null);

/**
 * Resolves the grid's data source, the settings ref it edits, its setter and its
 * labelling mode.
 *
 * An exhaustive `switch` with an explicit `null` default, matching the shape the
 * sibling `DynamicList` already uses for its own two-type split. This was an
 * `if (INDEXES) { … } return MATERIALS` — so MATERIALS was not a branch, it was
 * the **fallback for everything that is not INDEXES**. A third type, or a typo
 * in the prop, did not fail: it silently rendered the materials grid, and
 * because the write target comes from the same object, the first checkbox click
 * overwrote the user's saved materials selection. Nothing
 * threw, nothing warned, and the InfoBar's material rates changed to match — the
 * symptom appearing in a component the developer never touched.
 *
 * Latent only today (`TYPES` holds exactly two members and `OptionsIndex` passes
 * them explicitly), which is precisely why the shape rather than the reachability
 * is the thing to fix: an unrecognised type is now inert instead of destructive.
 */
const config = computed(() => {
  switch (props.type) {
    case COMPONENTS.CHECKBOX_GRID.TYPES.INDEXES:
      return {
        map: SETTINGS.INDEXES,
        selected: indexes,
        persist: settings.setIndexes,
        withLabel: false
      };
    case COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      return {
        map: SETTINGS.MATERIALS,
        selected: materials,
        persist: settings.setMaterials,
        withLabel: true
      };
    default:
      return null;
  }
});

// Seeds the editing buffer and keeps it current when the value changes outside
// this component — `settings.load()` resolving after mount (options.ts does not
// await it), or another context writing the key.
watch(
    () => config.value?.selected.value,
    (next) => {
      checked.value = [...(next ?? [])];
    },
    {immediate: true, deep: true}
);
const boxes = computed((): { A: string[]; B: string[] } => {
  if (!config.value) return {A: [], B: []};
  const keys = Array.from(Object.keys(config.value.map));
  const half = Math.ceil(keys.length / 2);
  return {
    A: keys.slice(0, half),
    B: keys.slice(half)
  };
});
const getLabel = (item: MaterialItemKeyType): string => {
  if (!config.value) return item;
  if (config.value.withLabel) {
    return createMaterialLabel(t, item);
  }
  return config.value.map[item] || item;
};

const setChecked = async (): Promise<void> => {
  const activeConfig = config.value;
  // Unrecognised type: write nothing. Previously this path wrote to the
  // MATERIALS storage key by fallthrough - see the `config` comment above.
  if (!activeConfig) return;

  isSaving.value = true;
  error.value = null;

  // No hand-rolled rollback any more, and no per-item bookkeeping to get right.
  // `updateSetting` reverts the store ref when the persist fails, and the
  // `watch` above copies that revert back into `checked` - so the selection
  // returns to its last persisted state as a whole, rather than this component
  // un-toggling the one item it happened to be told about.
  //
  // `{rethrow: true}` is what lets the failure reach the `catch`: by default the
  // store reports it through the global alert instead.
  try {
    await activeConfig.persist([...checked.value], {rethrow: true});
  } catch (err) {
    // Reported through the inline `v-alert` only. It used to *also* call
    // `alertAdapter.feedbackError`, so one failed write produced two
    // simultaneous surfaces saying the same thing - an alert inside the grid and
    // the app-wide overlay - while the sibling `DynamicList` on the same options
    // page reports the same class of failure through the global alert alone.
    // Two components, same page, same kind of error, two different contracts.
    //
    // Resolved toward the inline one here because it sits next to the control
    // that failed and next to the checkbox whose toggle was just rolled back,
    // which the global overlay cannot convey. The error is logged either way.
    error.value = toErrorMessage(err);
    log("COMPONENTS CheckboxGrid: persisting the selection failed", err, "error");
  } finally {
    isSaving.value = false;
  }
};

log("COMPONENTS CheckboxGrid: setup");
</script>

<template>
  <!--
    No loading state. The selection comes from the settings store, which the
    options entrypoint has already loaded, so there is nothing to wait for — this
    component used to run a `getStorage` read of its own purely to populate a ref
    the store was holding anyway.
  -->
  <!-- Error State -->
  <v-col v-if="error" cols="12">
    <v-alert closable type="error" @click:close="error = null">
      {{ error }}
    </v-alert>
  </v-col>

  <!-- Content State with Saving Indicator -->
  <v-row no-gutters>
    <v-col
        v-for="(items, key) in boxes"
        :key="key"
        :class="{ 'opacity-50': isSaving }">
      <v-checkbox
          v-for="item in items"
          :key="item"
          v-model="checked"
          :disabled="isSaving"
          :label="getLabel(item as MaterialItemKeyType)"
          :value="item"
          hide-details
          @change="setChecked"/>
    </v-col>
  </v-row>

  <!-- Optional: Saving indicator -->
  <v-col v-if="isSaving" class="text-center" cols="12">
    <v-chip color="primary" size="small">
      <v-progress-circular class="mr-2" indeterminate size="16" width="2"/>
      {{ t("components.checkboxGrid.saving") }}
    </v-chip>
  </v-col>
</template>

<style scoped>
.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}
</style>
