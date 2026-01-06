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
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const theme = useTheme()
const {log} = useApp()
const {BROWSER_STORAGE} = useAppConfig()
const {getStorage, setStorage} = useBrowser()

const THEMES: {[p:string]: string} = {
    // NOTE: lowercase properties required due to vuetify plugin object
    earth: t('screens.optionsIndex.themeNames.earth'),
    ocean: t('screens.optionsIndex.themeNames.ocean'),
    sky: t('screens.optionsIndex.themeNames.sky'),
    meadow: t('screens.optionsIndex.themeNames.meadow'),
    dark: t('screens.optionsIndex.themeNames.dark'),
    light: t('screens.optionsIndex.themeNames.light')
}

const skin = ref<string>('')

const setSkin = async (): Promise<void> => {
    log('THEME_SELECTOR: setSkin')
    await setStorage(BROWSER_STORAGE.LOCAL.SKIN.key, skin.value)
}

onBeforeMount(async () => {
    log('THEME_SELECTOR: onBeforeMount')
    const storageSkin = await getStorage([BROWSER_STORAGE.LOCAL.SKIN.key])
    skin.value = storageSkin[BROWSER_STORAGE.LOCAL.SKIN.key] as string || BROWSER_STORAGE.LOCAL.SKIN.value
})

log('--- ThemeSelector.vue setup ---')
</script>

<template>
    <v-radio-group
        v-model="skin"
        column
        @update:model-value="async () => {await setSkin()}">
        <v-radio
            v-for="item in Object.keys(theme.themes.value)"
            :key="item"
            :label="THEMES[item]"
            :value="item"
        />
    </v-radio-group>
</template>
