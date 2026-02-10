import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useRuntimeStore } from "@/stores/runtime";
import { useRecordsStore } from "@/stores/records";
import { useAlert } from "@/composables/useAlert";
import { DomainUtils } from "@/domains/utils";
import { useBrowser } from "@/composables/useBrowser";
import DialogPort from "@/components/DialogPort.vue";
import { CODES } from "@/config/codes";
const { t } = useI18n();
const { handleUserNotice, openOptionsPage } = useBrowser();
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
            await handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            await handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            await handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            await handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            await handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            void handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            void handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            void handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
            void handleUserNotice(t("views.headerBar.infoTitle"), "HeaderBar");
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
        runtime.setCurrentView(CODES.VIEW_CODES.HOME);
    },
    company: () => {
        runtime.setCurrentView(CODES.VIEW_CODES.COMPANY);
    },
    setting: async () => {
        await openOptionsPage();
    }
};
const dialogValidations = {
    updateAccount: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.noAccount")));
            return false;
        }
        return true;
    },
    fadeInStock: async () => {
        if (records.stocks.passive.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("components.dialogs.fadeInStock.messages.noRecords")));
            return false;
        }
        return true;
    },
    deleteAccountConfirmation: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.noAccount")));
            return false;
        }
        return true;
    },
    addBookingType: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.createAccount")));
            return false;
        }
        return true;
    },
    updateBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.noBookingTypes")));
            return false;
        }
        return true;
    },
    deleteBookingType: async () => {
        if (bookingTypeItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.noBookingTypes")));
            return false;
        }
        return true;
    },
    addBooking: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.createAccount")));
            return false;
        }
        return true;
    },
    exportDatabase: async () => {
        if (accountItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.nothingToExport")));
            return false;
        }
        return true;
    },
    showAccounting: async () => {
        if (bookingItems.value.length === 0) {
            await handleUserInfo(t("views.headerBar.infoTitle"), new Error(t("views.headerBar.messages.noBookings")));
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
    flat: true,
    height: "75",
}));
const __VLS_2 = __VLS_1({
    app: true,
    flat: true,
    height: "75",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
const __VLS_5 = {}.VSpacer;
;
VSpacer;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_10 = {}.RouterLink;
;
RouterLink;
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    ...{ 'onClick': {} },
    id: "home",
    ...{ class: "router-link-active" },
    to: "/",
}));
const __VLS_12 = __VLS_11({
    ...{ 'onClick': {} },
    id: "home",
    ...{ class: "router-link-active" },
    to: "/",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_14;
let __VLS_15;
const __VLS_16 = ({ click: {} },
    { onClick: (__VLS_ctx.onIconClick) });
const { default: __VLS_17 } = __VLS_13.slots;
[onIconClick,];
const __VLS_18 = {}.VTooltip;
;
VTooltip;
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    text: (__VLS_ctx.t('views.headerBar.home')),
    location: "top",
}));
const __VLS_20 = __VLS_19({
    text: (__VLS_ctx.t('views.headerBar.home')),
    location: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_22 } = __VLS_21.slots;
[t,];
{
    const { activator: __VLS_23 } = __VLS_21.slots;
    const [{ props }] = __VLS_getSlotParameters(__VLS_23);
    const __VLS_24 = {}.VAppBarNavIcon;
    ;
    VAppBarNavIcon;
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        color: "grey",
        icon: "$home",
        size: "large",
        ...(props),
        variant: "tonal",
    }));
    const __VLS_26 = __VLS_25({
        color: "grey",
        icon: "$home",
        size: "large",
        ...(props),
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
var __VLS_21;
var __VLS_13;
if (__VLS_ctx.records.accounts.isDepot) {
    [records,];
    const __VLS_29 = {}.RouterLink;
    ;
    RouterLink;
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        ...{ 'onClick': {} },
        id: "company",
        ...{ class: "router-link-active" },
        to: "/company",
    }));
    const __VLS_31 = __VLS_30({
        ...{ 'onClick': {} },
        id: "company",
        ...{ class: "router-link-active" },
        to: "/company",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = ({ click: {} },
        { onClick: (__VLS_ctx.onIconClick) });
    const { default: __VLS_36 } = __VLS_32.slots;
    [onIconClick,];
    const __VLS_37 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        text: (__VLS_ctx.t('views.headerBar.company')),
        location: "top",
    }));
    const __VLS_39 = __VLS_38({
        text: (__VLS_ctx.t('views.headerBar.company')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    const { default: __VLS_41 } = __VLS_40.slots;
    [t,];
    {
        const { activator: __VLS_42 } = __VLS_40.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_42);
        const __VLS_43 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            color: "grey",
            icon: "$showCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_45 = __VLS_44({
            color: "grey",
            icon: "$showCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    }
    var __VLS_40;
    var __VLS_32;
}
const __VLS_48 = {}.VSpacer;
;
VSpacer;
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({}));
const __VLS_50 = __VLS_49({}, ...__VLS_functionalComponentArgsRest(__VLS_49));
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY) {
    [runtime, CODES,];
    const __VLS_53 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        text: (__VLS_ctx.t('views.headerBar.updateQuote')),
        location: "top",
    }));
    const __VLS_55 = __VLS_54({
        text: (__VLS_ctx.t('views.headerBar.updateQuote')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    const { default: __VLS_57 } = __VLS_56.slots;
    [t,];
    {
        const { activator: __VLS_58 } = __VLS_56.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_58);
        const __VLS_59 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
            ...{ 'onClick': {} },
            id: "updateQuote",
            icon: "$reload",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_61 = __VLS_60({
            ...{ 'onClick': {} },
            id: "updateQuote",
            icon: "$reload",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_60));
        let __VLS_63;
        let __VLS_64;
        const __VLS_65 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_62;
    }
    var __VLS_56;
}
const __VLS_67 = {}.VSpacer;
;
VSpacer;
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({}));
const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY) {
    [runtime, CODES,];
    const __VLS_72 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        text: (__VLS_ctx.t('views.headerBar.addStock')),
        location: "top",
    }));
    const __VLS_74 = __VLS_73({
        text: (__VLS_ctx.t('views.headerBar.addStock')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const { default: __VLS_76 } = __VLS_75.slots;
    [t,];
    {
        const { activator: __VLS_77 } = __VLS_75.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_77);
        const __VLS_78 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
            ...{ 'onClick': {} },
            id: "addStock",
            icon: "$addCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_80 = __VLS_79({
            ...{ 'onClick': {} },
            id: "addStock",
            icon: "$addCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_79));
        let __VLS_82;
        let __VLS_83;
        const __VLS_84 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_81;
    }
    var __VLS_75;
}
if (__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY) {
    [runtime, CODES,];
    const __VLS_86 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_87 = __VLS_asFunctionalComponent(__VLS_86, new __VLS_86({
        text: (__VLS_ctx.t('views.headerBar.fadeInStock')),
        location: "top",
    }));
    const __VLS_88 = __VLS_87({
        text: (__VLS_ctx.t('views.headerBar.fadeInStock')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    const { default: __VLS_90 } = __VLS_89.slots;
    [t,];
    {
        const { activator: __VLS_91 } = __VLS_89.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_91);
        const __VLS_92 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
            ...{ 'onClick': {} },
            id: "fadeInStock",
            icon: "$fadeInCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_94 = __VLS_93({
            ...{ 'onClick': {} },
            id: "fadeInStock",
            icon: "$fadeInCompany",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        let __VLS_96;
        let __VLS_97;
        const __VLS_98 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_95;
    }
    var __VLS_89;
}
const __VLS_100 = {}.VSpacer;
;
VSpacer;
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({}));
const __VLS_102 = __VLS_101({}, ...__VLS_functionalComponentArgsRest(__VLS_101));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_105 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        text: (__VLS_ctx.t('views.headerBar.addAccount')),
        location: "top",
    }));
    const __VLS_107 = __VLS_106({
        text: (__VLS_ctx.t('views.headerBar.addAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    const { default: __VLS_109 } = __VLS_108.slots;
    [t,];
    {
        const { activator: __VLS_110 } = __VLS_108.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_110);
        const __VLS_111 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
            ...{ 'onClick': {} },
            id: "addAccount",
            icon: "$addAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_113 = __VLS_112({
            ...{ 'onClick': {} },
            id: "addAccount",
            icon: "$addAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_112));
        let __VLS_115;
        let __VLS_116;
        const __VLS_117 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_114;
    }
    var __VLS_108;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_119 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
        text: (__VLS_ctx.t('views.headerBar.updateAccount')),
        location: "top",
    }));
    const __VLS_121 = __VLS_120({
        text: (__VLS_ctx.t('views.headerBar.updateAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_120));
    const { default: __VLS_123 } = __VLS_122.slots;
    [t,];
    {
        const { activator: __VLS_124 } = __VLS_122.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_124);
        const __VLS_125 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_126 = __VLS_asFunctionalComponent(__VLS_125, new __VLS_125({
            ...{ 'onClick': {} },
            id: "updateAccount",
            icon: "$updateAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_127 = __VLS_126({
            ...{ 'onClick': {} },
            id: "updateAccount",
            icon: "$updateAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_126));
        let __VLS_129;
        let __VLS_130;
        const __VLS_131 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_128;
    }
    var __VLS_122;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_133 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
        text: (__VLS_ctx.t('views.headerBar.deleteAccount')),
        location: "top",
    }));
    const __VLS_135 = __VLS_134({
        text: (__VLS_ctx.t('views.headerBar.deleteAccount')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_134));
    const { default: __VLS_137 } = __VLS_136.slots;
    [t,];
    {
        const { activator: __VLS_138 } = __VLS_136.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_138);
        const __VLS_139 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({
            ...{ 'onClick': {} },
            id: "deleteAccountConfirmation",
            icon: "$deleteAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_141 = __VLS_140({
            ...{ 'onClick': {} },
            id: "deleteAccountConfirmation",
            icon: "$deleteAccount",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_140));
        let __VLS_143;
        let __VLS_144;
        const __VLS_145 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_142;
    }
    var __VLS_136;
}
const __VLS_147 = {}.VSpacer;
;
VSpacer;
const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({}));
const __VLS_149 = __VLS_148({}, ...__VLS_functionalComponentArgsRest(__VLS_148));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_152 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        text: (__VLS_ctx.t('views.headerBar.addBooking')),
        location: "top",
    }));
    const __VLS_154 = __VLS_153({
        text: (__VLS_ctx.t('views.headerBar.addBooking')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    const { default: __VLS_156 } = __VLS_155.slots;
    [t,];
    {
        const { activator: __VLS_157 } = __VLS_155.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_157);
        const __VLS_158 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_159 = __VLS_asFunctionalComponent(__VLS_158, new __VLS_158({
            ...{ 'onClick': {} },
            id: "addBooking",
            icon: "$addBooking",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_160 = __VLS_159({
            ...{ 'onClick': {} },
            id: "addBooking",
            icon: "$addBooking",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_159));
        let __VLS_162;
        let __VLS_163;
        const __VLS_164 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_161;
    }
    var __VLS_155;
}
const __VLS_166 = {}.VSpacer;
;
VSpacer;
const __VLS_167 = __VLS_asFunctionalComponent(__VLS_166, new __VLS_166({}));
const __VLS_168 = __VLS_167({}, ...__VLS_functionalComponentArgsRest(__VLS_167));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_171 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
        text: (__VLS_ctx.t('views.headerBar.addBookingType')),
        location: "top",
    }));
    const __VLS_173 = __VLS_172({
        text: (__VLS_ctx.t('views.headerBar.addBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_172));
    const { default: __VLS_175 } = __VLS_174.slots;
    [t,];
    {
        const { activator: __VLS_176 } = __VLS_174.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_176);
        const __VLS_177 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_178 = __VLS_asFunctionalComponent(__VLS_177, new __VLS_177({
            ...{ 'onClick': {} },
            id: "addBookingType",
            icon: "$addBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_179 = __VLS_178({
            ...{ 'onClick': {} },
            id: "addBookingType",
            icon: "$addBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_178));
        let __VLS_181;
        let __VLS_182;
        const __VLS_183 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_180;
    }
    var __VLS_174;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_185 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_186 = __VLS_asFunctionalComponent(__VLS_185, new __VLS_185({
        text: (__VLS_ctx.t('views.headerBar.updateBookingType')),
        location: "top",
    }));
    const __VLS_187 = __VLS_186({
        text: (__VLS_ctx.t('views.headerBar.updateBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_186));
    const { default: __VLS_189 } = __VLS_188.slots;
    [t,];
    {
        const { activator: __VLS_190 } = __VLS_188.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_190);
        const __VLS_191 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_192 = __VLS_asFunctionalComponent(__VLS_191, new __VLS_191({
            ...{ 'onClick': {} },
            id: "updateBookingType",
            icon: "$updateBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_193 = __VLS_192({
            ...{ 'onClick': {} },
            id: "updateBookingType",
            icon: "$updateBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_192));
        let __VLS_195;
        let __VLS_196;
        const __VLS_197 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_194;
    }
    var __VLS_188;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_199 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_200 = __VLS_asFunctionalComponent(__VLS_199, new __VLS_199({
        text: (__VLS_ctx.t('views.headerBar.deleteBookingType')),
        location: "top",
    }));
    const __VLS_201 = __VLS_200({
        text: (__VLS_ctx.t('views.headerBar.deleteBookingType')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_200));
    const { default: __VLS_203 } = __VLS_202.slots;
    [t,];
    {
        const { activator: __VLS_204 } = __VLS_202.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_204);
        const __VLS_205 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_206 = __VLS_asFunctionalComponent(__VLS_205, new __VLS_205({
            ...{ 'onClick': {} },
            id: "deleteBookingType",
            icon: "$deleteBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_207 = __VLS_206({
            ...{ 'onClick': {} },
            id: "deleteBookingType",
            icon: "$deleteBookingType",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_206));
        let __VLS_209;
        let __VLS_210;
        const __VLS_211 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_208;
    }
    var __VLS_202;
}
const __VLS_213 = {}.VSpacer;
;
VSpacer;
const __VLS_214 = __VLS_asFunctionalComponent(__VLS_213, new __VLS_213({}));
const __VLS_215 = __VLS_214({}, ...__VLS_functionalComponentArgsRest(__VLS_214));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_218 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_219 = __VLS_asFunctionalComponent(__VLS_218, new __VLS_218({
        text: (__VLS_ctx.t('views.headerBar.exportToFile')),
        location: "top",
    }));
    const __VLS_220 = __VLS_219({
        text: (__VLS_ctx.t('views.headerBar.exportToFile')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_219));
    const { default: __VLS_222 } = __VLS_221.slots;
    [t,];
    {
        const { activator: __VLS_223 } = __VLS_221.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_223);
        const __VLS_224 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
            ...{ 'onClick': {} },
            id: "exportDatabase",
            icon: "$exportToFile",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_226 = __VLS_225({
            ...{ 'onClick': {} },
            id: "exportDatabase",
            icon: "$exportToFile",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_225));
        let __VLS_228;
        let __VLS_229;
        const __VLS_230 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_227;
    }
    var __VLS_221;
}
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_232 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
        text: (__VLS_ctx.t('views.headerBar.importDatabase')),
        location: "top",
    }));
    const __VLS_234 = __VLS_233({
        text: (__VLS_ctx.t('views.headerBar.importDatabase')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_233));
    const { default: __VLS_236 } = __VLS_235.slots;
    [t,];
    {
        const { activator: __VLS_237 } = __VLS_235.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_237);
        const __VLS_238 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_239 = __VLS_asFunctionalComponent(__VLS_238, new __VLS_238({
            ...{ 'onClick': {} },
            id: "importDatabase",
            icon: "$importDatabase",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_240 = __VLS_239({
            ...{ 'onClick': {} },
            id: "importDatabase",
            icon: "$importDatabase",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_239));
        let __VLS_242;
        let __VLS_243;
        const __VLS_244 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_241;
    }
    var __VLS_235;
}
const __VLS_246 = {}.VSpacer;
;
VSpacer;
const __VLS_247 = __VLS_asFunctionalComponent(__VLS_246, new __VLS_246({}));
const __VLS_248 = __VLS_247({}, ...__VLS_functionalComponentArgsRest(__VLS_247));
if (!(__VLS_ctx.runtime.getCurrentView === __VLS_ctx.CODES.VIEW_CODES.COMPANY)) {
    [runtime, CODES,];
    const __VLS_251 = {}.VTooltip;
    ;
    VTooltip;
    const __VLS_252 = __VLS_asFunctionalComponent(__VLS_251, new __VLS_251({
        text: (__VLS_ctx.t('views.headerBar.showAccounting')),
        location: "top",
    }));
    const __VLS_253 = __VLS_252({
        text: (__VLS_ctx.t('views.headerBar.showAccounting')),
        location: "top",
    }, ...__VLS_functionalComponentArgsRest(__VLS_252));
    const { default: __VLS_255 } = __VLS_254.slots;
    [t,];
    {
        const { activator: __VLS_256 } = __VLS_254.slots;
        const [{ props }] = __VLS_getSlotParameters(__VLS_256);
        const __VLS_257 = {}.VAppBarNavIcon;
        ;
        VAppBarNavIcon;
        const __VLS_258 = __VLS_asFunctionalComponent(__VLS_257, new __VLS_257({
            ...{ 'onClick': {} },
            id: "showAccounting",
            icon: "$showAccounting",
            size: "large",
            ...(props),
            variant: "tonal",
        }));
        const __VLS_259 = __VLS_258({
            ...{ 'onClick': {} },
            id: "showAccounting",
            icon: "$showAccounting",
            size: "large",
            ...(props),
            variant: "tonal",
        }, ...__VLS_functionalComponentArgsRest(__VLS_258));
        let __VLS_261;
        let __VLS_262;
        const __VLS_263 = ({ click: {} },
            { onClick: (__VLS_ctx.onIconClick) });
        [onIconClick,];
        var __VLS_260;
    }
    var __VLS_254;
}
const __VLS_265 = {}.VSpacer;
;
VSpacer;
const __VLS_266 = __VLS_asFunctionalComponent(__VLS_265, new __VLS_265({}));
const __VLS_267 = __VLS_266({}, ...__VLS_functionalComponentArgsRest(__VLS_266));
const __VLS_270 = {}.VTooltip;
;
VTooltip;
const __VLS_271 = __VLS_asFunctionalComponent(__VLS_270, new __VLS_270({
    text: (__VLS_ctx.t('views.headerBar.settings')),
    location: "top",
}));
const __VLS_272 = __VLS_271({
    text: (__VLS_ctx.t('views.headerBar.settings')),
    location: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_271));
const { default: __VLS_274 } = __VLS_273.slots;
[t,];
{
    const { activator: __VLS_275 } = __VLS_273.slots;
    const [{ props }] = __VLS_getSlotParameters(__VLS_275);
    const __VLS_276 = {}.VAppBarNavIcon;
    ;
    VAppBarNavIcon;
    const __VLS_277 = __VLS_asFunctionalComponent(__VLS_276, new __VLS_276({
        ...{ 'onClick': {} },
        id: "setting",
        color: "grey",
        icon: "$settings",
        size: "large",
        ...(props),
        variant: "tonal",
    }));
    const __VLS_278 = __VLS_277({
        ...{ 'onClick': {} },
        id: "setting",
        color: "grey",
        icon: "$settings",
        size: "large",
        ...(props),
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_277));
    let __VLS_280;
    let __VLS_281;
    const __VLS_282 = ({ click: {} },
        { onClick: (__VLS_ctx.onIconClick) });
    [onIconClick,];
    var __VLS_279;
}
var __VLS_273;
const __VLS_284 = {}.VSpacer;
;
VSpacer;
const __VLS_285 = __VLS_asFunctionalComponent(__VLS_284, new __VLS_284({}));
const __VLS_286 = __VLS_285({}, ...__VLS_functionalComponentArgsRest(__VLS_285));
var __VLS_3;
;
const __VLS_289 = __VLS_asFunctionalComponent(DialogPort, new DialogPort({}));
const __VLS_290 = __VLS_289({}, ...__VLS_functionalComponentArgsRest(__VLS_289));
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterLink: RouterLink,
            DialogPort: DialogPort,
            CODES: CODES,
            t: t,
            runtime: runtime,
            records: records,
            onIconClick: onIconClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
