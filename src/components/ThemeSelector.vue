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

const {t} = useI18n()
const theme = useTheme()
const {CONS, log} = useApp()
const {getStorage, setStorage} = useBrowser()

const T = Object.freeze<Record<string, Record<string, string>>>({
                                                                    // NOTE: lowercase properties required due to vuetify plugin object
                                                                    STRINGS: {
                                                                        earth: t('optionsIndex.themeNames.earth'),
                                                                        ocean: t('optionsIndex.themeNames.ocean'),
                                                                        sky: t('optionsIndex.themeNames.sky'),
                                                                        meadow: t('optionsIndex.themeNames.meadow'),
                                                                        dark: t('optionsIndex.themeNames.dark'),
                                                                        light: t('optionsIndex.themeNames.light')
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
    log('THEME_SELECTOR: onBeforeMount')
    const storageSkin = await getStorage([CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN])
    skin.value = storageSkin[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN] as string
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
            :label="T.STRINGS[item]"
            :value="item"
        />
    </v-radio-group>
</template>
