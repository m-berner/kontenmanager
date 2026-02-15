import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { useStorage } from "@/composables/useStorage";
import { useAccountForm } from "@/composables/useForms";
import AccountForm from "@/components/dialogs/forms/AccountForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { BROWSER_STORAGE } from "@/domains/configs/storage";
import { databaseService } from "@/services/database/service";
import { useAccountsDB, useBookingTypesDB } from "@/composables/useIndexedDB";
import { INDEXED_DB } from "@/configs/database";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import { useAlert } from "@/composables/useAlert";
const { t } = useI18n();
const { setStorage } = useStorage();
const { add: addAccountDB } = useAccountsDB();
const { add: addBookingTypeDB } = useBookingTypesDB();
const { accountFormData, mapAccountFormToDb, reset } = useAccountForm();
const { submitGuard } = useDialogGuards();
const { handleUserError } = useAlert();
const { getMessage, showSystemNotification } = useBrowser();
const runtime = useRuntimeStore();
const settings = useSettingsStore();
const records = useRecordsStore();
const baseDialogRef = ref(null);
const onClickOk = async () => {
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        showSystemNotification,
        errorContext: "ADD_ACCOUNT",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const accountData = mapAccountFormToDb();
            const result = await databaseService.transactionManager.execute([INDEXED_DB.STORE.ACCOUNTS.NAME, INDEXED_DB.STORE.BOOKING_TYPES.NAME], "readwrite", async (tx) => {
                const accountId = await addAccountDB(accountData, tx);
                if (accountId === INDEXED_DB.INVALID_ID)
                    throw new Error("Failed to add account");
                const createdTypes = [];
                if (accountFormData.withDepot) {
                    const defaults = [
                        {
                            cName: DomainUtils.normalizeBookingTypeName(t("components.dialogs.addAccount.bookingTypes.buy")),
                            cAccountNumberID: accountId
                        },
                        {
                            cName: DomainUtils.normalizeBookingTypeName(t("components.dialogs.addAccount.bookingTypes.sell")),
                            cAccountNumberID: accountId
                        },
                        {
                            cName: DomainUtils.normalizeBookingTypeName(t("components.dialogs.addAccount.bookingTypes.dividend")),
                            cAccountNumberID: accountId
                        }
                    ];
                    for (const bt of defaults) {
                        const id = await addBookingTypeDB(bt, tx);
                        if (id === INDEXED_DB.INVALID_ID)
                            throw new Error("Failed to add booking type");
                        createdTypes.push({ cID: id, ...bt });
                    }
                }
                return { accountId, createdTypes };
            });
            const { accountId, createdTypes } = result;
            const { activeAccountId } = storeToRefs(settings);
            records.accounts.add({ ...accountData, cID: accountId });
            for (const bt of createdTypes)
                records.bookingTypes.add(bt);
            activeAccountId.value = accountId;
            try {
                await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, accountId);
            }
            catch (err) {
                await handleUserError("COMPONENTS DIALOGS AddAccount", err, {});
            }
            records.clean(false);
            runtime.resetTeleport();
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.addAccount.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("COMPONENTS DIALOGS AddAccount: onBeforeMount");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddAccount: setup");
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
    isUpdate: (false),
}));
const __VLS_10 = __VLS_9({
    isUpdate: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
var __VLS_3;
var __VLS_6 = __VLS_5;
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
