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
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vAppBar;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    app: true,
    color: "secondary",
    flat: true,
}));
const __VLS_2 = __VLS_1({
    app: true,
    color: "secondary",
    flat: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
{
    const { prepend: __VLS_7 } = __VLS_3.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        alt: (__VLS_ctx.t('views.titleBar.iconsAlt.logo')),
        src: (__VLS_ctx.COMPONENTS.TITLE_BAR.LOGO),
    });
    [t, COMPONENTS,];
}
let __VLS_8;
vAppBarTitle;
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const { default: __VLS_13 } = __VLS_11.slots;
(__VLS_ctx.t("views.titleBar.title"));
[t,];
var __VLS_11;
let __VLS_14;
vSpacer;
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    let __VLS_19;
    vChip;
    const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }));
    const __VLS_21 = __VLS_20({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    ;
    const { default: __VLS_24 } = __VLS_22.slots;
    (__VLS_ctx.t("views.titleBar.bookingsSumLabel"));
    (__VLS_ctx.balance);
    [t, runtime, CODES, balance,];
    var __VLS_22;
}
if (__VLS_ctx.showDepotChip) {
    let __VLS_25;
    vChip;
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }));
    const __VLS_27 = __VLS_26({
        ...{ class: "text-h6" },
        color: "secondary",
        variant: "flat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    ;
    const { default: __VLS_30 } = __VLS_28.slots;
    (__VLS_ctx.t("views.titleBar.depotSumLabel"));
    (__VLS_ctx.depot);
    [t, showDepotChip, depot,];
    var __VLS_28;
}
let __VLS_31;
vSpacer;
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({}));
const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
if (__VLS_ctx.activeAccountId > 0) {
    let __VLS_36;
    vSelect;
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
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
    const __VLS_38 = __VLS_37({
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
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_41;
    const __VLS_42 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onUpdateTitleBar) });
    const { default: __VLS_43 } = __VLS_39.slots;
    {
        const { prepend: __VLS_44 } = __VLS_39.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            alt: (__VLS_ctx.t('views.titleBar.iconsAlt.logo')),
            src: (__VLS_ctx.logoUrl),
        });
        [t, t, runtime, CODES, activeAccountId, activeAccountId, INDEXED_DB, INDEXED_DB, records, onUpdateTitleBar, logoUrl,];
    }
    [];
    var __VLS_39;
    var __VLS_40;
}
[];
var __VLS_3;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
