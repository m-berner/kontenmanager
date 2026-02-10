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
const { handleUserNotice } = useBrowser();
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
        connectionErrorMessage: t("components.dialogs.updateStock.messages.dbNotConnected"),
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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VForm;
;
VForm;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
;
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
[formRef,];
;
const __VLS_10 = __VLS_asFunctionalComponent(StockForm, new StockForm({
    isUpdate: (true),
}));
const __VLS_11 = __VLS_10({
    isUpdate: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const __VLS_14 = {}.VOverlay;
;
VOverlay;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_16 = __VLS_15({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_18 } = __VLS_17.slots;
[isLoading,];
const __VLS_19 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_21 = __VLS_20({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
var __VLS_17;
var __VLS_3;
;
;
var __VLS_8 = __VLS_7;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StockForm: StockForm,
            isLoading: isLoading,
            formRef: formRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
