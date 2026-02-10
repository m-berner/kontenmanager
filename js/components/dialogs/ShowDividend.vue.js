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
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_8 } = __VLS_3.slots;
const __VLS_9 = {}.VCard;
;
VCard;
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
const { default: __VLS_13 } = __VLS_12.slots;
const __VLS_14 = {}.VCardText;
;
VCardText;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    ...{ class: "pa-5" },
}));
const __VLS_16 = __VLS_15({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_18 } = __VLS_17.slots;
const __VLS_19 = {}.VDataTable;
;
VDataTable;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
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
const __VLS_21 = __VLS_20({
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
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_23;
let __VLS_24;
const __VLS_25 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setDividendsPerPage) });
const { default: __VLS_26 } = __VLS_22.slots;
[HEADERS, records, activeId, dividendsPerPage, VIEWS, t, t, setDividendsPerPage,];
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_27 } = __VLS_22.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_27);
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        ...{ class: "table-row" },
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "d-none" },
    });
    (item.id);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.d(item.year, "short"));
    [d,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.n(item.sum, "currency"));
    [n,];
}
var __VLS_22;
var __VLS_17;
var __VLS_12;
var __VLS_3;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VIEWS: VIEWS,
            d: d,
            n: n,
            t: t,
            dividendsPerPage: dividendsPerPage,
            setDividendsPerPage: setDividendsPerPage,
            activeId: activeId,
            records: records,
            HEADERS: HEADERS,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
