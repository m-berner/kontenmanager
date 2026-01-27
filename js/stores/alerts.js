import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { UtilsService } from "@/domains/utils";
const defaultAlert = {
    id: -1,
    type: undefined,
    title: "",
    message: ""
};
const defaultConfirmation = {
    id: -1,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
    resolve: () => { },
    reject: () => { }
};
let alertIdCounter = 0;
function generateUniqueId() {
    return ++alertIdCounter;
}
export const useAlertStore = defineStore("alert", () => {
    const alerts = ref([]);
    const currentAlert = ref(defaultAlert);
    const confirmationDialog = ref(defaultConfirmation);
    const timeouts = ref(new Map());
    const pendingCount = computed(() => alerts.value.length < 1 ? 0 : alerts.value.length - 1);
    const showOverlay = computed(() => currentAlert.value.id > -1);
    const showConfirmation = computed(() => confirmationDialog.value.id > -1);
    const alertType = computed(() => currentAlert.value?.type || "info");
    const alertTitle = computed(() => currentAlert.value?.title || "");
    const alertMessage = computed(() => currentAlert.value?.message || "");
    function clearAlertTimeout(id) {
        const timeoutId = timeouts.value.get(id);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeouts.value.delete(id);
        }
    }
    function showAlert(type, title, message, duration = null) {
        const id = generateUniqueId();
        const alert = { id, type, title, message };
        alerts.value.push(alert);
        if (currentAlert.value.id === -1) {
            showNext();
        }
        if (duration !== null && duration > 0) {
            const timeoutId = setTimeout(() => {
                dismissAlert(id);
            }, duration);
            timeouts.value.set(id, timeoutId);
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
        if (id === undefined) {
            UtilsService.log("ALERT_STORE: Attempted to dismiss alert with undefined ID", null, "warn");
            return;
        }
        const index = alerts.value.findIndex((alert) => alert.id === id);
        if (index === -1) {
            UtilsService.log("ALERT_STORE: Alert not found for dismissal", id, "warn");
            return;
        }
        clearAlertTimeout(id);
        const wasCurrentAlert = index === 0;
        alerts.value.splice(index, 1);
        if (wasCurrentAlert) {
            showNext();
        }
    }
    function success(title, message, duration = null) {
        return showAlert("success", title, message, duration);
    }
    function error(title, message, duration = null) {
        return showAlert("error", title, message, duration);
    }
    function warning(title, message, duration = null) {
        return showAlert("warning", title, message, duration);
    }
    function info(title, message, duration = null) {
        return showAlert("info", title, message, duration);
    }
    function confirm(title, message, options) {
        return new Promise((resolve, reject) => {
            if (confirmationDialog.value.id > -1) {
                UtilsService.log("ALERT_STORE: Confirmation dialog already active", null, "warn");
                reject(new Error("Confirmation dialog already active"));
                return;
            }
            const id = generateUniqueId();
            confirmationDialog.value = {
                id,
                title,
                message,
                confirmText: options?.confirmText || "Confirm",
                cancelText: options?.cancelText || "Cancel",
                type: options?.type || "warning",
                resolve: () => {
                    confirmationDialog.value = { ...defaultConfirmation };
                    resolve(true);
                },
                reject: () => {
                    confirmationDialog.value = { ...defaultConfirmation };
                    resolve(false);
                }
            };
        });
    }
    function handleConfirm() {
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.resolve) {
            try {
                confirmationDialog.value.resolve();
            }
            catch (err) {
                UtilsService.log("ALERT_STORE: Error in confirm handler", err, "error");
                confirmationDialog.value = { ...defaultConfirmation };
            }
        }
    }
    function handleCancel() {
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.reject) {
            try {
                confirmationDialog.value.reject();
            }
            catch (err) {
                UtilsService.log("ALERT_STORE: Error in cancel handler", err, "error");
                confirmationDialog.value = { ...defaultConfirmation };
            }
        }
    }
    function clearAll() {
        timeouts.value.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        timeouts.value.clear();
        alerts.value = [];
        currentAlert.value = { ...defaultAlert };
        if (confirmationDialog.value.id > -1 && confirmationDialog.value.reject) {
            try {
                confirmationDialog.value.reject();
            }
            catch (err) {
                UtilsService.log("ALERT_STORE: Error clearing confirmation dialog", err, "warn");
            }
        }
        confirmationDialog.value = { ...defaultConfirmation };
    }
    function cleanup() {
        clearAll();
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
        dismissAlert,
        success,
        error,
        warning,
        info,
        confirm,
        handleConfirm,
        handleCancel,
        clearAll,
        cleanup
    };
});
UtilsService.log("--- stores/alerts.ts ---");
