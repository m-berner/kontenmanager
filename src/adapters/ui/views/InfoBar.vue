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
import {storeToRefs} from "pinia";
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {createMaterialLabel, SETTINGS} from "@/domain/constants";
import type {MaterialItemKeyType} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useRuntimeStore} from "@/adapters/ui/stores/runtime";
import {useSettingsStore} from "@/adapters/ui/stores/settings";

const {n, t} = useI18n();
const runtime = useRuntimeStore();
const {curUsd, infoMaterials} = storeToRefs(runtime);
const settings = useSettingsStore();

const materialValues = computed(() => {
  const result = new Map<string, { usd: number; local: number }>();

  // `curUsd` starts at 1 and is only replaced once the exchange fetch succeeds,
  // but a provider returning an unparseable or zero rate would leave a 0 here
  // and render every material price as "Infinity". useOnlineStockData guards the
  // very same conversion (`rawDivisor > 0 ? rawDivisor : 1`); this second call
  // site did not. Falling back to 1 shows the unconverted USD figure, which is
  // wrong-but-plausible rather than visibly broken - the same choice the other
  // call site already makes.
  const rate = curUsd.value > 0 ? curUsd.value : 1;

  for (const item of settings.materials) {
    const code = SETTINGS.MATERIALS[item] ?? "";
    const usdValue = infoMaterials.value.get(code);

    // No entry means the fetch failed, the row was skipped as unparseable
    // (fetchMaterialData does exactly that rather than reporting a phantom 0),
    // or SETTINGS.MATERIALS' label no longer matches the scraped column text.
    // Leave the item out so the template renders nothing, instead of coercing
    // to 0 and displaying "$0.00 / 0,00 €" as a real commodity price.
    if (usdValue === undefined) continue;

    result.set(item, {usd: usdValue, local: usdValue / rate});
  }

  return result;
});

log("VIEWS InfoBar: setup");
</script>

<template>
  <v-app-bar app color="secondary" flat>
    <v-list bg-color="secondary" class="horizontal-list" lines="two">
      <!--
        Blank, not a fallback number. fetchExchangesData DROPS any code that
        failed to quote (Promise.allSettled -> filter(fulfilled)), so an absent
        entry means "not fetched", not "parity". Rendering `?? 1` showed
        "1,000" — a fabricated, real-looking rate, and real only for a currency
        against itself. Same phantom-value class the codebase already rejected
        twice: fetchMaterialData skips an unparseable material row rather than
        reporting 0, and CompanyContent renders an empty cell for a
        quote/52-week value of 0. `?? 0` on the indexes row below had the same
        problem — an index is never legitimately 0 either.
      -->
      <v-list-item v-for="item in settings.exchanges" :key="item">
        <v-list-item-title>{{ item }}</v-list-item-title>
        <v-list-item-subtitle>
          <template v-if="runtime.infoExchanges.get(item) !== undefined">
            {{ n(runtime.infoExchanges.get(item) as number, "decimal3") }}
          </template>
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.indexes" :key="item">
        <v-list-item-title>{{ SETTINGS.INDEXES[item] }}</v-list-item-title>
        <v-list-item-subtitle>
          <template v-if="runtime.infoIndexes.get(item) !== undefined">
            {{ n(runtime.infoIndexes.get(item) as number, "integer") }}
          </template>
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-for="item in settings.materials" :key="item">
        <v-list-item-title>
          {{ createMaterialLabel(t, item as MaterialItemKeyType) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          <template v-if="materialValues.get(item)">
            {{
              n(materialValues.get(item)!.usd, "currencyUSD") +
              " / " +
              n(materialValues.get(item)!.local, "currency")
            }}
          </template>
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

