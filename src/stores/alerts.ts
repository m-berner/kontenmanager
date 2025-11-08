/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {useApp} from '@/composables/useApp'

interface IAlert {
    id: number
    type: string
    title: string
    message: string
}

const defaultAlert = { id: -1, type: '', title: '', message: '' }
const {log} = useApp()

export const useAlertStore = defineStore('alert', () => {
    const alerts = ref<IAlert[]>([])
    const currentAlert = ref<IAlert>(defaultAlert)

    const pendingCount = computed(() => alerts.value.length < 1 ? 0 : alerts.value.length - 1)

    function showAlert(type: string, title: string, message: string, duration: number | null = null) {
        const id = Date.now() + Math.random()
        const alert: IAlert = { id, type, title, message }

        alerts.value.push(alert)

        if (currentAlert.value.id === -1) {
            showNext()
        }

        if (duration) {
            setTimeout(() => {
                dismissAlert(id)
            }, duration)
        }
        return id
    }

    function showNext() {
        if (alerts.value.length > 0) {
            currentAlert.value = { ...alerts.value[0] }
        } else {
            currentAlert.value = { ...defaultAlert }
        }
    }

    function dismissAlert(id: number) {
        if (currentAlert.value?.id === id) {
            alerts.value.shift()
            showNext()
        } else {
            alerts.value = alerts.value.filter(alert => alert.id !== id)
        }
    }

    function success(title: string, message: string, duration: number | null = null) {
        return showAlert('success', title, message, duration)
    }

    function error(title: string, message: string, duration: number | null = null) {
        return showAlert('error', title, message, duration)
    }

    function warning(title: string, message: string, duration: number | null = null) {
        return showAlert('warning', title, message, duration)
    }

    function info(title: string, message: string, duration: number | null = null) {
        return showAlert('info', title, message, duration)
    }

    function clearAll() {
        alerts.value = []
        currentAlert.value = { ...defaultAlert }
    }

    return {
        currentAlert,
        pendingCount,
        showAlert,
        showNext,
        dismissAlert,
        success,
        error,
        warning,
        info,
        clearAll
    }
})

log('--- STORES alerts.ts ---')
