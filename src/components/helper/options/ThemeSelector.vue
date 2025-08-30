<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'
import {useBrowser} from '@/composables/useBrowser'
import {useTheme} from 'vuetify/framework'
import {useI18n} from 'vue-i18n'
import {onBeforeMount, ref} from 'vue'

const {t} = useI18n()
const theme = useTheme()
const {CONS} = useConstant()
const {log} = useNotification()
const {getStorage, setStorage} = useBrowser()

const skin = ref('ocean')// TODO default...

const themeNames: { [p: string]: string } = {
  earth: t('optionsPage.themeNames.earth'),
  ocean: t('optionsPage.themeNames.ocean'),
  sky: t('optionsPage.themeNames.sky'),
  meadow: t('optionsPage.themeNames.meadow'),
  dark: t('optionsPage.themeNames.dark'),
  light: t('optionsPage.themeNames.light')
}

const setSkin = async (skin: string | null): Promise<void> => {
  if (skin !== null) {
    theme.global.name.value = skin
    await setStorage(CONS.STORAGE.PROPS.SKIN, skin)
  }
}

onBeforeMount(async () => {
  const storageSkin = await getStorage([CONS.STORAGE.PROPS.SKIN])
  skin.value = storageSkin[CONS.STORAGE.PROPS.SKIN] as string
})

log('--- ThemeSelector.vue setup ---')
</script>

<template>
  <v-radio-group
      v-model="skin"
      column
      @update:modelValue="setSkin">
    <v-radio
        v-for="item in Object.keys(theme.themes.value)"
        :key="item"
        :label="themeNames[item]"
        :value="item"
    />
  </v-radio-group>
</template>
