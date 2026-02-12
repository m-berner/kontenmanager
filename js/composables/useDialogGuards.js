import { ref } from "vue";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useAlert } from "@/composables/useAlert";
import { useBrowser } from "@/composables/useBrowser";
const { handleUserError } = useAlert();
const { getMessage } = useBrowser();
export function useDialogGuards() {
    const isLoading = ref(false);
    const loadingOperations = ref(new Set());
    let operationCounter = 0;
    async function ensureConnected(isConnected, handleUserNotice, errorMessage = "Database not connected") {
        if (!isConnected) {
            await handleUserNotice("Composables useDialogGuards", getMessage("xx_db_connection_err"), {
                noticeLines: [errorMessage]
            });
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
                return { valid: false, errors: ["System error"] };
            }
            return form.value.validate();
        }
        catch {
            throw new AppError(ERROR_CODES.USE_DIALOG_GUARDS.A, ERROR_CATEGORY.VALIDATION, true);
        }
    }
    async function withRetry(operation, options = {}) {
        const { maxRetries = 3, delay = 1000, onRetry } = options;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (err) {
                if (attempt === maxRetries) {
                    throw new AppError(ERROR_CODES.USE_DIALOG_GUARDS.B, ERROR_CATEGORY.VALIDATION, true);
                }
                onRetry?.(attempt, err);
                await new Promise((resolve) => setTimeout(resolve, delay * attempt));
            }
        }
        throw new AppError(ERROR_CODES.USE_DIALOG_GUARDS.C, ERROR_CATEGORY.VALIDATION, false);
    }
    async function submitGuard(options) {
        const { formRef, isConnected, connectionErrorMessage, handleUserNotice, operation, onFinally, errorContext, errorTitle } = options;
        if (formRef && formRef.value) {
            const validation = await validateForm(formRef);
            if (!validation.valid)
                return;
        }
        if (isConnected !== undefined) {
            if (!(await ensureConnected(isConnected, handleUserNotice, connectionErrorMessage)))
                return;
        }
        await withLoading(async () => {
            try {
                await operation();
            }
            catch (err) {
                await handleUserError(errorTitle ?? "", err, { data: errorContext ?? "" });
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
DomainUtils.log("COMPOSABLE useDialogGuards");
