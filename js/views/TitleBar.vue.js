import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import connectionIcon from "@/assets/connection48.png";
import defaultIcon from "@/assets/icon48.png";
import { useSettingsStore } from "@/stores/settings";
import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { useStorage } from "@/composables/useStorage";
import { DomainUtils } from "@/domains/utils";
import { fetchService } from "@/services/fetch";
import { INDEXED_DB } from "@/config/database";
import { databaseService } from "@/services/database";
import { BROWSER_STORAGE } from "@/domains/config/storage";
import { COMPONENTS } from "@/config/components";
import { CODES } from "@/config/codes";
import { useAlert } from "@/composables/useAlert";
const { n, t } = useI18n();
const records = useRecordsStore();
const settings = useSettingsStore();
const runtime = useRuntimeStore();
const { handleUserError } = useAlert();
const { setStorage } = useStorage();
const { activeAccountId } = storeToRefs(settings);
let depotTimer;
const connectionState = ref("checking");
const showDepotChip = ref(false);
const logoUrl = computed(() => {
    if (connectionState.value === "checking") {
        return connectionIcon;
    }
    if (connectionState.value === "offline") {
        return connectionIcon;
    }
    const account = records.accounts.items.find((a) => a.cID === activeAccountId.value);
    return account?.cLogoUrl || defaultIcon;
});
const balance = computed(() => {
    return n(records.bookings.sumBookings(), "currency");
});
const depot = computed(() => {
    return n(records.stocks.sumDepot(), "currency");
});
const onUpdateTitleBar = async () => {
    DomainUtils.log("TITLE_BAR onUpdateTitleBar");
    try {
        await setStorage(BROWSER_STORAGE.ACTIVE_ACCOUNT_ID.key, activeAccountId.value);
        const storesDB = await databaseService.getAccountRecords(activeAccountId.value);
        await records.init(storesDB, {
            title: t("mixed.smImportOnly.title"),
            message: t("mixed.smImportOnly.message")
        });
    }
    catch (err) {
        await handleUserError("VIEWS TitleBar", err, {});
    }
};
watch([() => runtime.getCurrentView, () => runtime.isDownloading], () => {
    if (runtime.getCurrentView === CODES.VIEW_CODES.COMPANY &&
        !runtime.isDownloading) {
        if (depotTimer)
            clearTimeout(depotTimer);
        depotTimer = window.setTimeout(() => {
            showDepotChip.value = true;
        }, 180);
    }
    else {
        if (depotTimer)
            clearTimeout(depotTimer);
        showDepotChip.value = false;
    }
}, { immediate: true });
onMounted(async () => {
    try {
        const online = await fetchService.fetchIsOk();
        connectionState.value = online ? "online" : "offline";
    }
    catch {
        connectionState.value = "offline";
    }
});
DomainUtils.log("Views TitleBar: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VAppBar;
;
VAppBar;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    app: true,
    color: "secondary",
    flat: true,
}));
const __VLS_2 = __VLS_1({
    app: true,
    color: "secondary",
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
{
    const { prepend: __VLS_6 } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_elements.img)({
        alt: (__VLS_ctx.t('views.titleBar.iconsAlt.logo')),
        src: (__VLS_ctx.COMPONENTS.TITLE_BAR.LOGO),
    });
    [t, COMPONENTS,];
}
const __VLS_7 = {}.VAppBarTitle;
;
VAppBarTitle;
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_11 } = __VLS_10.slots;
(__VLS_ctx.t("views.titleBar.title"));
[t,];
var __VLS_10;
const __VLS_12 = {}.VSpacer;
;
VSpacer;
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_17 = {}.VChip;
    ;
    VChip;
    const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }));
    const __VLS_19 = __VLS_18({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    const { default: __VLS_21 } = __VLS_20.slots;
    (__VLS_ctx.t("views.titleBar.bookingsSumLabel"));
    (__VLS_ctx.balance);
    [t, balance,];
    var __VLS_20;
}
if (__VLS_ctx.showDepotChip) {
    [showDepotChip,];
    const __VLS_22 = {}.VChip;
    ;
    VChip;
    const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }));
    const __VLS_24 = __VLS_23({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    const { default: __VLS_26 } = __VLS_25.slots;
    (__VLS_ctx.t("views.titleBar.depotSumLabel"));
    (__VLS_ctx.depot);
    [t, depot,];
    var __VLS_25;
}
const __VLS_27 = {}.VSpacer;
;
VSpacer;
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
if (__VLS_ctx.activeAccountId > 0) {
    [activeAccountId,];
    const __VLS_32 = {}.VSelect;
    ;
    VSelect;
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.activeAccountId),
        disabled: (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID),
        items: (__VLS_ctx.records.accounts.items),
        label: (__VLS_ctx.t('views.titleBar.selectAccountLabel')),
        density: "compact",
        hideDetails: true,
        maxWidth: "350",
        variant: "outlined",
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.activeAccountId),
        disabled: (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY),
        itemTitle: (__VLS_ctx.INDEXED_DB.STORE.ACCOUNTS.FIELDS.IBAN),
        itemValue: (__VLS_ctx.INDEXED_DB.STORE.ACCOUNTS.FIELDS.ID),
        items: (__VLS_ctx.records.accounts.items),
        label: (__VLS_ctx.t('views.titleBar.selectAccountLabel')),
        density: "compact",
        hideDetails: true,
        maxWidth: "350",
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_36;
    let __VLS_37;
    const __VLS_38 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onUpdateTitleBar) });
    const { default: __VLS_39 } = __VLS_35.slots;
    [t, runtime, CODES, activeAccountId, INDEXED_DB, INDEXED_DB, records, onUpdateTitleBar,];
    {
        const { prepend: __VLS_40 } = __VLS_35.slots;
        __VLS_asFunctionalElement(__VLS_elements.img)({
            alt: (__VLS_ctx.t('views.titleBar.iconsAlt.logo')),
            src: (__VLS_ctx.logoUrl),
        });
        [t, logoUrl,];
    }
    var __VLS_35;
}
var __VLS_3;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            INDEXED_DB: INDEXED_DB,
            COMPONENTS: COMPONENTS,
            CODES: CODES,
            t: t,
            records: records,
            runtime: runtime,
            activeAccountId: activeAccountId,
            showDepotChip: showDepotChip,
            logoUrl: logoUrl,
            balance: balance,
            depot: depot,
            onUpdateTitleBar: onUpdateTitleBar,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
