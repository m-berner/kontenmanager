import { computed, onBeforeMount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useRecordsStore } from "@/stores/records";
import { useRuntimeStore } from "@/stores/runtime";
import { DomainUtils } from "@/domains/utils";
import { DomainLogic } from "@/domains/logic";
import DotMenu from "@/components/DotMenu.vue";
import { createCompanyHeaders, createCompanyMenuItems, VIEWS } from "@/config/views";
import { DATE } from "@/domains/config/date";
import { AppError } from "@/domains/errors";
const { d, n, t } = useI18n();
const records = useRecordsStore();
const { active: activeStockItems } = storeToRefs(records.stocks);
const settings = useSettingsStore();
const { stocksPerPage } = storeToRefs(settings);
const { setStocksPerPage } = settings;
const runtime = useRuntimeStore();
const { stocksPage, isDownloading, isStockLoading } = storeToRefs(runtime);
const HEADERS = computed(() => createCompanyHeaders(t));
const MENU_ITEMS = computed(() => createCompanyMenuItems(t));
const isValidDate = (dateString) => {
    return new Date(dateString).getTime() > DATE.ZERO_TIME;
};
const hasPortfolio = (portfolio) => {
    return (portfolio ?? 0) >= VIEWS.MINIMUM_PORTFOLIO_THRESHOLD;
};
const calculatePercentChange = (euroChange, invest) => {
    if (!invest || invest === 0)
        return 0;
    return (euroChange ?? 0) / invest;
};
const loadRequiredPages = async (startPage = 1) => {
    const pagesToLoad = [];
    const totalPages = Math.ceil(activeStockItems.value.length / stocksPerPage.value);
    for (let page = startPage; page <= totalPages; page++) {
        const pageFirstIndex = stocksPerPage.value * (page - 1);
        const stock = activeStockItems.value[pageFirstIndex];
        if (!stock || !hasPortfolio(stock.mPortfolio))
            break;
        pagesToLoad.push(page);
    }
    try {
        await Promise.all(pagesToLoad.map((page) => records.stocks.loadOnlineData(page)));
    }
    catch {
        throw new AppError("COMPANY_CONTENT: loadRequiredPages", "Failed to load online market data for required pages.", true);
    }
};
const onUpdatePage = async (page) => {
    DomainUtils.log("COMPANY_CONTENT: onUpdatePage", page, "info");
    stocksPage.value = page;
    if (runtime.loadedStocksPages.has(page))
        return;
    isStockLoading.value = true;
    try {
        await records.stocks.loadOnlineData(page);
    }
    catch {
        throw new AppError("COMPANY_CONTENT: onUpdatePage", "Failed to load online market data for required page.", true);
    }
    finally {
        isStockLoading.value = false;
    }
};
onBeforeMount(async () => {
    DomainUtils.log("COMPANY_CONTENT: onBeforeMount");
    records.stocks.items.forEach((stock) => {
        if (stock.cID > 0) {
            stock.mPortfolio = DomainLogic.calculatePortfolioByStockId(records.bookings.items, stock.cID);
            stock.mInvest = DomainLogic.calculateInvestByStockId(records.bookings.items, stock.cID);
        }
    });
    if (!runtime.loadedStocksPages.has(stocksPage.value)) {
        isDownloading.value = true;
        isStockLoading.value = true;
        try {
            await loadRequiredPages(stocksPage.value);
        }
        finally {
            isStockLoading.value = false;
            isDownloading.value = false;
        }
    }
    else {
        activeStockItems.value.forEach((stock) => {
            if (stock.mValue) {
                stock.mEuroChange =
                    stock.mValue * (stock.mPortfolio ?? 0) - (stock.mInvest ?? 0);
            }
        });
    }
});
watch(stocksPerPage, async () => {
    runtime.clearStocksPages();
    isDownloading.value = true;
    isStockLoading.value = true;
    try {
        await loadRequiredPages(stocksPage.value);
    }
    finally {
        isStockLoading.value = false;
        isDownloading.value = false;
    }
});
DomainUtils.log("VIEWS CompanyContent: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VDataTable;
;
VDataTable;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:itemsPerPage': {} },
    ...{ 'onUpdate:page': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (true),
    items: (__VLS_ctx.activeStockItems),
    itemsPerPage: (__VLS_ctx.stocksPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('views.companyContent.stocksTable.itemsPerPageText')),
    loading: (__VLS_ctx.isStockLoading),
    noDataText: (__VLS_ctx.t('views.companyContent.stocksTable.noDataText')),
    density: "compact",
    itemKey: "cID",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:itemsPerPage': {} },
    ...{ 'onUpdate:page': {} },
    headers: (__VLS_ctx.HEADERS),
    hideNoData: (false),
    hover: (true),
    items: (__VLS_ctx.activeStockItems),
    itemsPerPage: (__VLS_ctx.stocksPerPage),
    itemsPerPageOptions: (__VLS_ctx.VIEWS.ITEMS_PER_PAGE_OPTIONS),
    itemsPerPageText: (__VLS_ctx.t('views.companyContent.stocksTable.itemsPerPageText')),
    loading: (__VLS_ctx.isStockLoading),
    noDataText: (__VLS_ctx.t('views.companyContent.stocksTable.noDataText')),
    density: "compact",
    itemKey: "cID",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ 'update:itemsPerPage': {} },
    { 'onUpdate:itemsPerPage': (__VLS_ctx.setStocksPerPage) });
