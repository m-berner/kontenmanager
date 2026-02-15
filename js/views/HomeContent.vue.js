import { computed, onBeforeMount, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { DomainUtils } from "@/domains/utils";
import DotMenu from "@/components/DotMenu.vue";
import { useStorage } from "@/composables/useStorage";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { databaseService } from "@/services/database/service";
import { createHomeHeaders, createHomeMenuItems } from "@/configs/views";
const { d, n, t } = useI18n();
const { clearStorage, installStorageLocal } = useStorage();
const records = useRecordsStore();
const { items: bookingItems } = storeToRefs(records.bookings);
const settings = useSettingsStore();
const { bookingsPerPage } = storeToRefs(settings);
const setBookingsPerPage = (value) => settings.setBookingsPerPage(value);
const ITEMS_PER_PAGE_OPTIONS = [
    {
        value: 5,
        title: "5"
    },
    {
        value: 7,
        title: "7"
    },
    {
        value: 9,
        title: "9"
    },
    {
        value: 11,
        title: "11"
    },
    {
        value: 13,
        title: "13"
    }
];
const HEADERS = computed(() => createHomeHeaders(t));
const MENU_ITEMS = computed(() => createHomeMenuItems(t));
const search = ref("");
const onBeforeUnload = () => {
    DomainUtils.log("VIEWS HomeContent: onBeforeUnload");
    databaseService.disconnect();
};
const { register, unregister } = useKeyboardShortcuts();
const onResetStorage = async () => {
    await clearStorage();
    await installStorageLocal();
};
onBeforeMount(() => {
    DomainUtils.log("VIEWS HomeContent: onBeforeMount");
    window.addEventListener("beforeunload", onBeforeUnload, { once: true });
    register("Ctrl+Alt+R", onResetStorage);
});
onUnmounted(() => {
    unregister("Ctrl+Alt+R");
});
DomainUtils.log("VIEWS HomeContent: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vTextField;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('views.homeContent.search')),
    density: "compact",
    hideDetails: true,
    prependInnerIcon: "$magnify",
    singleLine: true,
    variant: "outlined",
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.search),
    label: (__VLS_ctx.t('views.homeContent.search')),
    density: "compact",
    hideDetails: true,
    prependInnerIcon: "$magnify",
    singleLine: true,
    variant: "outlined",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
vDataTable;
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (true),
    items: (__VLS_ctx.bookingItems),
    itemsPerPage: (__VLS_ctx.bookingsPerPage),
    itemsPerPageOptions: (__VLS_ctx.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('views.homeContent.bookingsTable.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('views.homeContent.bookingsTable.noDataText')),
    search: (__VLS_ctx.search),
    density: "compact",
    itemKey: "cID",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (true),
    items: (__VLS_ctx.bookingItems),
    itemsPerPage: (__VLS_ctx.bookingsPerPage),
    itemsPerPageOptions: (__VLS_ctx.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('views.homeContent.bookingsTable.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('views.homeContent.bookingsTable.noDataText')),
    search: (__VLS_ctx.search),
    density: "compact",
    itemKey: "cID",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setBookingsPerPage) });
const { default: __VLS_12 } = __VLS_8.slots;
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_13 } = __VLS_8.slots;
    const [{ item }] = __VLS_vSlot(__VLS_13);
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        ...{ class: "table-row" },
    });
    ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "d-none" },
    });
    ;
    (item.cID);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    const __VLS_14 = DotMenu;
    const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }));
    const __VLS_16 = __VLS_15({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.d(__VLS_ctx.DomainUtils.utcDate(item.cBookDate), "short"));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.n(item.cDebit, "currency"));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.n(item.cCredit, "currency"));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (item.cDescription);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
    (__VLS_ctx.records.bookingTypes.getNameById(item.cBookingTypeID));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "d-none" },
    });
    ;
    (item.cAccountNumberID);
    [search, search, t, t, t, HEADERS, bookingItems, bookingsPerPage, ITEMS_PER_PAGE_OPTIONS, setBookingsPerPage, MENU_ITEMS, d, DomainUtils, n, n, records,];
}
[];
var __VLS_8;
var __VLS_9;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
