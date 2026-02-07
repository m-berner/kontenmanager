import { useI18n } from "vue-i18n";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { useRuntimeStore } from "@/stores/runtime";
import { databaseService } from "@/services/database";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
export function useDialogSubmit() {
    const { t } = useI18n();
    const { submitGuard } = useDialogGuards();
    const { handleUserNotice } = useBrowser();
    const runtime = useRuntimeStore();
    function createSubmitHandler(config) {
        const { dialogRef, operation, componentName, i18nPrefix, checkConnection = true, closeOnSuccess = true, errorMessage, onSuccess, onError } = config;
        return async () => {
            DomainUtils.log(`${componentName.toUpperCase()}: onClickOk`);
            await submitGuard({
                formRef: dialogRef.value?.formRef,
                isConnected: checkConnection
                    ? databaseService.isConnected()
                    : undefined,
                connectionErrorMessage: errorMessage || t(`${i18nPrefix}.messages.dbNotConnected`),
                handleUserNotice,
                errorContext: componentName.toUpperCase().replace(/\s/g, "_"),
                errorTitle: t("components.dialogs.onClickOk"),
                operation: async () => {
                    try {
                        await operation();
                        if (onSuccess) {
                            await onSuccess();
                        }
                        if (closeOnSuccess) {
                            runtime.resetTeleport();
                        }
                        await handleUserNotice("success", componentName);
                    }
                    catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        if (onError) {
                            await onError(err);
                        }
                        await handleUserNotice("error", componentName);
                        throw err;
                    }
                }
            });
        };
    }
    function createAddHandler(config) {
        const { reset, ...baseConfig } = config;
        return createSubmitHandler({
            ...baseConfig,
            onSuccess: async () => {
                reset();
                if (baseConfig.onSuccess) {
                    await baseConfig.onSuccess();
                }
            }
        });
    }
    function createUpdateHandler(config) {
        return createSubmitHandler({
            ...config,
            onSuccess: async () => {
                runtime.resetOptionsMenuColors();
                if (config.onSuccess) {
                    await config.onSuccess();
                }
            }
        });
    }
    return {
        createSubmitHandler,
        createAddHandler,
        createUpdateHandler
    };
}
