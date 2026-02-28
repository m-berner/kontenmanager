<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview InfoBar component displays contextual market information in a
 * compact horizontal list: selected exchanges, indexes, and materials with
 * their current values. It converts USD‑denominated material prices to the
 * local currency using the runtime exchange rate.
 */
import {computed, onBeforeMount} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRuntimeStore} from "@/stores/runtime";
import {useSettingsStore} from "@/stores/settings";
import {DomainUtils} from "@/domains/utils";
import {STORES} from "@/configs/stores";
import {createMaterialLabel} from "@/configs/views";
import type {MaterialItemKeyType} from "@/types";

const {n, t} = useI18n();
const runtime = useRuntimeStore();
const {curUsd, infoMaterials} = storeToRefs(runtime);
const settings = useSettingsStore();

// Compute values once
const materialValues = computed(() => {
  const result = new Map<string, { usd: number; local: number }>();

  for (const item of settings.materials) {
    const code = STORES.MATERIALS[item] ?? "";
    const usdValue = infoMaterials.value.get(code) ?? 0;
    const localValue = usdValue / curUsd.value;

    result.set(item, {usd: usdValue, local: localValue});
  }

  return result;
});

onBeforeMount(() => {
  DomainUtils.log("VIEWS InfoBar: onBeforeMount");
});

DomainUtils.log("VIEWS InfoBar: setup");
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <v-list bg-color="secondary" class="horizontal-list" lines="two">
      <v-list-item v-for="item in settings.exchanges" :key="item">
        <v-list-item-title>{{ item }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ n(runtime.infoExchanges.get(item) ?? 1, "decimal3") }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.indexes" :key="item">
        <v-list-item-title>{{ STORES.INDEXES[item] }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ n(runtime.infoIndexes.get(item) ?? 0, "integer") }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.materials" :key="item">
        <v-list-item-title>
          {{ createMaterialLabel(t, item as MaterialItemKeyType) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{
            n(materialValues.get(item)?.usd ?? 0, "currencyUSD") +
            " / " +
            n(materialValues.get(item)?.local ?? 0, "currency")
          }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-app-bar>
</template>

<style scoped>
.horizontal-list {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;

  /* Hide scrollbar */

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
