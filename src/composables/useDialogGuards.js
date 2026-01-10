import { ref } from 'vue';
export class GuardError extends Error {
    _code;
    _context;
    constructor(message, _code, _context) {
        super(message);
        this._code = _code;
        this._context = _context;
        this.name = 'GuardError';
    }
}
export function useDialogGuards() {
    const isLoading = ref(false);
    const loadingOperations = ref(new Set());
    async function ensureConnected(isConnected, notice, errorMessage = 'Database not connected') {
        if (!isConnected.value) {
            await notice([errorMessage]);
            return false;
        }
        return true;
    }
    function handleError(errorKey, err) {
        if (err instanceof Error) {
            return new GuardError(`${errorKey}: ${err.message}`, errorKey, { originalError: err });
        }
        return new GuardError(`${errorKey}: Unknown error`, errorKey, { originalError: err });
    }
    async function withLoading(operation, operationId) {
        const id = operationId || `op-${Date.now()}`;
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
    function validateForm(form) {
        if (!form.value) {
            return { valid: false, errors: ['Form reference not available'] };
        }
        try {
            const result = form.value.validate();
            return {
                valid: result.valid,
                errors: result.errors || []
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error.message]
            };
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
        throw new Error('Should not reach here');
    }
    return {
        isLoading,
        loadingOperations,
        ensureConnected,
        handleError,
        validateForm,
        withLoading,
        withRetry
    };
}
