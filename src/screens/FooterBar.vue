<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {RouterLink} from 'vue-router'
import {useApp} from '@/composables/useApp'
import {useAppConfig} from '@/composables/useAppConfig'

const {t} = useI18n()
const {log} = useApp()
const {ROUTES, SYSTEM} = useAppConfig()

log('--- FooterBar.vue setup ---')
</script>

<template>
    <v-bottom-navigation color="primary">
        <v-btn color="white">
            <a :href="SYSTEM.HELP_URL"
               class="router-link-active"
               rel="noopener noreferrer"
               target="_blank">
                <v-icon icon="$help"/>
                <div>{{ t('screens.footerBar.help') }}</div>
            </a>
        </v-btn>
        <v-btn color="white">
            <RouterLink :to="ROUTES.PRIVACY" class="router-link-active">
                <v-icon icon="
        $privacy"/>
                <div>{{ t('screens.footerBar.privacy') }}</div>
            </RouterLink>
        </v-btn>
        <v-btn :href="SYSTEM.MAILTO" color="white">
            <v-icon icon="$mail"/>
            <div>{{ t('screens.footerBar.help') }}</div>
        </v-btn>
        <v-btn :disabled="true" color="white">
            <v-icon icon="$mdiCopyright"/>
            <div class="nowrap">{{ SYSTEM.COPYRIGHT }}</div>
        </v-btn>
    </v-bottom-navigation>
</template>
