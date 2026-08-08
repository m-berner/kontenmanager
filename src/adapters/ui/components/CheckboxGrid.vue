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
import {computed, onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";

import {BROWSER_STORAGE, COMPONENTS, createMaterialLabel, SETTINGS} from "@/domain/constants";
import {ERROR_DEFINITIONS, isAppError} from "@/domain/errors";
import type {CheckboxGridProps, MaterialItemKeyType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";

const toErrorMessage = (err: unknown): string =>
    isAppError(err) ? err.message : err instanceof Error ? err.message : ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG;

const props = defineProps<CheckboxGridProps>();
const {t} = useI18n();
const {storageAdapter} = useAdapters();
const {getStorage, setStorage} = storageAdapter();

const checked = ref<string[]>([]);
const isLoading = ref<boolean>(true);
const isSaving = ref<boolean>(false);
const error = ref<string | null>(null);

/**
 * Resolves the grid's data source, storage key and labelling mode.
 *
 * An exhaustive `switch` with an explicit `null` default, matching the shape the
 * sibling `DynamicList` already uses for its own two-type split. This was an
 * `if (INDEXES) { … } return MATERIALS` — so MATERIALS was not a branch, it was
 * the **fallback for everything that is not INDEXES**. A third type, or a typo
 * in the prop, did not fail: it silently rendered the materials grid, and
 * because `storageKey` comes from the same object, the first checkbox click
 * overwrote the user's saved materials selection in browser storage. Nothing
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
        storageKey: BROWSER_STORAGE.INDEXES.key,
        withLabel: false
      };
    case COMPONENTS.CHECKBOX_GRID.TYPES.MATERIALS:
      return {
        map: SETTINGS.MATERIALS,
        storageKey: BROWSER_STORAGE.MATERIALS.key,
        withLabel: true
      };
    default:
      return null;
  }
});
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

const setChecked = async (item: string): Promise<void> => {
  // Vuetify's v-model write happens on the native `input` event, which browsers
  // always fire before `change` (this handler's own trigger). So `checked.value`
  // already reflects the post-toggle state by the time we get here, and a
  // whole-array "previous" snapshot taken now would already be post-mutation
  // too. Roll back just this one item's toggle instead, computed from the
  // known `item` rather than a stale array snapshot.
  const activeConfig = config.value;
  // Unrecognised type: write nothing. Previously this path wrote to the
  // MATERIALS storage key by fallthrough — see the `config` comment above.
  if (!activeConfig) return;

  const isNowChecked = checked.value.includes(item);
  isSaving.value = true;
  error.value = null;

  try {
    await setStorage(activeConfig.storageKey, [...checked.value]);
  } catch (err) {
    checked.value = isNowChecked
        ? checked.value.filter((v) => v !== item)
        : [...checked.value, item];
    // Reported through the inline `v-alert` only. This used to *also* call
    // `alertAdapter.feedbackError`, so one failed `setStorage` produced two
    // simultaneous surfaces saying the same thing — an alert inside the grid and
    // the app-wide overlay — while the sibling `DynamicList` on the same options
    // page reports the same class of failure through the global alert alone.
    // Two components, same page, same kind of error, two different contracts.
    //
    // Resolved toward the inline one here because it sits next to the control
    // that failed and next to the checkbox whose toggle was just rolled back,
    // which the global overlay cannot convey. The error is logged either way.
    error.value = toErrorMessage(err);
    log("COMPONENTS CheckboxGrid: setStorage failed", err, "error");
  } finally {
    isSaving.value = false;
  }
};

onBeforeMount(async () => {
  log("COMPONENTS CheckboxGrid: onBeforeMount");
  isLoading.value = true;
  error.value = null;

  const activeConfig = config.value;
  if (!activeConfig) {
    isLoading.value = false;
    log("COMPONENTS CheckboxGrid: unknown type, rendering nothing", props.type, "warn");
    return;
  }

  try {
    const storage = await getStorage([activeConfig.storageKey]);
    const stored = storage[activeConfig.storageKey];
    checked.value = Array.isArray(stored)
        ? stored.filter((entry): entry is string => typeof entry === "string")
        : [];
  } catch (err) {
    // Inline only, matching `setChecked` above — one reporting contract per
    // component. The inline alert renders whenever `error` is set and loading
    // has finished, so a load failure is visible in the grid's own place.
    error.value = toErrorMessage(err);
    log("COMPONENTS CheckboxGrid: getStorage failed", err, "error");
  } finally {
    isLoading.value = false;
  }
});

log("COMPONENTS CheckboxGrid: setup");
</script>

<template>
  <!-- Loading State -->
  <v-col v-if="isLoading" class="text-center" cols="12">
    <v-progress-circular color="primary" indeterminate/>
    <p class="mt-3">{{ t("components.checkboxGrid.loading") }}</p>
  </v-col>

  <!-- Error State -->
  <v-col v-if="error && !isLoading" cols="12">
    <v-alert closable type="error" @click:close="error = null">
      {{ error }}
    </v-alert>
  </v-col>

  <!-- Content State with Saving Indicator -->
  <template v-if="!isLoading">
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
            @change="setChecked(item)"/>
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
</template>

<style scoped>
.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}
</style>
