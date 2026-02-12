import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useAccountsDB } from "@/composables/useIndexedDB";
import { useAccountForm } from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { INDEXED_DB } from "@/configs/database";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { update } = useAccountsDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const { accountFormData, mapAccountFormToDb } = useAccountForm();
const records = useRecordsStore();
const { items: accountItems } = storeToRefs(records.accounts);
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref(null);
const loadCurrentAccount = () => {
    const accountIndex = records.accounts.getIndexById(activeAccountId);
    if (accountIndex === INDEXED_DB.INVALID_ID) {
        DomainUtils.log("UPDATE_ACCOUNT: Account not found", activeAccountId);
        return;
    }
    const currentAccount = accountItems.value[accountIndex];
    Object.assign(accountFormData, {
        id: currentAccount.cID,
        swift: currentAccount.cSwift,
        iban: currentAccount.cIban,
        logoUrl: currentAccount.cLogoUrl,
        withDepot: currentAccount.cWithDepot
    });
};
const onClickOk = async () => {
    DomainUtils.log("UPDATE_ACCOUNT: onClickOk");
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        handleUserNotice,
        errorContext: "UPDATE_ACCOUNT",
        errorTitle: t("components.dialogs.updateAccount.title"),
        operation: async () => {
            const account = mapAccountFormToDb(activeAccountId);
            records.accounts.update(account);
            await update(account);
            runtime.resetTeleport();
            await handleUserNotice("UpdateAccount", getMessage("xx_db_update_success"));
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.updateAccount.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("UPDATE_ACCOUNT: onBeforeMount");
    loadCurrentAccount();
});
DomainUtils.log("COMPONENTS DIALOGS UpdateAccount: setup");
const __VLS_ctx = {};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
const __VLS_0 = BaseDialogForm || BaseDialogForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ref: "baseDialogRef",
}));
const __VLS_2 = __VLS_1({
    ref: "baseDialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_7 } = __VLS_3.slots;
const __VLS_8 = AccountForm;
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    isUpdate: (true),
}));
const __VLS_10 = __VLS_9({
    isUpdate: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_3;
var __VLS_6 = __VLS_5;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
