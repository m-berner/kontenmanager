/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * you could obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025-2025, Martin Berner, kontenmanager@gmx.de. All rights reserved.
 */
import type {I_Confirmation_Dialog, I_Visible_Alert} from '@/types'
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {useApp} from '@/composables/useApp'

const defaultAlert: I_Visible_Alert = {id: -1, type: undefined, title: '', message: ''}
const defaultConfirmation: I_Confirmation_Dialog = {
    id: -1,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning',
    resolve: () => {},
    reject: () => {}
}

const {log} = useApp()

export const useAlertStore = defineStore('alert', () => {
    const alerts = ref<I_Visible_Alert[]>([])
    const currentAlert = ref<I_Visible_Alert>(defaultAlert)
    const confirmationDialog = ref<I_Confirmation_Dialog>(defaultConfirmation)

    const pendingCount = computed(() => alerts.value.length < 1 ? 0 : alerts.value.length - 1)
    const showOverlay = computed(() => currentAlert.value.id > -1)
    const showConfirmation = computed(() => confirmationDialog.value.id > -1)
    const alertType = computed(() => currentAlert.value?.type || 'info')
    const alertTitle = computed(() => currentAlert.value?.title || '')
    const alertMessage = computed(() => currentAlert.value?.message || '')

    function showAlert(
        type: 'error' | 'success' | 'warning' | 'info' | undefined,
        title: string,
        message: string,
        duration: number | null = null
    ) {
        const id = Date.now() + Math.random()
        const alert: I_Visible_Alert = {id, type, title, message}

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
            currentAlert.value = {...alerts.value[0]}
        } else {
            currentAlert.value = {...defaultAlert}
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

    function confirm(
        title: string,
        message: string,
        options?: {
            confirmText?: string
            cancelText?: string
            type?: 'error' | 'success' | 'warning' | 'info'
        }
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            const id = Date.now() + Math.random()
            confirmationDialog.value = {
                id,
                title,
                message,
                confirmText: options?.confirmText || 'Confirm',
                cancelText: options?.cancelText || 'Cancel',
                type: options?.type || 'warning',
                resolve: () => {
                    confirmationDialog.value = {...defaultConfirmation}
                    resolve(true)
                },
                reject: () => {
                    confirmationDialog.value = {...defaultConfirmation}
                    resolve(false)
                }
            }
        })
    }

    function handleConfirm() {
        if (confirmationDialog.value.resolve) {
            confirmationDialog.value.resolve()
        }
    }

    function handleCancel() {
        if (confirmationDialog.value.reject) {
            confirmationDialog.value.reject()
        }
    }

    function clearAll() {
        alerts.value = []
        currentAlert.value = {...defaultAlert}
        if (confirmationDialog.value.reject) {
            confirmationDialog.value.reject()
        }
        confirmationDialog.value = {...defaultConfirmation}
    }

    return {
        currentAlert,
        confirmationDialog,
        pendingCount,
        showOverlay,
        showConfirmation,
        alertType,
        alertTitle,
        alertMessage,
        showAlert,
        showNext,
        dismissAlert,
        success,
        error,
        warning,
        info,
        confirm,
        handleConfirm,
        handleCancel,
        clearAll
    }
})

log('--- STORES alerts.ts ---')
