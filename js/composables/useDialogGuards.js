import { ref } from 'vue';
import { AppError } from '@/domains/errors';
import { SYSTEM } from '@/domains/config/system';
export function useDialogGuards() {
    const isLoading = ref(false);
    const loadingOperations = ref(new Set());
    let operationCounter = 0;
    async function ensureConnected(isConnected, notice, errorMessage = 'Database not connected') {
        if (!isConnected) {
            await notice([errorMessage]);
            return false;
        }
        return true;
    }
    async function withLoading(operation, operationId) {
        const id = operationId || `op-${++operationCounter}`;
        isLoading.value = true;
        loadingOperations.value.add(id);
        try {
            return await operation();
        }
        finally {
            loadingOperations.value.delete(id);
            isLoading.value = loadingOperations.value.size > 0;
        }
    }
    async function validateForm(form) {
        try {
            if (form.value === null) {
                return { valid: false, errors: ['System error'] };
            }
            return form.value.validate();
        }
        catch (err) {
            throw new AppError('validateForm', 'DIALOG_GUARDS', SYSTEM.ERROR_CATEGORY.VALIDATION, { a: err }, true);
        }
    }
    async function withRetry(operation, options = {}) {
        const { maxRetries = 3, delay = 1000, onRetry } = options;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                if (attempt === maxRetries)
                    throw error;
                onRetry?.(attempt, error);
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        throw new AppError('Should not reach here', 'USE_DIALOG_GUARDS', SYSTEM.ERROR_CATEGORY.VALIDATION, { retryError: 'retry_exhausted' }, false);
    }
    async function submitGuard(options) {
        const { formRef, isConnected, connectionErrorMessage = 'Database not connected', notice, operation, onFinally, errorContext = 'SUBMIT_GUARD', errorTitle = 'Error' } = options;
        if (formRef) {
            const validation = await validateForm(formRef);
            if (!validation.valid)
                return;
        }
        if (isConnected !== undefined) {
            if (!(await ensureConnected(isConnected, notice, connectionErrorMessage)))
                return;
        }
        await withLoading(async () => {
            try {
                await operation();
            }
            catch (err) {
                throw new AppError(errorTitle, errorContext, SYSTEM.ERROR_CATEGORY.VALIDATION, { a: err }, true);
            }
            finally {
                onFinally?.();
            }
        });
    }
    return {
        isLoading,
        loadingOperations,
        ensureConnected,
        validateForm,
        withLoading,
        withRetry,
        submitGuard
    };
}
