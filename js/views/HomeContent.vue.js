import { computed, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { DomainUtils } from "@/domains/utils";
import DotMenu from "@/components/DotMenu.vue";
import { useTheme } from "vuetify";
import { useStorage } from "@/composables/useStorage";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { databaseService } from "@/services/database";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { createHomeHeaders, createHomeMenuItems, VIEWS } from "@/config/views";
const { d, n, t } = useI18n();
const { addStorageChangedListener, clearStorage, installStorageLocal } = useStorage();
const records = useRecordsStore();
const { items: bookingItems } = storeToRefs(records.bookings);
const settings = useSettingsStore();
const { bookingsPerPage, skin } = storeToRefs(settings);
const { setBookingsPerPage } = settings;
const theme = useTheme();
const HEADERS = computed(() => createHomeHeaders(t));
const MENU_ITEMS = computed(() => createHomeMenuItems(t));
const search = ref("");
const onChangeHandler = (changes) => {
    DomainUtils.log("APP_INDEX: changeHandler");
    const changesKey = Object.keys(changes);
    const { service, indexes, markets, materials, exchanges } = storeToRefs(settings);
    const sync = {
        [BROWSER_STORAGE.SKIN.key]: () => {
            if (theme?.global?.name) {
                theme.global.name.value = changes[BROWSER_STORAGE.SKIN.key].newValue;
            }
            skin.value = changes[BROWSER_STORAGE.SKIN.key].newValue;
        },
        [BROWSER_STORAGE.SERVICE.key]: () => {
            service.value = changes[BROWSER_STORAGE.SERVICE.key].newValue;
        },
        [BROWSER_STORAGE.INDEXES.key]: () => {
            indexes.value = changes[BROWSER_STORAGE.INDEXES.key].newValue;
        },
        [BROWSER_STORAGE.MARKETS.key]: () => {
            markets.value = changes[BROWSER_STORAGE.MARKETS.key].newValue;
        },
        [BROWSER_STORAGE.MATERIALS.key]: () => {
            materials.value = changes[BROWSER_STORAGE.MATERIALS.key].newValue;
        },
        [BROWSER_STORAGE.EXCHANGES.key]: () => {
            exchanges.value = changes[BROWSER_STORAGE.EXCHANGES.key].newValue;
        }
    };
    sync[changesKey[0]]?.();
};
const removeStorageChangedListener = addStorageChangedListener(onChangeHandler);
const onBeforeUnload = () => {
    DomainUtils.log("APP_INDEX: onBeforeUnload");
    removeStorageChangedListener();
    databaseService.disconnect();
};
window.addEventListener("beforeunload", onBeforeUnload, { once: true });
const { register, unregister } = useKeyboardShortcuts();
const onResetStorage = async () => {
    await clearStorage();
    await installStorageLocal();
};
register("Ctrl+Alt+R", onResetStorage);
onUnmounted(() => {
    unregister("Ctrl+Alt+R");
});
DomainUtils.log("VIEWS HomeContent: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VTextField;
;
VTextField;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
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
[search, t,];
const __VLS_5 = {}.VDataTable;
;
VDataTable;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onUpdate:itemsPerPage': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (true),
    items: (__VLS_ctx.bookingItems),
    itemsPerPage: (__VLS_ctx.bookingsPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
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
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('views.homeContent.bookingsTable.itemsPerPageText')),
    noDataText: (__VLS_ctx.t('views.homeContent.bookingsTable.noDataText')),
    search: (__VLS_ctx.search),
    density: "compact",
    itemKey: "cID",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
const __VLS_11 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setBookingsPerPage) });
const { default: __VLS_12 } = __VLS_8.slots;
[search, t, t, HEADERS, bookingItems, bookingsPerPage, VIEWS, setBookingsPerPage,];
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_13 } = __VLS_8.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_13);
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        ...{ class: "table-row" },
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "d-none" },
    });
    (item.cID);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    ;
    const __VLS_14 = __VLS_asFunctionalComponent(DotMenu, new DotMenu({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }));
    const __VLS_15 = __VLS_14({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    [MENU_ITEMS,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.d(__VLS_ctx.DomainUtils.utcDate(item.cBookDate), "short"));
    [d, DomainUtils,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.n(item.cDebit, "currency"));
    [n,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.n(item.cCredit, "currency"));
    [n,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (item.cDescription);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.records.bookingTypes.getNameById(item.cBookingTypeID));
    [records,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "d-none" },
    });
    (item.cAccountNumberID);
}
var __VLS_8;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DomainUtils: DomainUtils,
            DotMenu: DotMenu,
            VIEWS: VIEWS,
            d: d,
            n: n,
            t: t,
            records: records,
            bookingItems: bookingItems,
            bookingsPerPage: bookingsPerPage,
            setBookingsPerPage: setBookingsPerPage,
            HEADERS: HEADERS,
            MENU_ITEMS: MENU_ITEMS,
            search: search,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
