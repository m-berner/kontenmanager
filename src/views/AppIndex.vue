<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {onBeforeMount, ref} from 'vue'
import {RouterView} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {AppError, serializeError} from '@/domains/errors'
import {UtilsService} from '@/domains/utils'
import AlertOverlay from '@/components/AlertOverlay.vue'
import {initializeApp} from '@/services/app'
import {useTheme} from 'vuetify'
import {useSettingsStore} from '@/stores/settings'
import {storeToRefs} from 'pinia'
import {ERROR_CATEGORY, ERROR_CODES} from '@/domains/errors'

const {t} = useI18n()
const settings = useSettingsStore()
const {skin} = storeToRefs(settings)
const theme = useTheme()

const isInitialized = ref(false)

onBeforeMount(async () => {
    UtilsService.log('APP_INDEX: onBeforeMount')

    try {
        await initializeApp({title: t('mixed.smImportOnly.title'), message: t('mixed.smImportOnly.message')})

        // Apply theme after successful initialization
        theme.global.name.value = skin.value
        isInitialized.value = true

        UtilsService.log('APP_INDEX: Initialization successful')
    } catch (err) {
        throw new AppError(
            ERROR_CODES.VIEWS.APP_INDEX.A,
            ERROR_CATEGORY.VALIDATION,
            {input: serializeError(err), entity: 'AppIndex'},
            true
        )
    }
})
// TODO reload company page adjust the titlebar to home?
UtilsService.log('--- views/AppIndex.vue setup ---', window.location.href, 'info')
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
                        color="primary"
                        indeterminate
                        size="64"
                    />
                </v-container>
            </v-main>
        </template>
        <AlertOverlay/>
    </v-app>
</template>
