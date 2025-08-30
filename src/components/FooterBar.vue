<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2014-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {useConstant} from '@/composables/useConstant'
import {useNotification} from '@/composables/useNotification'

const {t} = useI18n()
const {CONS} = useConstant()
const {log} = useNotification()

log('--- FooterBar.vue setup ---')
</script>

<template>
  <v-bottom-navigation color="primary">
    <v-btn color="white">
      <router-link class="router-link-active" to="/help">
        <v-icon icon="$help"/>
        <div>{{ t('footer.help') }}</div>
      </router-link>
    </v-btn>
    <v-btn color="white">
      <router-link class="router-link-active" to="/privacy">
        <v-icon icon="
        $privacy"/>
        <div>{{ t('footer.privacy') }}</div>
      </router-link>
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
