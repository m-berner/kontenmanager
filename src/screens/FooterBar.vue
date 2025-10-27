<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useApp} from '@/composables/useApp'
import {RouterLink} from 'vue-router'

const {t} = useI18n()
const {CONS, log} = useApp()

log('--- FooterBar.vue setup ---')
</script>

<template>
  <v-bottom-navigation color="primary">
    <v-btn color="white">
      <a class="router-link-active" href="https://kontenmanager8.wixsite.com/kontenmanager" rel="noopener noreferrer"
         target="_blank">
        <v-icon icon="$help"/>
        <div>{{ t('footer.help') }}</div>
      </a>
    </v-btn>
    <v-btn color="white">
      <RouterLink :to="CONS.ROUTES.PRIVACY" class="router-link-active">
        <v-icon icon="
        $privacy"/>
        <div>{{ t('footer.privacy') }}</div>
      </RouterLink>
    </v-btn>
    <v-btn :href="CONS.SYSTEM.MAILTO" color="white">
      <v-icon icon="$mail"/>
      <div>{{ t('footer.mail') }}</div>
    </v-btn>
    <v-btn :disabled="true" color="white">
      <v-icon icon="$mdiCopyright"/>
      <div class="nowrap">{{ CONS.SYSTEM.COPYRIGHT }}</div>
    </v-btn>
  </v-bottom-navigation>
</template>
