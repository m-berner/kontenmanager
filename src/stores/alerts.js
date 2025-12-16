import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useApp } from '@/composables/useApp';
const defaultAlert = { id: -1, type: undefined, title: '', message: '' };
const alerts = ref([]);
const currentAlert = ref(defaultAlert);
const { log } = useApp();
export const useAlertStore = defineStore('alert', () => {
    const pendingCount = computed(() => alerts.value.length < 1 ? 0 : alerts.value.length - 1);
    const showOverlay = computed(() => currentAlert.value.id > -1);
    const alertType = computed(() => currentAlert.value?.type || 'info');
    const alertTitle = computed(() => currentAlert.value?.title || '');
    const alertMessage = computed(() => currentAlert.value?.message || '');
    function showAlert(type, title, message, duration = null) {
        const id = Date.now() + Math.random();
        const alert = { id, type, title, message };
        alerts.value.push(alert);
        if (currentAlert.value.id === -1) {
            showNext();
        }
        if (duration) {
            setTimeout(() => {
                dismissAlert(id);
            }, duration);
        }
        return id;
    }
    function showNext() {
        if (alerts.value.length > 0) {
            currentAlert.value = { ...alerts.value[0] };
        }
        else {
            currentAlert.value = { ...defaultAlert };
        }
    }
    function dismissAlert(id) {
        if (currentAlert.value?.id === id) {
            alerts.value.shift();
            showNext();
        }
        else {
            alerts.value = alerts.value.filter(alert => alert.id !== id);
        }
    }
    function success(title, message, duration = null) {
        return showAlert('success', title, message, duration);
    }
    function error(title, message, duration = null) {
        return showAlert('error', title, message, duration);
    }
    function warning(title, message, duration = null) {
        return showAlert('warning', title, message, duration);
    }
    function info(title, message, duration = null) {
        return showAlert('info', title, message, duration);
    }
    function clearAll() {
        alerts.value = [];
        currentAlert.value = { ...defaultAlert };
    }
    return {
        currentAlert,
        pendingCount,
        showOverlay,
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
        clearAll
    };
});
log('--- STORES alerts.ts ---');
