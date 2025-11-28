<!--
  - This Source Code Form is subject to the terms of the Mozilla Public
  - License, v. 2.0. If a copy of the MPL was not distributed with this file,
  - you could obtain one at https://mozilla.org/MPL/2.0/.
  -
  - Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
  -->
<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import {useAlertStore} from '@/stores/alerts'
import {useApp} from '@/composables/useApp'
import {useBrowser} from '@/composables/useBrowser'

interface IT {
  MESSAGES: Record<string, string>
}

const {CONS, log, haveSameStrings} = useApp()
const {t} = useI18n()
const alertStore = useAlertStore()
const {currentAlert} = storeToRefs(alertStore)
const {dismissAlert, info, pendingCount} = alertStore

const T = Object.freeze<IT>({
  MESSAGES: {
    INFO_TITLE: t('messages.infoTitle'),
    CORRUPT_STORAGE: t('messages.corruptStorage')
  }
})

const showOverlay = computed(() => currentAlert.value.id > -1)
const alertType = computed(() => currentAlert.value?.type || 'info')
const alertTitle = computed(() => currentAlert.value?.title || '')
const alertMessage = computed(() => currentAlert.value?.message || '')

onMounted(async () => {
  log('ALERT_OVERLAY: onMounted')
  const {getStorage} = useBrowser()
  const storage = await getStorage()
  if (!haveSameStrings(Object.keys(storage), Object.values(CONS.DEFAULTS.BROWSER_STORAGE.PROPS))) {
    info(T.MESSAGES.INFO_TITLE, T.MESSAGES.CORRUPT_STORAGE, null)
  }
})

log('--- AlertOverlay.vue setup ---')
</script>

<template>
  <v-overlay
      v-model="showOverlay"
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
