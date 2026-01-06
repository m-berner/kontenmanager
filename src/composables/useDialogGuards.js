import { ref } from 'vue';
export function useDialogGuards() {
    const isLoading = ref(false);
    async function ensureConnected(isConnected, notice, errorMessage = 'Database not connected') {
        if (!isConnected.value) {
            await notice([errorMessage]);
            return false;
        }
        return true;
    }
    function handleError(errorKey, err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return new Error(`${errorKey}: ${message}`);
    }
    async function withLoading(operation) {
        isLoading.value = true;
        try {
            return await operation();
        }
        finally {
            isLoading.value = false;
        }
    }
    async function validateForm(form) {
        if (form.value !== null) {
            const values = await form.value.validate();
            return values.valid;
        }
        return false;
    }
    return {
        isLoading,
        ensureConnected,
        handleError,
        validateForm,
        withLoading
    };
}
