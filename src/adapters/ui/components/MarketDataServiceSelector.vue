<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Selector for the commodity/index market-data source — one
 * shared setting for both materials and indexes, deliberately: they always
 * use the same provider rather than being independently selectable. Lives
 * on the Topics & Services tab (alongside `ServiceSelector`, the separate
 * stock-quote provider), not on the Indexes or Commodities tabs.
 * `MarketDataServiceName` is its own, narrower type — only "fnet" and
 * "wstreet" ever supply commodity/index data.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {FETCH} from "@/domain/constants";
import type {MarketDataServiceName} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

// Real provider brand names (Finanzen.Net, Wallstreet-Online) — untranslated,
// the same choice `ServiceSelector`/`createServiceLabelOverrides` make.
const MARKET_DATA_SERVICES: readonly MarketDataServiceName[] = ["fnet", "wstreet"];

const {t} = useI18n();
const settings = useSettingsStore();

const marketDataService = computed({
  get: () => settings.marketDataService,
  set: (next: string) => {
    log("COMPONENTS MarketDataServiceSelector: setMarketDataService");
    void settings.setMarketDataService(next);
  }
});

const serviceLabel = (item: MarketDataServiceName): string =>
    FETCH.PROVIDERS[item]?.NAME ?? item;

log("COMPONENTS MarketDataServiceSelector: setup");
</script>

<template>
  <p class="text-body-2 text-medium-emphasis mb-2">
    {{ t("views.optionsIndex.marketDataSource.hint") }}
  </p>
  <v-radio-group v-model="marketDataService" column>
    <v-radio
        v-for="item in MARKET_DATA_SERVICES"
        :key="item"
        :label="serviceLabel(item)"
        :value="item"/>
  </v-radio-group>
</template>
