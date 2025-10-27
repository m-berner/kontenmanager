import {readonly, ref} from 'vue';

const alerts = ref([]);
const currentAlert = ref(null);

export function useAlert() {
    const showAlert = (type, title, message, duration = null) => {
        const id = Date.now() + Math.random();
        const alert = {id, type, title, message};
        alerts.value.push(alert);
        if (!currentAlert.value) {
            showNext();
        }
        if (duration) {
            setTimeout(() => {
                dismissAlert(id);
            }, duration);
        }
        return id;
    };
    const showNext = () => {
        if (alerts.value.length > 0) {
            currentAlert.value = alerts.value[0];
        } else {
            currentAlert.value = null;
        }
    };
    const dismissAlert = (id) => {
        if (currentAlert.value?.id === id) {
            alerts.value.shift();
            showNext();
        } else {
            alerts.value = alerts.value.filter(alert => alert.id !== id);
        }
    };
    const success = (title, message, duration) => {
        return showAlert('success', title, message, duration);
    };
    const error = (title, message, duration) => {
        return showAlert('error', title, message, duration);
    };
    const warning = (title, message, duration) => {
        return showAlert('warning', title, message, duration);
    };
    const info = (title, message, duration) => {
        return showAlert('info', title, message, duration);
    };
    const clearAll = () => {
        alerts.value = [];
        currentAlert.value = null;
    };
    return {
        success,
        error,
        warning,
        info,
        dismissAlert,
        clearAll,
        currentAlert: readonly(currentAlert),
        pendingCount: readonly(() => alerts.value.length < 1 ? 0 : alerts.value.length - 1)
    };
}
