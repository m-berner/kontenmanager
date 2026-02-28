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
import {computed, onBeforeMount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useTheme} from "vuetify/framework";
import {DomainUtils} from "@/domains/utils";
import {useStorage} from "@/composables/useStorage";
//import {useAlert} from "@/composables/useAlert";
import {BROWSER_STORAGE} from "@/domains/configs/storage";
import {createThemes} from "@/configs/views";
import {alertService} from "@/services/alert";

const {t} = useI18n();
const theme = useTheme();
const {getStorage, setStorage} = useStorage();

const THEMES = computed(() => createThemes(t));

const skin = ref<string>("");

const setSkin = async (): Promise<void> => {
  DomainUtils.log("COMPONENTS ThemeSelector: setSkin");
  try {
    await setStorage(BROWSER_STORAGE.SKIN.key, skin.value);
  } catch (err) {
    await alertService.feedbackError("Components ThemeSelector", err, {});
  }
};

onBeforeMount(async () => {
  DomainUtils.log("COMPONENTS ThemeSelector: onBeforeMount");
  const storageSkin = await getStorage([BROWSER_STORAGE.SKIN.key]);
  skin.value =
      (storageSkin[BROWSER_STORAGE.SKIN.key] as string) ||
      BROWSER_STORAGE.SKIN.value;
});

DomainUtils.log("COMPONENTS ThemeSelector: setup");
</script>

<template>
  <v-radio-group
      v-model="skin"
      column
      @update:model-value="async () => { await setSkin(); }">
    <v-radio
        v-for="item in Object.keys(theme.themes.value)"
        :key="item"
        :label="THEMES[item]"
        :value="item"/>
  </v-radio-group>
</template>
