import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { useAlert } from "@/composables/useAlert";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import DialogPort from "@/components/DialogPort.vue";
import { VIEW_CODES } from "@/configs/codes";
const { t } = useI18n();
const { getMessage, handleUserNotice, openOptionsPage } = useBrowser();
const runtime = useRuntimeStore();
const { isStockLoading } = storeToRefs(runtime);
const records = useRecordsStore();
const { handleUserInfo } = useAlert();
const { items: accountItems } = storeToRefs(records.accounts);
const { items: bookingItems } = storeToRefs(records.bookings);
const { items: bookingTypeItems } = storeToRefs(records.bookingTypes);
const dialogActions = {
    updateQuote: async () => {
        try {
            isStockLoading.value = true;
            runtime.isDownloading = true;
            await records.stocks.loadOnlineData(runtime.stocksPage);
        }
        catch {
        }
        finally {
            isStockLoading.value = false;
            runtime.isDownloading = false;
        }
    },
    fadeInStock: async () => {
        if (records.stocks.passive.length === 0) {
            await handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_company"));
        }
        else {
            runtime.setTeleport({
                dialogName: "fadeInStock",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    addStock: () => {
        runtime.setTeleport({
            dialogName: "addStock",
            dialogOk: true,
            dialogVisibility: true
        });
    },
    updateStock: () => {
        runtime.setTeleport({
            dialogName: "updateStock",
            dialogOk: true,
            dialogVisibility: true
        });
    },
    addAccount: () => {
        runtime.setTeleport({
            dialogName: "addAccount",
            dialogOk: true,
            dialogVisibility: true
        });
    },
    updateAccount: async () => {
        if (accountItems.value.length === 0) {
            await handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_account"));
        }
        else {
            runtime.setTeleport({
                dialogName: "updateAccount",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    deleteAccountConfirmation: async () => {
        if (accountItems.value.length === 0) {
            await handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_account"));
        }
        else {
            runtime.setTeleport({
                dialogName: "deleteAccountConfirmation",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    addBookingType: async () => {
        if (accountItems.value.length === 0) {
            await handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_account"));
        }
        else {
            runtime.setTeleport({
                dialogName: "addBookingType",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    updateBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            await handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_bookingType"));
        }
        else {
            runtime.setTeleport({
                dialogName: "updateBookingType",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    deleteBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            void handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_bookingType"));
        }
        else {
            runtime.setTeleport({
                dialogName: "deleteBookingType",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    addBooking: async () => {
        if (accountItems.value.length === 0) {
            void handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_account"));
        }
        else {
            runtime.setTeleport({
                dialogName: "addBooking",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    exportDatabase: () => {
        if (accountItems.value.length === 0) {
            void handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_account"));
        }
        else {
            runtime.setTeleport({
                dialogName: "exportDatabase",
                dialogOk: true,
                dialogVisibility: true
            });
        }
    },
    importDatabase: () => {
        runtime.setTeleport({
            dialogName: "importDatabase",
            dialogOk: true,
            dialogVisibility: true
        });
    },
    showAccounting: () => {
        if (bookingItems.value.length === 0) {
            void handleUserNotice(t("views.headerBar.infoTitle"), getMessage("xx_no_booking"));
        }
        else {
            runtime.setTeleport({
                dialogName: "showAccounting",
                dialogOk: false,
                dialogVisibility: true
            });
        }
    },
    deleteAccount: () => { },
    updateBooking: () => { },
    deleteBooking: () => { },
    showDividend: () => { },
    openLink: () => { },
    deleteStock: () => { },
    home: () => {
        runtime.setCurrentView(VIEW_CODES.HOME);
    },
    company: () => {
        runtime.setCurrentView(VIEW_CODES.COMPANY);
    },
    setting: async () => {
        await openOptionsPage();
    }
};
const dialogValidations = {
    updateAccount: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_account")));
            return false;
        }
        return true;
    },
    fadeInStock: async () => {
        if (records.stocks.passive.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_company")));
            return false;
        }
        return true;
    },
    deleteAccountConfirmation: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_account")));
            return false;
        }
        return true;
    },
    addBookingType: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_account")));
            return false;
        }
        return true;
    },
    updateBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_bookingType")));
            return false;
        }
        return true;
    },
    deleteBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_bookingType")));
            return false;
        }
        return true;
    },
    addBooking: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_account")));
            return false;
        }
        return true;
    },
    exportDatabase: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_account")));
            return false;
        }
        return true;
    },
    showAccounting: async () => {
        if (bookingItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(getMessage("xx_no_booking")));
            return false;
        }
        return true;
    },
    addAccount: () => {
        return true;
    },
    deleteAccount: () => {
        return true;
    },
    deleteBooking: () => {
        return true;
    },
    updateBooking: () => {
        return true;
    },
    updateStock: () => {
        return true;
    },
    showDividend: () => {
        return true;
    },
    addStock: () => {
        return true;
    },
    importDatabase: () => {
        return true;
    },
    updateQuote: () => {
        return true;
    },
    deleteStock: () => {
        return true;
    },
    home: () => {
        return true;
    },
    company: () => {
        return true;
    },
    setting: () => {
        return true;
    },
    openLink: () => {
        return true;
    }
};
const onIconClick = async (ev) => {
    const target = ev.target;
    const dialogId = target.closest("[id]")?.id;
    if (!dialogId)
        return;
    if (typeof dialogValidations[dialogId] !== "function" ||
        typeof dialogActions[dialogId] !== "function")
        return;
    await dialogActions[dialogId]();
};
DomainUtils.log("VIEWS HeaderBar: setup");
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
    flat: true,
    height: "75",
}));
const __VLS_2 = __VLS_1({
    app: true,
    flat: true,
    height: "75",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
vSpacer;
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_11;
RouterLink;
const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    ...{ 'onClick': {} },
    id: "home",
    ...{ class: "router-link-active" },
    to: "/",
}));
const __VLS_13 = __VLS_12({
    ...{ 'onClick': {} },
    id: "home",
    ...{ class: "router-link-active" },
    to: "/",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
let __VLS_16;
const __VLS_17 = ({ click: {} },
    { onClick: (__VLS_ctx.onIconClick) });
;
const { default: __VLS_18 } = __VLS_14.slots;
let __VLS_19;
vTooltip;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    text: (__VLS_ctx.t('views.headerBar.home')),
    location: "top",
}));
const __VLS_21 = __VLS_20({
    text: (__VLS_ctx.t('views.headerBar.home')),
    location: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
{
    const { activator: __VLS_25 } = __VLS_22.slots;
    const [{ props }] = __VLS_vSlot(__VLS_25);
    let __VLS_26;
    vAppBarNavIcon;
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        color: "grey",
        icon: "$home",
        size: "large",
        ...(props),
        variant: "tonal",
    }));
    const __VLS_28 = __VLS_27({
        color: "grey",
        icon: "$home",
        size: "large",
        ...(props),
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    [onIconClick, t,];
}
[];
var __VLS_22;
[];
var __VLS_14;
var __VLS_15;
if (__VLS_ctx.records.accounts.isDepot) {
    let __VLS_31;
    RouterLink;
    const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        ...{ 'onClick': {} },
        id: "company",
        ...{ class: "router-link-active" },
        to: "/company",
    }));
    const __VLS_33 = __VLS_32({
        ...{ 'onClick': {} },
        id: "company",
        ...{ class: "router-link-active" },
        to: "/company",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    let __VLS_36;
    const __VLS_37 = ({ click: {} },
        { onClick: (__VLS_ctx.onIconClick) });
    ;
    const { default: __VLS_38 } = __VLS_34.slots;
    let __VLS_39;
    vTooltip;
    const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        text: (__VLS_ctx.t('views.headerBar.company')),
        location: "top",
    }));
    const __VLS_41 = __VLS_40({
        text: (__VLS_ctx.t('views.headerBar.company')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    const { default: __VLS_44 } = __VLS_42.slots;
    {
        const { activator: __VLS_45 } = __VLS_42.slots;
        const [{ props }] = __VLS_vSlot(__VLS_45);
        let __VLS_46;
        vAppBarNavIcon;
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            color: "grey",
            icon: "$showCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_48 = __VLS_47({
            color: "grey",
            icon: "$showCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        [onIconClick, t, records,];
    }
    [];
    var __VLS_42;
    [];
    var __VLS_34;
    var __VLS_35;
}
let __VLS_51;
vSpacer;
const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({}));
const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY) {
    let __VLS_56;
    vTooltip;
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        text: (__VLS_ctx.t('views.headerBar.updateQuote')),
        location: "top",
    }));
    const __VLS_58 = __VLS_57({
        text: (__VLS_ctx.t('views.headerBar.updateQuote')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    const { default: __VLS_61 } = __VLS_59.slots;
    {
        const { activator: __VLS_62 } = __VLS_59.slots;
        const [{ props }] = __VLS_vSlot(__VLS_62);
        let __VLS_63;
        vAppBarNavIcon;
        const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
            ...{ 'onClick': {} },
            id: "updateQuote",
            icon: "$reload",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_65 = __VLS_64({
            ...{ 'onClick': {} },
            id: "updateQuote",
            icon: "$reload",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_64));
        let __VLS_68;
        const __VLS_69 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_66;
        var __VLS_67;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_59;
}
let __VLS_70;
vSpacer;
const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({}));
const __VLS_72 = __VLS_71({}, ...__VLS_functionalComponentArgsRest(__VLS_71));
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY) {
    let __VLS_75;
    vTooltip;
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        text: (__VLS_ctx.t('views.headerBar.addStock')),
        location: "top",
    }));
    const __VLS_77 = __VLS_76({
        text: (__VLS_ctx.t('views.headerBar.addStock')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    const { default: __VLS_80 } = __VLS_78.slots;
    {
        const { activator: __VLS_81 } = __VLS_78.slots;
        const [{ props }] = __VLS_vSlot(__VLS_81);
        let __VLS_82;
        vAppBarNavIcon;
        const __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
            ...{ 'onClick': {} },
            id: "addStock",
            icon: "$addCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_84 = __VLS_83({
            ...{ 'onClick': {} },
            id: "addStock",
            icon: "$addCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_83));
        let __VLS_87;
        const __VLS_88 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_85;
        var __VLS_86;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_78;
}
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY) {
    let __VLS_89;
    vTooltip;
    const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        text: (__VLS_ctx.t('views.headerBar.fadeInStock')),
        location: "top",
    }));
    const __VLS_91 = __VLS_90({
        text: (__VLS_ctx.t('views.headerBar.fadeInStock')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    const { default: __VLS_94 } = __VLS_92.slots;
    {
        const { activator: __VLS_95 } = __VLS_92.slots;
        const [{ props }] = __VLS_vSlot(__VLS_95);
        let __VLS_96;
        vAppBarNavIcon;
        const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            ...{ 'onClick': {} },
            id: "fadeInStock",
            icon: "$fadeInCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_98 = __VLS_97({
            ...{ 'onClick': {} },
            id: "fadeInStock",
            icon: "$fadeInCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        let __VLS_101;
        const __VLS_102 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_99;
        var __VLS_100;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_92;
}
let __VLS_103;
vSpacer;
const __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({}));
const __VLS_105 = __VLS_104({}, ...__VLS_functionalComponentArgsRest(__VLS_104));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_108;
    vTooltip;
    const __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
        text: (__VLS_ctx.t('views.headerBar.addAccount')),
        location: "top",
    }));
    const __VLS_110 = __VLS_109({
        text: (__VLS_ctx.t('views.headerBar.addAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    const { default: __VLS_113 } = __VLS_111.slots;
    {
        const { activator: __VLS_114 } = __VLS_111.slots;
        const [{ props }] = __VLS_vSlot(__VLS_114);
        let __VLS_115;
        vAppBarNavIcon;
        const __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
            ...{ 'onClick': {} },
            id: "addAccount",
            icon: "$addAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_117 = __VLS_116({
            ...{ 'onClick': {} },
            id: "addAccount",
            icon: "$addAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_116));
        let __VLS_120;
        const __VLS_121 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_118;
        var __VLS_119;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_111;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_122;
    vTooltip;
    const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
        text: (__VLS_ctx.t('views.headerBar.updateAccount')),
        location: "top",
    }));
    const __VLS_124 = __VLS_123({
        text: (__VLS_ctx.t('views.headerBar.updateAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    const { default: __VLS_127 } = __VLS_125.slots;
    {
        const { activator: __VLS_128 } = __VLS_125.slots;
        const [{ props }] = __VLS_vSlot(__VLS_128);
        let __VLS_129;
        vAppBarNavIcon;
        const __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
            ...{ 'onClick': {} },
            id: "updateAccount",
            icon: "$updateAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_131 = __VLS_130({
            ...{ 'onClick': {} },
            id: "updateAccount",
            icon: "$updateAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_130));
        let __VLS_134;
        const __VLS_135 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_132;
        var __VLS_133;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_125;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_136;
    vTooltip;
    const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
        text: (__VLS_ctx.t('views.headerBar.deleteAccount')),
        location: "top",
    }));
    const __VLS_138 = __VLS_137({
        text: (__VLS_ctx.t('views.headerBar.deleteAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    const { default: __VLS_141 } = __VLS_139.slots;
    {
        const { activator: __VLS_142 } = __VLS_139.slots;
        const [{ props }] = __VLS_vSlot(__VLS_142);
        let __VLS_143;
        vAppBarNavIcon;
        const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
            ...{ 'onClick': {} },
            id: "deleteAccountConfirmation",
            icon: "$deleteAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_145 = __VLS_144({
            ...{ 'onClick': {} },
            id: "deleteAccountConfirmation",
            icon: "$deleteAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_144));
        let __VLS_148;
        const __VLS_149 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_146;
        var __VLS_147;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_139;
}
let __VLS_150;
vSpacer;
const __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({}));
const __VLS_152 = __VLS_151({}, ...__VLS_functionalComponentArgsRest(__VLS_151));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_155;
    vTooltip;
    const __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
        text: (__VLS_ctx.t('views.headerBar.addBooking')),
        location: "top",
    }));
    const __VLS_157 = __VLS_156({
        text: (__VLS_ctx.t('views.headerBar.addBooking')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_156));
    const { default: __VLS_160 } = __VLS_158.slots;
    {
        const { activator: __VLS_161 } = __VLS_158.slots;
        const [{ props }] = __VLS_vSlot(__VLS_161);
        let __VLS_162;
        vAppBarNavIcon;
        const __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162({
            ...{ 'onClick': {} },
            id: "addBooking",
            icon: "$addBooking",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_164 = __VLS_163({
            ...{ 'onClick': {} },
            id: "addBooking",
            icon: "$addBooking",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_163));
        let __VLS_167;
        const __VLS_168 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_165;
        var __VLS_166;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_158;
}
let __VLS_169;
vSpacer;
const __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({}));
const __VLS_171 = __VLS_170({}, ...__VLS_functionalComponentArgsRest(__VLS_170));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_174;
    vTooltip;
    const __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
        text: (__VLS_ctx.t('views.headerBar.addBookingType')),
        location: "top",
    }));
    const __VLS_176 = __VLS_175({
        text: (__VLS_ctx.t('views.headerBar.addBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_175));
    const { default: __VLS_179 } = __VLS_177.slots;
    {
        const { activator: __VLS_180 } = __VLS_177.slots;
        const [{ props }] = __VLS_vSlot(__VLS_180);
        let __VLS_181;
        vAppBarNavIcon;
        const __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181({
            ...{ 'onClick': {} },
            id: "addBookingType",
            icon: "$addBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_183 = __VLS_182({
            ...{ 'onClick': {} },
            id: "addBookingType",
            icon: "$addBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_182));
        let __VLS_186;
        const __VLS_187 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_184;
        var __VLS_185;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_177;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_188;
    vTooltip;
    const __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({
        text: (__VLS_ctx.t('views.headerBar.updateBookingType')),
        location: "top",
    }));
    const __VLS_190 = __VLS_189({
        text: (__VLS_ctx.t('views.headerBar.updateBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
    const { default: __VLS_193 } = __VLS_191.slots;
    {
        const { activator: __VLS_194 } = __VLS_191.slots;
        const [{ props }] = __VLS_vSlot(__VLS_194);
        let __VLS_195;
        vAppBarNavIcon;
        const __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195({
            ...{ 'onClick': {} },
            id: "updateBookingType",
            icon: "$updateBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_197 = __VLS_196({
            ...{ 'onClick': {} },
            id: "updateBookingType",
            icon: "$updateBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_196));
        let __VLS_200;
        const __VLS_201 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_198;
        var __VLS_199;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_191;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_202;
    vTooltip;
    const __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
        text: (__VLS_ctx.t('views.headerBar.deleteBookingType')),
        location: "top",
    }));
    const __VLS_204 = __VLS_203({
        text: (__VLS_ctx.t('views.headerBar.deleteBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_203));
    const { default: __VLS_207 } = __VLS_205.slots;
    {
        const { activator: __VLS_208 } = __VLS_205.slots;
        const [{ props }] = __VLS_vSlot(__VLS_208);
        let __VLS_209;
        vAppBarNavIcon;
        const __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209({
            ...{ 'onClick': {} },
            id: "deleteBookingType",
            icon: "$deleteBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_211 = __VLS_210({
            ...{ 'onClick': {} },
            id: "deleteBookingType",
            icon: "$deleteBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_210));
        let __VLS_214;
        const __VLS_215 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_212;
        var __VLS_213;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_205;
}
let __VLS_216;
vSpacer;
const __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({}));
const __VLS_218 = __VLS_217({}, ...__VLS_functionalComponentArgsRest(__VLS_217));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_221;
    vTooltip;
    const __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
        text: (__VLS_ctx.t('views.headerBar.exportToFile')),
        location: "top",
    }));
    const __VLS_223 = __VLS_222({
        text: (__VLS_ctx.t('views.headerBar.exportToFile')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_222));
    const { default: __VLS_226 } = __VLS_224.slots;
    {
        const { activator: __VLS_227 } = __VLS_224.slots;
        const [{ props }] = __VLS_vSlot(__VLS_227);
        let __VLS_228;
        vAppBarNavIcon;
        const __VLS_229 = __VLS_asFunctionalComponent1(__VLS_228, new __VLS_228({
            ...{ 'onClick': {} },
            id: "exportDatabase",
            icon: "$exportToFile",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_230 = __VLS_229({
            ...{ 'onClick': {} },
            id: "exportDatabase",
            icon: "$exportToFile",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_229));
        let __VLS_233;
        const __VLS_234 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_231;
        var __VLS_232;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_224;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_235;
    vTooltip;
    const __VLS_236 = __VLS_asFunctionalComponent1(__VLS_235, new __VLS_235({
        text: (__VLS_ctx.t('views.headerBar.importDatabase')),
        location: "top",
    }));
    const __VLS_237 = __VLS_236({
        text: (__VLS_ctx.t('views.headerBar.importDatabase')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_236));
    const { default: __VLS_240 } = __VLS_238.slots;
    {
        const { activator: __VLS_241 } = __VLS_238.slots;
        const [{ props }] = __VLS_vSlot(__VLS_241);
        let __VLS_242;
        vAppBarNavIcon;
        const __VLS_243 = __VLS_asFunctionalComponent1(__VLS_242, new __VLS_242({
            ...{ 'onClick': {} },
            id: "importDatabase",
            icon: "$importDatabase",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_244 = __VLS_243({
            ...{ 'onClick': {} },
            id: "importDatabase",
            icon: "$importDatabase",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_243));
        let __VLS_247;
        const __VLS_248 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_245;
        var __VLS_246;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_238;
}
let __VLS_249;
vSpacer;
const __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249({}));
const __VLS_251 = __VLS_250({}, ...__VLS_functionalComponentArgsRest(__VLS_250));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.VIEW_CODES.COMPANY)) {
    let __VLS_254;
    vTooltip;
    const __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254({
        text: (__VLS_ctx.t('views.headerBar.showAccounting')),
        location: "top",
    }));
    const __VLS_256 = __VLS_255({
        text: (__VLS_ctx.t('views.headerBar.showAccounting')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_255));
    const { default: __VLS_259 } = __VLS_257.slots;
    {
        const { activator: __VLS_260 } = __VLS_257.slots;
        const [{ props }] = __VLS_vSlot(__VLS_260);
        let __VLS_261;
        vAppBarNavIcon;
        const __VLS_262 = __VLS_asFunctionalComponent1(__VLS_261, new __VLS_261({
            ...{ 'onClick': {} },
            id: "showAccounting",
            icon: "$showAccounting",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_263 = __VLS_262({
            ...{ 'onClick': {} },
            id: "showAccounting",
            icon: "$showAccounting",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_262));
        let __VLS_266;
        const __VLS_267 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        var __VLS_264;
        var __VLS_265;
        [onIconClick, t, runtime, VIEW_CODES,];
    }
    [];
    var __VLS_257;
}
let __VLS_268;
vSpacer;
const __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268({}));
const __VLS_270 = __VLS_269({}, ...__VLS_functionalComponentArgsRest(__VLS_269));
let __VLS_273;
vTooltip;
const __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({
    text: (__VLS_ctx.t('views.headerBar.settings')),
    location: "top",
}));
const __VLS_275 = __VLS_274({
    text: (__VLS_ctx.t('views.headerBar.settings')),
    location: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_274));
const { default: __VLS_278 } = __VLS_276.slots;
{
    const { activator: __VLS_279 } = __VLS_276.slots;
    const [{ props }] = __VLS_vSlot(__VLS_279);
    let __VLS_280;
    vAppBarNavIcon;
    const __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
        ...{ 'onClick': {} },
        id: "setting",
        color: "grey",
        icon: "$settings",
        size: "large",
        ...(props),
        variant: "tonal",
    }));
    const __VLS_282 = __VLS_281({
        ...{ 'onClick': {} },
        id: "setting",
        color: "grey",
        icon: "$settings",
        size: "large",
        ...(props),
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_281));
    let __VLS_285;
    const __VLS_286 = ({ click: {} },
        { onClick: (__VLS_ctx.onIconClick) });
    var __VLS_283;
    var __VLS_284;
    [onIconClick, t,];
}
[];
var __VLS_276;
let __VLS_287;
vSpacer;
const __VLS_288 = __VLS_asFunctionalComponent1(__VLS_287, new __VLS_287({}));
const __VLS_289 = __VLS_288({}, ...__VLS_functionalComponentArgsRest(__VLS_288));
[];
var __VLS_3;
const __VLS_292 = DialogPort;
const __VLS_293 = __VLS_asFunctionalComponent1(__VLS_292, new __VLS_292({}));
const __VLS_294 = __VLS_293({}, ...__VLS_functionalComponentArgsRest(__VLS_293));
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
