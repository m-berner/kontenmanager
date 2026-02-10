import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { DomainUtils } from "@/domains/utils";
import { useStocksDB } from "@/composables/useIndexedDB";
import { useStockForm } from "@/composables/useForms";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import BaseDialogForm from "@/components/dialogs/forms/BaseDialogForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
import { INDEXED_DB } from "@/config/database";
import { useBrowser } from "@/composables/useBrowser";
const { t } = useI18n();
const { handleUserNotice } = useBrowser();
const { add } = useStocksDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const { mapStockFormToDb, reset } = useStockForm();
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref(null);
const onClickOk = async () => {
    DomainUtils.log("ADD_STOCK : onClickOk");
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: t("components.dialogs.addStock.messages.dbNotConnected"),
        handleUserNotice,
        errorContext: "ADD_STOCK",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const stockData = mapStockFormToDb(activeAccountId);
            const addStockID = await add(stockData);
            if (addStockID === INDEXED_DB.INVALID_ID) {
                DomainUtils.log("ADD_STOCK: onClickOk", t("components.dialogs.addStock.messages.error"));
                await handleUserNotice("AddStock", "add failed");
                return;
            }
            records.stocks.add({ ...stockData, cID: addStockID });
            await records.stocks.refreshOnlineData(runtime.stocksPage);
            runtime.resetTeleport();
            await handleUserNotice("AddStock", "success");
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.addStock.title") };
defineExpose(__VLS_exposed);
onMounted(() => {
    DomainUtils.log("ADD_STOCK: onMounted");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddStock: setup");
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
const __VLS_6 = __VLS_asFunctionalComponent(StockForm, new StockForm({
    isUpdate: (false),
}));
const __VLS_7 = __VLS_6({
    isUpdate: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_2;
var __VLS_4 = __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StockForm: StockForm,
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
