<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify/framework";
import { UtilsService } from "@/domains/utils";
import { useStorage } from "@/composables/useStorage";
import { BROWSER_STORAGE } from "@/config/storage";
import { createThemes } from "@/config/views";

const { t } = useI18n();
const theme = useTheme();
const { getStorage, setStorage } = useStorage();

const THEMES = createThemes(t);

const skin = ref<string>("");

const setSkin = async (): Promise<void> => {
  UtilsService.log("THEME_SELECTOR: setSkin");
  await setStorage(BROWSER_STORAGE.SKIN.key, skin.value);
};

onBeforeMount(async () => {
  UtilsService.log("THEME_SELECTOR: onBeforeMount");
  const storageSkin = await getStorage([BROWSER_STORAGE.SKIN.key]);
  skin.value =
    (storageSkin[BROWSER_STORAGE.SKIN.key] as string) ||
    BROWSER_STORAGE.SKIN.value;
});

UtilsService.log("--- ThemeSelector.vue setup ---");
</script>

<template>
  <v-radio-group
    v-model="skin"
    column
    @update:model-value="
      async () => {
        await setSkin();
      }
    "
  >
    <v-radio
      v-for="item in Object.keys(theme.themes.value)"
      :key="item"
      :label="THEMES[item]"
      :value="item"
    />
  </v-radio-group>
</template>
