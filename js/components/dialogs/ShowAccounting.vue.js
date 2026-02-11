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
vSelect;
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
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
let __VLS_14;
vCard;
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
const { default: __VLS_19 } = __VLS_17.slots;
let __VLS_20;
vCardText;
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    ...{ class: "pa-5" },
}));
const __VLS_22 = __VLS_21({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
;
const { default: __VLS_25 } = __VLS_23.slots;
let __VLS_26;
vDataTable;
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
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
const __VLS_28 = __VLS_27({
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
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
let __VLS_31;
const __VLS_32 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setSumsPerPage) });
const { default: __VLS_33 } = __VLS_29.slots;
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_34 } = __VLS_29.slots;
    const [{ item }] = __VLS_vSlot(__VLS_34);
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        ...{ class: "table-row" },
    });
    ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "d-none" },
    });
    ;
    (item.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: (item.nameClass) },
    });
    (item.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: (item.sumClass) },
    });
    (__VLS_ctx.n(item.sum, "currency"));
    [selected, yearEntries, t, t, t, HEADERS, accountEntries, sumsPerPage, VIEWS, setSumsPerPage, n,];
}
[];
var __VLS_29;
var __VLS_30;
[];
var __VLS_23;
[];
var __VLS_17;
[];
var __VLS_3;
var __VLS_4;
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
export default {};
