<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {onMounted} from 'vue'
import {storeToRefs} from 'pinia'
import {useAlertStore} from '@/stores/alerts'
import {useApp} from '@/composables/useApp'

const {log} = useApp()
const alertStore = useAlertStore()
const {currentAlert, showOverlay, alertMessage, alertTitle, alertType, pendingCount} = storeToRefs(alertStore)
const {dismissAlert} = alertStore

onMounted(async () => {
  log('ALERT_OVERLAY: onMounted')
})

log('--- AlertOverlay.vue setup ---')
</script>

<template>
  <v-overlay
      :model-value="showOverlay"
      class="align-center justify-center"
      persistent>
    <v-card
        class="mx-auto"
        max-width="500">
      <v-card-text class="pa-6">
        <v-alert
            :title="alertTitle"
            :type="alertType"
            closable
            variant="tonal"
            @click:close="dismissAlert(currentAlert?.id)">
          {{ alertMessage }}
        </v-alert>
      </v-card-text>
      <v-card-text v-if="pendingCount > 0" class="text-center text-caption pb-4">
        {{ pendingCount }} more alert{{ pendingCount !== 1 ? 's' : '' }} pending
      </v-card-text>
    </v-card>
  </v-overlay>
</template>
