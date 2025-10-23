<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<template>
  <v-overlay
      v-model="showOverlay"
      class="align-center justify-center"
      persistent
  >
    <v-card
        max-width="500"
        class="mx-auto"
    >
      <v-card-text class="pa-6">
        <v-alert
            :type="alertType"
            :title="alertTitle"
            variant="tonal"
            closable
            @click:close="dismiss"
        >
          {{ alertMessage }}
        </v-alert>
      </v-card-text>

      <!--<v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn
            color="grey-darken-1"
            variant="text"
            @click="dismiss"
        >
          Close
        </v-btn>
        <v-btn
            color="primary"
            variant="elevated"
            @click="dismiss"
        >
          Confirm
        </v-btn>
      </v-card-actions>-->

      <v-card-text v-if="pendingCount > 0" class="text-center text-caption pb-4">
        {{ pendingCount }} more alert{{ pendingCount !== 1 ? 's' : '' }} pending
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script setup>
import { computed } from 'vue'
import { useAlert } from '@/composables/useAlert'

const { currentAlert, dismissAlert, pendingCount } = useAlert()

const showOverlay = computed(() => !!currentAlert.value)

const alertType = computed(() => currentAlert.value?.type || 'info')
const alertTitle = computed(() => currentAlert.value?.title || '')
const alertMessage = computed(() => currentAlert.value?.message || '')

const dismiss = () => {
  if (currentAlert.value) {
    dismissAlert(currentAlert.value.id)
  }
}
</script>
