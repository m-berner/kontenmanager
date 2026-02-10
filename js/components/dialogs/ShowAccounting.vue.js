import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useRecordsStore } from "@/stores/records";
import { useSettingsStore } from "@/stores/settings";
import { createAccountingHeaders, VIEWS } from "@/config/views";
import { COMPONENTS } from "@/config/components";
import { DomainUtils } from "@/domains/utils";
const { n, t } = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const { sumsPerPage } = storeToRefs(settings);
const { setSumsPerPage } = settings;
const HEADERS = computed(() => createAccountingHeaders(t));
const selected = ref(COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID);
const yearEntries = computed(() => {
    const years = [
        COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID,
        ...Array.from(records.bookings.bookedYears)
    ];
    return years.map((entry) => {
        return {
            id: entry,
            title: entry === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID
                ? t("components.dialogs.showAccounting.allYears")
                : entry.toString()
        };
    });
});
const accountEntries = computed(() => {
    const result = [];
    const { sums, taxes, fees } = getAccountData(selected.value);
    let finalSum = 0;
    for (let i = 0; i < sums.length; i++) {
        const sumClass = sums[i].key < 0 ? "color-red" : "";
        result.push({
            id: i,
            name: sums[i].value,
            sum: sums[i].key,
            nameClass: "",
            sumClass
        });
        finalSum += sums[i].key;
    }
    if (records.accounts.isDepot) {
        result.unshift({
            id: sums.length + 2,
            name: t("components.dialogs.showAccounting.fees"),
            sum: fees,
            nameClass: "",
            sumClass: "color-red"
        });
        result.unshift({
            id: sums.length + 1,
            name: t("components.dialogs.showAccounting.taxes"),
            sum: taxes,
            nameClass: "",
            sumClass: "color-red"
        });
    }
    result.push({
        id: sums.length,
        name: t("components.dialogs.showAccounting.sum"),
        sum: finalSum + taxes + fees,
        nameClass: "font-weight-bold",
        sumClass: "font-weight-bold"
    });
    return result;
});
const getAccountData = (year) => {
    if (year === COMPONENTS.DIALOGS.SHOW_ACCOUNTING.ALL_YEARS_ID) {
        return {
            sums: records.bookings.sumBookingsPerType,
            taxes: records.bookings.sumAllTaxes,
            fees: records.bookings.sumAllFees
        };
    }
    return {
        sums: records.bookings.sumBookingsPerTypeAndYear(year),
        taxes: records.bookings.sumTaxes(year),
        fees: records.bookings.sumFees(year)
    };
};
const __VLS_exposed = { title: t("components.dialogs.showAccounting.title") };
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS ShowAccounting: setup");
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
const __VLS_9 = {}.VSelect;
;
VSelect;
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    modelValue: (__VLS_ctx.selected),
    items: (__VLS_ctx.yearEntries),
    label: (__VLS_ctx.t('components.dialogs.showAccounting.year')),
    clearable: true,
    density: "compact",
    itemTitle: "title",
    itemValue: "id",
    maxWidth: "300",
    variant: "outlined",
}));
const __VLS_11 = __VLS_10({
    modelValue: (__VLS_ctx.selected),
    items: (__VLS_ctx.yearEntries),
    label: (__VLS_ctx.t('components.dialogs.showAccounting.year')),
    clearable: true,
    density: "compact",
    itemTitle: "title",
    itemValue: "id",
    maxWidth: "300",
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
[selected, yearEntries, t,];
const __VLS_14 = {}.VCard;
;
VCard;
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_18 } = __VLS_17.slots;
const __VLS_19 = {}.VCardText;
;
VCardText;
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ class: "pa-5" },
}));
const __VLS_21 = __VLS_20({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_23 } = __VLS_22.slots;
const __VLS_24 = {}.VDataTable;
;
VDataTable;
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (false),
    items: (__VLS_ctx.accountEntries),
    itemsPerPage: (__VLS_ctx.sumsPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('components.dialogs.showAccounting.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('components.dialogs.showAccounting.noDataText')),
    density: "compact",
    itemKey: "id",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (false),
    items: (__VLS_ctx.accountEntries),
    itemsPerPage: (__VLS_ctx.sumsPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('components.dialogs.showAccounting.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('components.dialogs.showAccounting.noDataText')),
    density: "compact",
    itemKey: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
const __VLS_30 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setSumsPerPage) });
const { default: __VLS_31 } = __VLS_27.slots;
[t, t, HEADERS, accountEntries, sumsPerPage, VIEWS, setSumsPerPage,];
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_32 } = __VLS_27.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_32);
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        ...{ class: "table-row" },
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "d-none" },
    });
    (item.id);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: (item.nameClass) },
    });
    (item.name);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: (item.sumClass) },
    });
    (__VLS_ctx.n(item.sum, "currency"));
    [n,];
}
var __VLS_27;
var __VLS_22;
var __VLS_17;
var __VLS_3;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VIEWS: VIEWS,
            n: n,
            t: t,
            sumsPerPage: sumsPerPage,
            setSumsPerPage: setSumsPerPage,
            HEADERS: HEADERS,
            selected: selected,
            yearEntries: yearEntries,
            accountEntries: accountEntries,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
