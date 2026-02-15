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
import { databaseService } from "@/services/database/service";
import { INDEXED_DB } from "@/configs/database";
import { useBrowser } from "@/composables/useBrowser";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { add } = useStocksDB();
const { activeAccountId } = useSettingsStore();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const { mapStockFormToDb, reset } = useStockForm();
const { submitGuard } = useDialogGuards();
const baseDialogRef = ref(null);
const onClickOk = async () => {
    DomainUtils.log("COMPONENTS DIALOGS AddStock: onClickOk");
    await submitGuard({
        formRef: baseDialogRef.value?.formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        handleUserNotice,
        errorContext: "ADD_STOCK",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const stockData = mapStockFormToDb(activeAccountId);
            const addStockID = await add(stockData);
            if (addStockID === INDEXED_DB.INVALID_ID) {
                DomainUtils.log("COMPONENTS DIALOGS AddStock: onClickOk", t("components.dialogs.addStock.messages.error"));
                await handleUserNotice("AddStock", getMessage("xx_db_add_err"));
                return;
            }
            records.stocks.add({ ...stockData, cID: addStockID });
            await records.stocks.refreshOnlineData(runtime.stocksPage);
            runtime.resetTeleport();
            await handleUserNotice("AddStock", getMessage("xx_db_add_success"));
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.addStock.title") };
defineExpose(__VLS_exposed);
onMounted(() => {
    DomainUtils.log("COMPONENTS DIALOGS AddStock: onMounted");
    reset();
});
DomainUtils.log("COMPONENTS DIALOGS AddStock: setup");
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
const __VLS_8 = StockForm;
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
