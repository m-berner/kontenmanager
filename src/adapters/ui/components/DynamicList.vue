<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Dynamic list component for editing string collections like
 * markets or exchanges. Provides add/remove actions and emits updated arrays.
 */
import {storeToRefs} from "pinia";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS} from "@/domain/constants";
import type {DynamicListProps, ExchangeData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const props = defineProps<DynamicListProps>();

const {t} = useI18n();
const {fetchAdapter, alertAdapter} = useAdapters();
const runtime = useRuntimeStore();
const {infoExchanges} = storeToRefs(runtime);
const settings = useSettingsStore();
const {exchanges, markets} = storeToRefs(settings);

// `string | null`, not `string`: the input below is `clearable`, and Vuetify's
// clear button does not write "" - VTextField wires it to useValidation()'s
// `reset()`, which assigns `model.value = null`. TypeScript cannot catch the
// mismatch because the v-model prop is typed `any`, so a `ref<string>` was
// never contradicted; the first `newItem.trim()` after a clear then threw
// "Cannot read properties of null" inside the render function and took the
// whole card down. Same root cause as the `clearable` v-select findings, on
// the tree's only `clearable` v-text-field.
const newItem = ref<string | null>("");
const isAdding = ref<boolean>(false);

const fallbackLabel = computed(() => t("components.dynamicList.fallbackLabel"));
const label = computed(() => {
  const labelMap: Record<string, string> = {
    [COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES]: t(
        "views.optionsIndex.exchanges.label"
    ),
    [COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS]: t(
        "views.optionsIndex.markets.label"
    )
  };
  return labelMap[props.type] || fallbackLabel.value;
});
const title = computed(() => {
  const titleMap: Record<string, string> = {
    [COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES]: t(
        "views.optionsIndex.exchanges.title"
    ),
    [COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS]: t(
        "views.optionsIndex.markets.title"
    )
  };
  return titleMap[props.type] || fallbackLabel.value;
});

/**
 * The list this instance edits — the settings store's own array, not a copy.
 *
 * This component used to keep a private `list` ref, filled by a `getStorage`
 * read in `onBeforeMount` and written back with a bare `setStorage`, while ALSO
 * pushing each add into `markets`/`exchanges`. Two owners for one key, with the
 * persisted value taken from the private copy — plus a hand-rolled optimistic
 * update and rollback (`removeByValue`) duplicating what `updateSetting`
 * already does.
 */
const currentList = computed<string[]>(() => {
  switch (props.type) {
    case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      return markets.value;
    case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      return exchanges.value;
    default:
      return [];
  }
});

/**
 * Persists a whole new list through the store.
 *
 * `{rethrow: true}` because this component reports failures itself and, for
 * exchanges, has to compensate by restoring the rate it removed alongside the
 * entry — neither of which it can do if the store has already swallowed the
 * error. The store reverts its own ref regardless, so there is no list rollback
 * left to do here.
 */
const persist = async (next: string[]): Promise<void> => {
  switch (props.type) {
    case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
      await settings.setMarkets(next, {rethrow: true});
      break;
    case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
      await settings.setExchanges(next, {rethrow: true});
      break;
    default:
  }
};

const addItem = async (item: string | null): Promise<void> => {
  log("COMPONENTS DynamicList: addItem");
  const trimmedItem = item?.trim() ?? "";
  if (!trimmedItem) return; // Validate input (also covers the cleared `null`)

  // Normalize before the duplicate check, not after: EXCHANGES entries are
  // stored uppercased, so checking the raw (possibly lowercase) input against
  // an already-uppercased list let case variants of the same entry through.
  const normalizedItem = props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES
      ? trimmedItem.toUpperCase()
      : trimmedItem;

  // Re-adding an existing entry used to fall through the whole function
  // silently: no message, and `newItem` was not even cleared (that only
  // happened on the success path), so the button looked broken. Tell the user
  // instead of doing nothing.
  if (currentList.value.includes(normalizedItem)) {
    await alertAdapter.feedbackInfo(
        t("components.dynamicList.errorTitle"),
        t("components.dynamicList.duplicate")
    );
    return;
  }

  isAdding.value = true; // Start loading

  try {
    await persist([...currentList.value, normalizedItem]);

    if (props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES) {
      // fetchExchangesData resolves per-code (Promise.allSettled internally) and
      // omits any code that failed to quote rather than rejecting the whole
      // call — the add itself is already persisted above, so a missing rate here
      // must not be treated as an add failure. It is picked up on a later
      // refresh or re-add.
      const exchangesInfoData: ExchangeData[] =
          await fetchAdapter.fetchExchangesData([normalizedItem]);
      if (exchangesInfoData[0]) {
        // Key by the item this call actually added, not by whatever happens to
        // sit last in `exchanges` now. The fetch above is awaited, and the
        // cross-context storage listener (stores/settings.ts applyStorageChange)
        // can replace the whole array meanwhile, so the tail is not reliably
        // this add's entry — the rate would then attach to the wrong code.
        infoExchanges.value.set(normalizedItem, exchangesInfoData[0].value);
      }
    }

    newItem.value = "";
  } catch (err) {
    await alertAdapter.feedbackError(t("components.dynamicList.errorTitle"), err, {});
  } finally {
    isAdding.value = false; // Stop loading
  }
};

const removeItem = async (n: number): Promise<void> => {
  log("COMPONENTS DynamicList: removeItem");
  const removedItem = currentList.value[n];
  if (removedItem === undefined) return;

  // Captured before the delete below so the rollback can put it back — this
  // removal happens optimistically, before the write that may fail.
  const removedRate = infoExchanges.value.get(removedItem);

  if (props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES) {
    // Otherwise this Map grows for the lifetime of the session across
    // add/remove cycles; the stale entry is inert (only ever looked up for
    // exchanges still present in settings.exchanges) but never freed.
    infoExchanges.value.delete(removedItem);
  }

  try {
    await persist(currentList.value.filter((_, index) => index !== n));
  } catch (err) {
    // The list itself is restored by the store. Only the rate is this
    // component's to put back: without it a failed write leaves the exchange
    // listed but rate-less until the next refresh — an incomplete rollback that
    // silently contradicts the "nothing happened" the error alert implies.
    if (
        props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES &&
        removedRate !== undefined
    ) {
      infoExchanges.value.set(removedItem, removedRate);
    }
    await alertAdapter.feedbackError(t("components.dynamicList.errorTitle"), err, {});
  }
};

log("COMPONENTS DynamicList: setup");
</script>

<template>
  <v-card :title="title" color="secondary">
    <!--
      No loading state. The list comes from the settings store, which the options
      entrypoint has already loaded, so there is nothing to wait for — this
      component used to run a `getStorage` read of its own purely to populate a
      ref the store was holding anyway.
    -->
    <v-list bg-color="secondary">
      <v-list-item
          v-for="(item, i) in currentList"
          :key="item"
          :title="item"
          hide-details>
        <template v-slot:prepend>
          <v-btn
              :disabled="isAdding"
              class="mr-3"
              icon="$close"
              @click="removeItem(i)"/>
        </template>
      </v-list-item>

      <!-- Empty State -->
      <v-list-item v-if="currentList.length === 0">
        <v-list-item-title class="text-center text-grey">
          {{ t("components.dynamicList.emptyState") }}
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-text-field
          v-model="newItem"
          :autofocus="true"
          :clearable="true"
          :disabled="isAdding"
          :label="label"
          :placeholder="props.placeholder"
          type="text">
        <template v-slot:append>
          <v-btn
              :disabled="!newItem?.trim() || isAdding"
              :loading="isAdding"
              class="ml-3"
              color="primary"
              icon="$add"
              @click="addItem(newItem)"/>
        </template>
      </v-text-field>
    </v-card-actions>
  </v-card>
</template>
