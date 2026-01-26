<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - one could get a copy at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2026, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {RouterLink} from 'vue-router'
import {UtilsService} from '@/domains/utils'
import {ROUTES} from '@/config/routes'
import {DEFAULTS} from '@/config/defaults'

const {t} = useI18n()

UtilsService.log('--- views/FooterBar.vue setup ---')
</script>

<template>
    <v-bottom-navigation color="primary">
        <v-btn color="white">
            <a :href="DEFAULTS.HELP_URL"
               class="router-link-active"
               rel="noopener noreferrer"
               target="_blank">
                <v-icon icon="$help"/>
                <div>{{ t('views.footerBar.help') }}</div>
            </a>
        </v-btn>
        <v-btn color="white">
            <RouterLink :to="ROUTES.PRIVACY" class="router-link-active">
                <v-icon icon="
        $privacy"/>
                <div>{{ t('views.footerBar.privacy') }}</div>
            </RouterLink>
        </v-btn>
        <v-btn :href="DEFAULTS.MAILTO" color="white">
            <v-icon icon="$mail"/>
            <div>{{ t('views.footerBar.mail') }}</div>
        </v-btn>
        <v-btn :disabled="true" color="white">
            <v-icon icon="$mdiCopyright"/>
            <div class="nowrap">{{ DEFAULTS.COPYRIGHT }}</div>
        </v-btn>
    </v-bottom-navigation>
</template>
