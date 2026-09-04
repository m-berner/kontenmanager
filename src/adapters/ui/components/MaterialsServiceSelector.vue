<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Selector for the commodity/material price data source.
 * Deliberately separate from `ServiceSelector` (the stock-quote provider):
 * `MaterialsServiceName` is its own, narrower type — only "fnet" and
 * "wstreet" ever supply commodity prices, unlike the full `ServiceName`
 * roster ServiceSelector renders.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import {FETCH} from "@/domain/constants";
import type {MaterialsServiceName} from "@/domain/types";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/ui/stores/settings";

// Real provider brand names (Finanzen.Net, Wallstreet-Online) — untranslated,
// the same choice `ServiceSelector`/`createServiceLabelOverrides` make.
const MATERIALS_SERVICES: readonly MaterialsServiceName[] = ["fnet", "wstreet"];

const {t} = useI18n();
const settings = useSettingsStore();

const materialsService = computed({
  get: () => settings.materialsService,
  set: (next: string) => {
    log("COMPONENTS MaterialsServiceSelector: setMaterialsService");
    void settings.setMaterialsService(next);
  }
});

const serviceLabel = (item: MaterialsServiceName): string =>
    FETCH.PROVIDERS[item]?.NAME ?? item;

log("COMPONENTS MaterialsServiceSelector: setup");
</script>

<template>
  <p class="text-body-2 text-medium-emphasis mb-2">
    {{ t("views.optionsIndex.materialsSource.hint") }}
  </p>
  <v-radio-group v-model="materialsService" column>
    <v-radio
        v-for="item in MATERIALS_SERVICES"
        :key="item"
        :label="serviceLabel(item)"
        :value="item"/>
  </v-radio-group>
</template>
