<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/pages/background'

const {t} = useI18n()
const {log} = useApp()

log('--- PrivacyContent.vue setup ---')
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="7" sm="7">
        <v-card>
          <v-card-title>
            {{ t('privacyContent.local.title') }}
          </v-card-title>
          <v-card-text>
            {{ t('privacyContent.local.content') }}
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            {{ t('privacyContent.public.title') }}
          </v-card-title>
          <v-card-text>
            {{ t('privacyContent.public.content') }}
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            {{ t('privacyContent.connections.title') }}
          </v-card-title>
          <v-card-text>
            {{ t('privacyContent.connections.content') }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