const __VLS_7 = ({ 'update:page': {} },
    { 'onUpdate:page': (__VLS_ctx.onUpdatePage) });
var __VLS_8 = {};
const { default: __VLS_9 } = __VLS_3.slots;
[HEADERS, activeStockItems, stocksPerPage, VIEWS, t, t, isStockLoading, setStocksPerPage, onUpdatePage,];
{
    const { [__VLS_tryAsConstant(`item`)]: __VLS_10 } = __VLS_3.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_10);
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        ...{ class: "table-row" },
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "d-none" },
    });
    (item.cID);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    ;
    const __VLS_11 = __VLS_asFunctionalComponent(DotMenu, new DotMenu({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }));
    const __VLS_12 = __VLS_11({
        items: (__VLS_ctx.MENU_ITEMS),
        recordId: (item.cID),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    [MENU_ITEMS,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (item.cCompany);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (item.cISIN);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    if (__VLS_ctx.isValidDate(item.cQuarterDay)) {
        [isValidDate,];
        (__VLS_ctx.d(new Date(item.cQuarterDay), "short"));
        [d,];
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    if (__VLS_ctx.isValidDate(item.cMeetingDay)) {
        [isValidDate,];
        (__VLS_ctx.d(new Date(item.cMeetingDay), "short"));
        [d,];
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    if (__VLS_ctx.hasPortfolio(item.mPortfolio)) {
        [hasPortfolio,];
        (item.mPortfolio);
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    if (__VLS_ctx.hasPortfolio(item.mPortfolio)) {
        [hasPortfolio,];
        const __VLS_15 = {}.VTooltip;
        ;
        VTooltip;
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
            text: (__VLS_ctx.n(__VLS_ctx.calculatePercentChange(item.mEuroChange, item.mInvest), 'percent')),
            location: "left",
        }));
        const __VLS_17 = __VLS_16({
            text: (__VLS_ctx.n(__VLS_ctx.calculatePercentChange(item.mEuroChange, item.mInvest), 'percent')),
            location: "left",
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        const { default: __VLS_19 } = __VLS_18.slots;
        [n, calculatePercentChange,];
        {
            const { activator: __VLS_20 } = __VLS_18.slots;
            const [{ props }] = __VLS_getSlotParameters(__VLS_20);
            __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
                ...{ class: (__VLS_ctx.DomainUtils.winLossClass(item.mEuroChange)) },
                ...(props),
            });
            [DomainUtils,];
            (__VLS_ctx.n(item.mEuroChange ?? 0, "currency"));
            [n,];
        }
        var __VLS_18;
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.n(item.mMin ?? 0, "currency"));
    [n,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "font-weight-bold color-black" },
    });
    (__VLS_ctx.n(item.mValue ?? 0, "currency3"));
    [n,];
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (__VLS_ctx.n(item.mMax ?? 0, "currency"));
    [n,];
}
var __VLS_3;
;
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
            activeStockItems: activeStockItems,
            stocksPerPage: stocksPerPage,
            setStocksPerPage: setStocksPerPage,
            isStockLoading: isStockLoading,
            HEADERS: HEADERS,
            MENU_ITEMS: MENU_ITEMS,
            isValidDate: isValidDate,
            hasPortfolio: hasPortfolio,
            calculatePercentChange: calculatePercentChange,
            onUpdatePage: onUpdatePage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
