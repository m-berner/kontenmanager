import { onBeforeMount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { AppError, ERROR_CATEGORY, ERROR_CODES } from "@/domains/errors";
import { DomainUtils } from "@/domains/utils";
import { useStocksDB } from "@/composables/useIndexedDB";
import { useBrowser } from "@/composables/useBrowser";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { databaseService } from "@/services/database";
const { t } = useI18n();
const { getMessage, handleUserNotice } = useBrowser();
const { update } = useStocksDB();
const { isLoading, ensureConnected, withLoading } = useDialogGuards();
const runtime = useRuntimeStore();
const records = useRecordsStore();
const selected = ref(null);
const onClickOk = async () => {
    DomainUtils.log("COMPONENTS DIALOGS FadeInStock: onClickOk");
    if (!(await ensureConnected(databaseService.isConnected(), handleUserNotice)))
        return;
    if (!selected.value) {
        await handleUserNotice("FadeInStock", getMessage("xx_db_no_selected"));
        return;
    }
    await withLoading(async () => {
        try {
            const stock = selected.value;
            stock.cFadeOut = 0;
            await update(stock);
            records.stocks.update(stock);
            await handleUserNotice("FadeInStock", getMessage("xx_db_fade_in"));
            runtime.resetTeleport();
        }
        catch {
            throw new AppError(ERROR_CODES.FADE_IN_STOCK, ERROR_CATEGORY.VALIDATION, true);
        }
    });
};
const __VLS_exposed = { onClickOk, title: t("components.dialogs.fadeInStock.title") };
defineExpose(__VLS_exposed);
onBeforeMount(() => {
    DomainUtils.log("COMPONENTS DIALOGS FadeInStock: onBeforeMount");
    selected.value = null;
});
DomainUtils.log("COMPONENTS DIALOGS FadeInStock: setup");
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
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
let __VLS_9;
vCardText;
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    ...{ class: "pa-5" },
}));
const __VLS_11 = __VLS_10({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
;
const { default: __VLS_14 } = __VLS_12.slots;
let __VLS_15;
vSelect;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    modelValue: (__VLS_ctx.selected),
    density: "compact",
    itemKey: "cID",
    itemTitle: "cCompany",
    clearable: (true),
    items: (__VLS_ctx.records.stocks.passive),
    label: (__VLS_ctx.t('components.dialogs.fadeInStock.selectLabel')),
    returnObject: (true),
    variant: "outlined",
}));
const __VLS_17 = __VLS_16({
    modelValue: (__VLS_ctx.selected),
    density: "compact",
    itemKey: "cID",
    itemTitle: "cCompany",
    clearable: (true),
    items: (__VLS_ctx.records.stocks.passive),
    label: (__VLS_ctx.t('components.dialogs.fadeInStock.selectLabel')),
    returnObject: (true),
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
[selected, records, t,];
var __VLS_12;
let __VLS_20;
vOverlay;
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
;
;
const { default: __VLS_25 } = __VLS_23.slots;
let __VLS_26;
vProgressCircular;
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_28 = __VLS_27({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
[isLoading,];
var __VLS_23;
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
