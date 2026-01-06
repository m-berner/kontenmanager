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
const {
    currentAlert,
    confirmationDialog,
    showOverlay,
    showConfirmation,
    alertMessage,
    alertTitle,
    alertType,
    pendingCount
} = storeToRefs(alertStore)
const {dismissAlert, handleConfirm, handleCancel} = alertStore

onMounted(async () => {
    log('ALERT_OVERLAY: onMounted')
})

log('--- AlertOverlay.vue setup ---')
</script>

<template>
    <!-- Standard Alert Overlay -->
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

    <!-- Confirmation Dialog -->
    <v-dialog
        :model-value="showConfirmation"
        max-width="500"
        persistent>
        <v-card>
            <v-card-title class="d-flex align-center pa-4">
                <v-icon
                    :color="confirmationDialog.type"
                    class="mr-3"
                    size="large">
                    {{
                        confirmationDialog.type === 'error' ? 'mdi-alert-circle' :
                            confirmationDialog.type === 'warning' ? 'mdi-alert' :
                                confirmationDialog.type === 'success' ? 'mdi-check-circle' :
                                    'mdi-information'
                    }}
                </v-icon>
                <span>{{ confirmationDialog.title }}</span>
            </v-card-title>

            <v-card-text class="pa-4">
                {{ confirmationDialog.message }}
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer/>
                <v-btn
                    variant="text"
                    @click="handleCancel">
                    {{ confirmationDialog.cancelText }}
                </v-btn>
                <v-btn
                    :color="confirmationDialog.type"
                    variant="elevated"
                    @click="handleConfirm">
                    {{ confirmationDialog.confirmText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
