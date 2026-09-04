<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Selector for the market index level data source. Same shape
 * as `MaterialsServiceSelector`, deliberately separate from it and from
 * `ServiceSelector` (the stock-quote provider): `IndexesServiceName` is its
 * own, narrower type — only "fnet" and "wstreet" ever supply index levels.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {FETCH} from "@/domain/constants";
import type {IndexesServiceName} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

// Real provider brand names (Finanzen.Net, Wallstreet-Online) — untranslated,
// the same choice `ServiceSelector`/`createServiceLabelOverrides` make.
const INDEXES_SERVICES: readonly IndexesServiceName[] = ["fnet", "wstreet"];

const {t} = useI18n();
const settings = useSettingsStore();

const indexesService = computed({
  get: () => settings.indexesService,
  set: (next: string) => {
    log("COMPONENTS IndexesServiceSelector: setIndexesService");
    void settings.setIndexesService(next);
  }
});

const serviceLabel = (item: IndexesServiceName): string =>
    FETCH.PROVIDERS[item]?.NAME ?? item;

log("COMPONENTS IndexesServiceSelector: setup");
</script>

<template>
  <p class="text-body-2 text-medium-emphasis mb-2">
    {{ t("views.optionsIndex.indexesSource.hint") }}
  </p>
  <v-radio-group v-model="indexesService" column>
    <v-radio
        v-for="item in INDEXES_SERVICES"
        :key="item"
        :label="serviceLabel(item)"
        :value="item"/>
  </v-radio-group>
</template>
