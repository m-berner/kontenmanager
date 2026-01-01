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
    async function handleError(error, log, notice, context, userMessage) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        log(`${context}: Error`, { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
        await notice([userMessage, errorMessage]);
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
    function validateForm(form) {
        if (form.value !== null) {
            return form.value.validate();
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
