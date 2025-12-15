<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount} from 'vue'
import {RouterView} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import AlertOverlay from '@/components/AlertOverlay.vue'
import {useAppInitialization} from '@/composables/useAppInitialization'
import {useTheme} from 'vuetify'

const {CONS, log} = useApp()
const {t} = useI18n()
const {notice} = useBrowser()
const {initializeApp} = useAppInitialization()

const theme = useTheme()

const T = Object.freeze(
    {
        MESSAGES: {
            INFO_TITLE: t('messages.infoTitle'),
            RESTRICTED_IMPORT: t('messages.restrictedImport'),
            CORRUPT_STORAGE: t('messages.corruptStorage'),
            ERROR_ON_BEFORE_MOUNT: t('messages.onBeforeMount')
        }
    }
)

onBeforeMount(async () => {
    log('APP_INDEX: onBeforeMount')
    const initializedData = await initializeApp(T)
    if (initializedData.success) {
        theme.global.name.value = initializedData.results!.storage[CONS.DEFAULTS.BROWSER_STORAGE.PROPS.SKIN]
    } else {
        const errorMessage = initializedData.error instanceof Error ? initializedData.error.message : 'Unknown error'
        log(T.MESSAGES.ERROR_ON_BEFORE_MOUNT, {error: errorMessage})
        await notice([T.MESSAGES.ERROR_ON_BEFORE_MOUNT, errorMessage])
    }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
    <v-app :flat="true">
        <RouterView name="title"/>
        <RouterView name="header"/>
        <RouterView name="info"/>
        <v-main>
            <RouterView/>
        </v-main>
        <RouterView name="footer"/>
        <AlertOverlay/>
    </v-app>
</template>
