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
import { INDEXED_DB } from "@/config/database";
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
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
        connectionErrorMessage: t("components.dialogs.updateAccount.messages.dbNotConnected"),
        handleUserNotice,
        errorContext: "UPDATE_ACCOUNT",
        errorTitle: t("components.dialogs.updateAccount.title"),
        operation: async () => {
            const account = mapAccountFormToDb(activeAccountId);
            records.accounts.update(account);
            await update(account);
            runtime.resetTeleport();
            await handleUserNotice("UpdateAccount", "success");
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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
;
const __VLS_0 = __VLS_asFunctionalComponent(BaseDialogForm, new BaseDialogForm({
    ref: "baseDialogRef",
}));
const __VLS_1 = __VLS_0({
    ref: "baseDialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
;
var __VLS_3 = {};
const { default: __VLS_5 } = __VLS_2.slots;
[baseDialogRef,];
;
const __VLS_6 = __VLS_asFunctionalComponent(AccountForm, new AccountForm({
    isUpdate: (true),
}));
const __VLS_7 = __VLS_6({
    isUpdate: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_2;
var __VLS_4 = __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AccountForm: AccountForm,
            BaseDialogForm: BaseDialogForm,
            baseDialogRef: baseDialogRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
