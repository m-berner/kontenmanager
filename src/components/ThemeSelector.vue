<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useTheme} from 'vuetify/framework'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'

interface IT {
  STRINGS: Record<string, string>
}

const {t} = useI18n()
const theme = useTheme()
const {CONS} = useApp()
const {getStorage, setStorage} = useBrowser()

const T = Object.freeze<IT>({
  // NOTE: lowercase properties required due to vuetify plugin object
  STRINGS: {
    earth: t('optionsPage.themeNames.earth'),
    ocean: t('optionsPage.themeNames.ocean'),
    sky: t('optionsPage.themeNames.sky'),
    meadow: t('optionsPage.themeNames.meadow'),
    dark: t('optionsPage.themeNames.dark'),
    light: t('optionsPage.themeNames.light')
  }
})

const skin = ref<string>(CONS.DEFAULTS.BROWSER_STORAGE.SKIN)

const setSkin = async (skin: string | null): Promise<void> => {
  if (skin !== null) {
    theme.global.name.value = skin
    await setStorage(CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN, skin)
  }
}

onBeforeMount(async () => {
  const storageSkin = await getStorage([CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN])
  skin.value = storageSkin[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN] as string
})
</script>

<template>
  <v-radio-group
      v-model="skin"
      column
      @update:modelValue="setSkin">
    <v-radio
        v-for="item in Object.keys(theme.themes.value)"
        :key="item"
        :label="T.STRINGS[item]"
        :value="item"
    />
  </v-radio-group>
</template>
