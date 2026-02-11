import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { createDividendHeaders, VIEWS } from "@/config/views";
const { d, n, t } = useI18n();
const settings = useSettingsStore();
const { dividendsPerPage } = storeToRefs(settings);
const { setDividendsPerPage } = settings;
const { activeId } = useRuntimeStore();
const records = useRecordsStore();
const HEADERS = computed(() => createDividendHeaders(t));
const __VLS_exposed = { title: t("components.dialogs.showDividend.title") };
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS ShowDividend: setup");
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
vCard;
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_14 } = __VLS_12.slots;
let __VLS_15;
vCardText;
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    ...{ class: "pa-5" },
}));
const __VLS_17 = __VLS_16({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
;
const { default: __VLS_20 } = __VLS_18.slots;
let __VLS_21;
vDataTable;
const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (false),
    items: (__VLS_ctx.records.bookings.dividendsByStockId(__VLS_ctx.activeId)),
    itemsPerPage: (__VLS_ctx.dividendsPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('components.dialogs.showDividend.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('components.dialogs.showDividend.noDataText')),
    density: "compact",
    itemKey: "id",
}));
const __VLS_23 = __VLS_22({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (false),
    items: (__VLS_ctx.records.bookings.dividendsByStockId(__VLS_ctx.activeId)),
    itemsPerPage: (__VLS_ctx.dividendsPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('components.dialogs.showDividend.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('components.dialogs.showDividend.noDataText')),
    density: "compact",
    itemKey: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
let __VLS_26;
const __VLS_27 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setDividendsPerPage) });
const { default: __VLS_28 } = __VLS_24.slots;
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_29 } = __VLS_24.slots;
    const [{ item }] = __VLS_vSlot(__VLS_29);
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        ...{ class: "table-row" },
    });
    ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "d-none" },
    });
    ;
    (item.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.d(item.year, "short"));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.n(item.sum, "currency"));
    [HEADERS, records, activeId, dividendsPerPage, VIEWS, t, t, setDividendsPerPage, d, n,];
}
[];
var __VLS_24;
var __VLS_25;
[];
var __VLS_18;
[];
var __VLS_12;
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
