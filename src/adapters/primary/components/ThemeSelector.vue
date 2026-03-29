<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -->

<script lang="ts" setup>
/**
 * @fileoverview Theme selector component allowing users to switch Vuetify
 * themes/skins. Writes the selected theme into the settings store.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useTheme} from "vuetify/framework";

import {createThemes} from "@/domain/constants";
import {log} from "@/domain/utils/utils";

import {useSettingsStore} from "@/adapters/primary/stores/settings";

const {t} = useI18n();
const theme = useTheme();
const settings = useSettingsStore();

const THEMES = computed(() => createThemes(t));

const skin = computed({
  get: () => settings.skin,
  set: (next: string) => {
    log("COMPONENTS ThemeSelector: setSkin");
    void settings.setSkin(next);
  }
});

log("COMPONENTS ThemeSelector: setup");
</script>

<template>
  <v-radio-group
      v-model="skin"
      column>
    <v-radio
        v-for="item in Object.keys(theme.themes.value)"
        :key="item"
        :label="THEMES[item]"
        :value="item"/>
  </v-radio-group>
</template>
