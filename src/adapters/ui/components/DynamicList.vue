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
import {computed, onBeforeMount, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";

import {BROWSER_STORAGE, COMPONENTS} from "@/domain/constants";
import type {DynamicListProps, ExchangeData} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useAdapters} from "@/adapters/context";
import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const props = defineProps<DynamicListProps>();

const {t} = useI18n();
const {storageAdapter, fetchAdapter, alertAdapter} = useAdapters();
const {getStorage, setStorage} = storageAdapter();
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
const list = ref<string[]>([]);
const isLoading = ref<boolean>(false);
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
 * Removes one occurrence of `value` by VALUE, not by position.
 *
 * Rollbacks must not use `pop()`/a captured index: `markets` and `exchanges`
 * are `storeToRefs` handles on the settings store, and its cross-context
 * storage listener (stores/settings.ts `applyStorageChange`) replaces the
 * WHOLE array when another context writes that key. That can happen during the
 * `await setStorage(...)` a rollback is undoing, so the tail is not reliably
 * this call's entry — popping it would silently delete an unrelated market or
 * exchange. Same reasoning the `infoExchanges.set()` below already documents.
 *
 * `lastIndexOf`, so the entry this call appended is the one removed even if a
 * duplicate slipped in from another context meanwhile.
 */
const removeByValue = (target: Ref<string[]>, value: string): void => {
  const index = target.value.lastIndexOf(value);
  if (index > -1) target.value.splice(index, 1);
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
  if (list.value?.includes(normalizedItem)) {
    await alertAdapter.feedbackInfo(
        t("components.dynamicList.errorTitle"),
        t("components.dynamicList.duplicate")
    );
    return;
  }

  isAdding.value = true; // Start loading

  try {
    switch (props.type) {
      case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
        list.value.push(normalizedItem);
        markets.value.push(normalizedItem);
        try {
          await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value]);
        } catch (err) {
          removeByValue(list, normalizedItem);
          removeByValue(markets, normalizedItem);
          // noinspection ExceptionCaughtLocallyJS
          throw err;
        }
        break;
      case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES: {
        list.value.push(normalizedItem);
        exchanges.value.push(normalizedItem);
        try {
          await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value]);
        } catch (err) {
          removeByValue(list, normalizedItem);
          removeByValue(exchanges, normalizedItem);
          // noinspection ExceptionCaughtLocallyJS
          throw err;
        }
        // fetchExchangesData resolves per-code (Promise.allSettled internally) and
        // omits any code that failed to quote rather than rejecting the whole call
        // — the add itself is already persisted above, so a missing rate here must
        // not be treated as an add failure. It's picked up on a later refresh/re-add.
        const exchangesInfoData: ExchangeData[] =
            await fetchAdapter.fetchExchangesData([normalizedItem]);
        if (exchangesInfoData[0]) {
          // Key by the item this call actually added, not by whatever happens
          // to sit last in `exchanges` now. The fetch above is awaited, and
          // the cross-context storage listener (stores/settings.ts
          // applyStorageChange) can replace the whole array meanwhile, so the
          // tail is not reliably this adds entry — the rate would then be
          // attached to the wrong exchange code.
          infoExchanges.value.set(normalizedItem, exchangesInfoData[0].value);
        }
        break;
      }
      default:
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
  if (n < 0) return;

  const removedItem = list.value[n];
  list.value.splice(n, 1);

  const storeList =
      props.type === COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS
          ? markets
          : props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES
              ? exchanges
              : undefined;
  const storeIndex = storeList?.value.indexOf(removedItem) ?? -1;
  if (storeIndex > -1) {
    storeList!.value.splice(storeIndex, 1);
  }

  // Captured before the delete below so the rollback can put it back — this
  // removal happens optimistically, before the storage write that may fail.
  const removedRate = infoExchanges.value.get(removedItem);

  if (props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES) {
    // Otherwise this Map grows for the lifetime of the session across
    // add/remove cycles; the stale entry is inert (only ever looked up for
    // exchanges still present in settings.exchanges) but never freed.
    infoExchanges.value.delete(removedItem);
  }

  try {
    switch (props.type) {
      case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS:
        await setStorage(BROWSER_STORAGE.MARKETS.key, [...list.value]);
        break;
      case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES:
        await setStorage(BROWSER_STORAGE.EXCHANGES.key, [...list.value]);
        break;
      default:
    }
  } catch (err) {
    list.value.splice(n, 0, removedItem);
    if (storeIndex > -1) {
      storeList!.value.splice(storeIndex, 0, removedItem);
    }
    // Restore the rate too, or a failed write leaves the exchange listed but
    // rate-less until the next refresh — an incomplete rollback that silently
    // contradicts the "nothing happened" the error alert implies.
    if (
        props.type === COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES &&
        removedRate !== undefined
    ) {
      infoExchanges.value.set(removedItem, removedRate);
    }
    await alertAdapter.feedbackError(t("components.dynamicList.errorTitle"), err, {});
  }
};

onBeforeMount(async () => {
  log("COMPONENTS DynamicList: onBeforeMount");
  isLoading.value = true;

  try {
    const storage = await getStorage([
      BROWSER_STORAGE.MARKETS.key,
      BROWSER_STORAGE.EXCHANGES.key
    ]);
    switch (props.type) {
      case COMPONENTS.DYNAMIC_LIST.TYPES.EXCHANGES: {
        // `stored*`, not `exchanges`/`markets`: those names are taken by the
        // reactive storeToRefs handles above, and a raw array off storage read
        // like the store handle is exactly the confusion worth avoiding here.
        const storedExchanges = storage[BROWSER_STORAGE.EXCHANGES.key];
        list.value = Array.isArray(storedExchanges)
            ? storedExchanges.filter(
                (entry): entry is string => typeof entry === "string"
            )
            : [];
      }
        break;
      case COMPONENTS.DYNAMIC_LIST.TYPES.MARKETS: {
        const storedMarkets = storage[BROWSER_STORAGE.MARKETS.key];
        list.value = Array.isArray(storedMarkets)
            ? storedMarkets.filter(
                (entry): entry is string => typeof entry === "string"
            )
            : [];
      }
        break;
    }
  } catch (err) {
    await alertAdapter.feedbackError(t("components.dynamicList.errorTitle"), err, {});
  } finally {
    isLoading.value = false;
  }
});

log("COMPONENTS DynamicList: setup");
</script>

<template>
  <v-card :title="title" color="secondary">
    <!-- Loading State -->
    <v-card-text v-if="isLoading" class="text-center">
      <v-progress-circular color="primary" indeterminate/>
      <p class="mt-3">{{ t("components.dynamicList.loading") }}</p>
    </v-card-text>

    <!-- Content State -->
    <template v-if="!isLoading">
      <v-list bg-color="secondary">
        <v-list-item
            v-for="(item, i) in list"
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
        <v-list-item v-if="list.length === 0">
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
    </template>
  </v-card>
</template>
