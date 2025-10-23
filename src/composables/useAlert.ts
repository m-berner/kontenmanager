/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import {readonly, ref} from 'vue'

interface IAlert {
    id: number
    type: string
    title: string
    message: string
}

const alerts = ref<IAlert[]>([])
const currentAlert = ref<IAlert | null>(null)

export function useAlert() {
    const showAlert = (type: string, title: string, message: string, duration = null) => {
        const id = Date.now() + Math.random()
        const alert: { id: number, type: string, title: string, message: string } = {id, type, title, message}

        alerts.value.push(alert)

        if (!currentAlert.value) {
            showNext()
        }

        if (duration) {
            setTimeout(() => {
                dismissAlert(id)
            }, duration)
        }

        return id
    }

    const showNext = () => {
        if (alerts.value.length > 0) {
            currentAlert.value = alerts.value[0]
        } else {
            currentAlert.value = null
        }
    }

    const dismissAlert = (id: number) => {
        if (currentAlert.value?.id === id) {
            alerts.value.shift()
            showNext()
        } else {
            alerts.value = alerts.value.filter(alert => alert.id !== id)
        }
    }

    const success = (title: string, message: string, duration: null | undefined) => {
        return showAlert('success', title, message, duration)
    }

    const error = (title: string, message: string, duration: null | undefined) => {
        return showAlert('error', title, message, duration)
    }

    const warning = (title: string, message: string, duration: null | undefined) => {
        return showAlert('warning', title, message, duration)
    }

    const info = (title: string, message: string, duration: null | undefined) => {
        return showAlert('info', title, message, duration)
    }

    const clearAll = () => {
        alerts.value = []
        currentAlert.value = null
    }

    return {
        success,
        error,
        warning,
        info,
        dismissAlert,
        clearAll,
        currentAlert: readonly(currentAlert),
        pendingCount: readonly(() => alerts.value.length - 1)
    }
}
