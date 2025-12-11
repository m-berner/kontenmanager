import { ref } from 'vue';
export function useDialogGuards() {
    const isLoading = ref(false);
    const ensureConnected = async (isConnected, notice, errorMessage = 'Database not connected') => {
        if (!isConnected.value) {
            await notice([errorMessage]);
            return false;
        }
        return true;
    };
    const handleError = async (error, log, notice, context, userMessage) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        log(`${context}: Error`, { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
        await notice([userMessage, errorMessage]);
    };
    const withLoading = async (operation) => {
        isLoading.value = true;
        try {
            return await operation();
        }
        finally {
            isLoading.value = false;
        }
    };
    return {
        isLoading,
        ensureConnected,
        handleError,
        withLoading
    };
}
