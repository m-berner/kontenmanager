import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useStorage } from "@/composables/useStorage";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { useAlert } from "@/composables/useAlert";
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { handleUserError } = useAlert();
const { setStorage } = useStorage();
const settings = useSettingsStore();
const { activeAccountId } = storeToRefs(settings);
const { resetTeleport } = useRuntimeStore();
const records = useRecordsStore();
const { items: accountItems } = storeToRefs(records.accounts);
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const switchToNextAccount = async () => {
    try {
        if (accountItems.value.length === 0) {
            activeAccountId.value = -1;
            await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, -1);
            return;
        }
        activeAccountId.value = accountItems.value[0].cID;
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeAccountId.value);
    }
    catch (err) {
        await handleUserError("DeleteAccountConfirmation", err, {});
    }
    const storesDB = await databaseService.getAccountRecords(activeAccountId.value);
    await records.init(storesDB, {
        title: t("mixed.smImportOnly.title"),
        message: t("mixed.smImportOnly.message")
    });
};
const onClickOk = async () => {
    DomainUtils.log("DELETE_ACCOUNT_CONFIRMATION: onClickOk");
    if (!(await ensureConnected(databaseService.isConnected(), handleUserNotice, t("components.dialogs.deleteAccountConfirmation.messages.dbNotConnected"))))
        return;
    await withLoading(async () => {
        try {
            const accountToDelete = activeAccountId.value;
            await databaseService.deleteAccountRecords(accountToDelete);
            records.accounts.remove(accountToDelete);
            await switchToNextAccount();
            resetTeleport();
            await handleUserNotice("DeleteAccountConfirmation", "success");
        }
        catch {
            throw new AppError(ERROR_CODES.DELETE_ACCOUNT_CONFIRMATION, ERROR_CATEGORY.VALIDATION, true);
        }
    });
};
const __VLS_exposed = {
    onClickOk,
    title: t("components.dialogs.deleteAccountConfirmation.title")
};
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS DeleteAccountConfirmation: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.records.accounts.items.length === 0) {
    [records,];
    const __VLS_0 = {}.VAlert;
    ;
    VAlert;
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_4 } = __VLS_3.slots;
    (__VLS_ctx.t("views.headerBar.messages.noAccount"));
    [t,];
    var __VLS_3;
}
else {
    const __VLS_5 = {}.VAlert;
    ;
    VAlert;
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        type: "warning",
    }));
    const __VLS_7 = __VLS_6({
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    const { default: __VLS_9 } = __VLS_8.slots;
    (__VLS_ctx.t("components.dialogs.deleteAccountConfirmation.messages.confirm"));
    [t,];
    var __VLS_8;
}
const __VLS_10 = {}.VOverlay;
;
VOverlay;
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_12 = __VLS_11({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_14 } = __VLS_13.slots;
[isLoading,];
const __VLS_15 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_17 = __VLS_16({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
var __VLS_13;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            t: t,
            records: records,
            isLoading: isLoading,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
