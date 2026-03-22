<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview OptionsIndex renders the extension options page. It provides
 * tabs for theme/service selection and configuration of markets, indexes,
 * materials, and exchanges. All content is rendered using dedicated components
 * and localized via Vue I18n.
 */
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

import {COMPONENTS, createTabs} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import AlertOverlay from "@/adapters/primary/components/AlertOverlay.vue";
import CheckboxGrid from "@/adapters/primary/components/CheckboxGrid.vue";
import DynamicList from "@/adapters/primary/components/DynamicList.vue";
import ServiceSelector from "@/adapters/primary/components/ServiceSelector.vue";
import ThemeSelector from "@/adapters/primary/components/ThemeSelector.vue";

const {t} = useI18n();

const TABS = computed(() => createTabs(t));
const DYNAMIC_LIST_TYPES = COMPONENTS.DYNAMIC_LIST.TYPES;
const CHECKBOX_GRID_TYPES = COMPONENTS.CHECKBOX_GRID.TYPES;

const tab = ref<number>(0);

log("VIEWS OptionsIndex: setup", window.location.href, "info");
</script>

<template>
  <v-app flat>
    <v-main>
      <v-container>
        <v-tabs v-model="tab" show-arrows>
          <v-tab v-for="(item, index) in TABS" :key="item.id" :value="index">
            {{ item.title }}
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab" class="pa-5">
          <v-tabs-window-item :value="0">
            <v-row>
              <v-col cols="12" md="6" sm="6">
                <ThemeSelector/>
              </v-col>
              <v-col cols="12" md="6" sm="6">
                <ServiceSelector/>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="1">
            <v-row class="pa-10" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList :type="DYNAMIC_LIST_TYPES.MARKETS"/>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <v-row>
              <CheckboxGrid :type="CHECKBOX_GRID_TYPES.INDEXES"/>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="3">
            <v-row>
              <CheckboxGrid :type="CHECKBOX_GRID_TYPES.MATERIALS"/>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="4">
            <v-row class="pa-12" justify="center">
              <v-col cols="12" md="10" sm="10">
                <DynamicList :type="DYNAMIC_LIST_TYPES.EXCHANGES"/>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>
    <AlertOverlay/>
  </v-app>
</template>

