import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { useSettingsStore } from "@/stores/settings";
import { useBrowser } from "@/composables/useBrowser";
import { useStockForm } from "@/composables/useForms";
import { useStocksDB } from "@/composables/useIndexedDB";
import { DomainUtils } from "@/domains/utils";
import StockForm from "@/components/dialogs/forms/StockForm.vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { update } = useStocksDB();
const records = useRecordsStore();
const runtime = useRuntimeStore();
const { activeAccountId } = useSettingsStore();
const { activeId } = storeToRefs(runtime);
const { stockFormData, mapStockFormToDb, reset: resetForm } = useStockForm();
const { isLoading, submitGuard } = useDialogGuards();
const formRef = ref(null);
const loadCurrentStock = () => {
    DomainUtils.log("UPDATE_STOCK: loadCurrentStock");
    resetForm();
    const currentStock = records.stocks.getById(activeId.value);
    Object.assign(stockFormData, {
        id: activeId.value,
        isin: currentStock?.cISIN.toUpperCase().replace(/\s/g, ""),
        company: currentStock?.cCompany,
        symbol: currentStock?.cSymbol,
        meetingDay: currentStock?.cMeetingDay,
        quarterDay: currentStock?.cQuarterDay,
        fadeOut: currentStock?.cFadeOut,
        firstPage: currentStock?.cFirstPage,
        url: currentStock?.cURL,
        askDates: currentStock?.cAskDates
    });
};
const onClickOk = async () => {
    DomainUtils.log("UPDATE_STOCK : onClickOk");
    await submitGuard({
        formRef,
        isConnected: databaseService.isConnected(),
        connectionErrorMessage: getMessage("xx_db_connection_err"),
        handleUserNotice,
        errorContext: "UPDATE_STOCK",
        errorTitle: t("components.dialogs.onClickOk"),
        operation: async () => {
            const stock = mapStockFormToDb(activeAccountId);
            records.stocks.update(stock);
            await update(stock);
            runtime.resetTeleport();
            await handleUserNotice("UpdateStock", "success");
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.updateStock.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("UPDATE_STOCK: onBeforeMount");
    loadCurrentStock();
});
DomainUtils.log("COMPONENTS DIALOGS UpdateStock: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
const __VLS_10 = StockForm;
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    isUpdate: (true),
}));
const __VLS_12 = __VLS_11({
    isUpdate: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_15;
vOverlay;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_17 = __VLS_16({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
;
;
const { default: __VLS_20 } = __VLS_18.slots;
let __VLS_21;
vProgressCircular;
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_23 = __VLS_22({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
[isLoading,];
var __VLS_18;
[];
var __VLS_3;
var __VLS_4;
var __VLS_8 = __VLS_7;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
