<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {RouterView} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'
import AlertOverlay from '@/components/AlertOverlay.vue'
import {useAppInitialization} from '@/composables/useAppInitialization'
import {useTheme} from 'vuetify'
import {useSettingsStore} from '@/stores/settings'
import {storeToRefs} from 'pinia'

const {log} = useApp()
const {t} = useI18n()
const {notice} = useBrowser()
const {initializeApp} = useAppInitialization()
const settings = useSettingsStore()
const {skin} = storeToRefs(settings)

const theme = useTheme()
const isInitialized = ref(false)

const INIT_MESSAGE = {
    INFO_TITLE: t('screens.appIndex.infoTitle'),
    RESTRICTED_IMPORT: t('messages.restrictedImport')
}

onBeforeMount(async () => {
    log('APP_INDEX: onBeforeMount')

    try {
        await initializeApp(INIT_MESSAGE)

        // Apply theme after successful initialization
        theme.global.name.value = skin.value
        isInitialized.value = true

        log('APP_INDEX: Initialization successful')
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        log(t('screens.appIndex.messages.onBeforeMount'), {error: errorMessage})

        // Show error notification to user
        await notice([t('screens.appIndex.messages.onBeforeMount'), errorMessage])

        // Don't set isInitialized to true - app failed to initialize
        log('APP_INDEX: Initialization failed', {error: errorMessage})
    }
})

log('--- AppIndex.vue setup ---', {info: window.location.href})
</script>

<template>
    <v-app :flat="true">
        <template v-if="isInitialized">
            <RouterView name="title"/>
            <RouterView name="header"/>
            <RouterView name="info"/>
            <v-main>
                <RouterView/>
            </v-main>
            <RouterView name="footer"/>
        </template>
        <template v-else>
            <v-main>
                <v-container class="d-flex align-center justify-center" style="min-height: 100vh;">
                    <v-progress-circular
                        indeterminate
                        color="primary"
                        size="64"
                    />
                </v-container>
            </v-main>
        </template>
        <AlertOverlay/>
    </v-app>
</template>
