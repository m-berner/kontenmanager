import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAlertStore } from "@/stores/alerts";
import { DomainUtils } from "@/domains/utils";
const alertStore = useAlertStore();
const { dismissAlert, handleConfirm, handleCancel } = alertStore;
const { currentAlert, confirmationDialog, showOverlay, showConfirmation, alertMessage, alertTitle, alertType, pendingCount } = storeToRefs(alertStore);
const confirmationIcon = computed(() => {
    return `$${confirmationDialog.value.type}`;
});
DomainUtils.log("COMPONENTS ALERT_OVERLAY: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VOverlay;
;
VOverlay;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.showOverlay),
    ...{ class: "align-center justify-center" },
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.showOverlay),
    ...{ class: "align-center justify-center" },
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
[showOverlay,];
const __VLS_5 = {}.VCard;
;
VCard;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ class: "mx-auto" },
    maxWidth: "500",
}));
const __VLS_7 = __VLS_6({
    ...{ class: "mx-auto" },
    maxWidth: "500",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_9 } = __VLS_8.slots;
const __VLS_10 = {}.VCardText;
;
VCardText;
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    ...{ class: "pa-6" },
}));
const __VLS_12 = __VLS_11({
    ...{ class: "pa-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_14 } = __VLS_13.slots;
const __VLS_15 = {}.VAlert;
;
VAlert;
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    ...{ 'onClick:close': {} },
    title: (__VLS_ctx.alertTitle),
    type: (__VLS_ctx.alertType),
    closable: true,
    variant: "tonal",
}));
const __VLS_17 = __VLS_16({
    ...{ 'onClick:close': {} },
    title: (__VLS_ctx.alertTitle),
    type: (__VLS_ctx.alertType),
    closable: true,
    variant: "tonal",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_19;
let __VLS_20;
const __VLS_21 = ({ 'click:close': {} },
    { 'onClick:close': (...[$event]) => {
            __VLS_ctx.dismissAlert(__VLS_ctx.currentAlert?.id);
            [alertTitle, alertType, dismissAlert, currentAlert,];
        } });
const { default: __VLS_22 } = __VLS_18.slots;
(__VLS_ctx.alertMessage);
[alertMessage,];
var __VLS_18;
var __VLS_13;
if (__VLS_ctx.pendingCount > 0) {
    [pendingCount,];
    const __VLS_23 = {}.VCardText;
    ;
    VCardText;
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ...{ class: "text-center text-caption pb-4" },
    }));
    const __VLS_25 = __VLS_24({
        ...{ class: "text-center text-caption pb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    const { default: __VLS_27 } = __VLS_26.slots;
    (__VLS_ctx.pendingCount);
    (__VLS_ctx.pendingCount !== 1 ? "s" : "");
    [pendingCount, pendingCount,];
    var __VLS_26;
}
var __VLS_8;
var __VLS_3;
const __VLS_28 = {}.VDialog;
;
VDialog;
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.showConfirmation),
    maxWidth: "500",
    persistent: true,
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.showConfirmation),
    maxWidth: "500",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const { default: __VLS_32 } = __VLS_31.slots;
[showConfirmation,];
const __VLS_33 = {}.VCard;
;
VCard;
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const { default: __VLS_37 } = __VLS_36.slots;
const __VLS_38 = {}.VCardTitle;
;
VCardTitle;
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    ...{ class: "d-flex align-center pa-4" },
}));
const __VLS_40 = __VLS_39({
    ...{ class: "d-flex align-center pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_42 } = __VLS_41.slots;
const __VLS_43 = {}.VIcon;
;
VIcon;
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    icon: (__VLS_ctx.confirmationIcon),
    color: (__VLS_ctx.confirmationDialog.type),
    ...{ class: "mr-3" },
    size: "large",
}));
const __VLS_45 = __VLS_44({
    icon: (__VLS_ctx.confirmationIcon),
    color: (__VLS_ctx.confirmationDialog.type),
    ...{ class: "mr-3" },
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
[confirmationIcon, confirmationDialog,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
(__VLS_ctx.confirmationDialog.title);
[confirmationDialog,];
var __VLS_41;
const __VLS_48 = {}.VCardText;
;
VCardText;
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ class: "pa-4" },
}));
const __VLS_50 = __VLS_49({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const { default: __VLS_52 } = __VLS_51.slots;
(__VLS_ctx.confirmationDialog.message);
[confirmationDialog,];
var __VLS_51;
const __VLS_53 = {}.VCardActions;
;
VCardActions;
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    ...{ class: "pa-4" },
}));
const __VLS_55 = __VLS_54({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const { default: __VLS_57 } = __VLS_56.slots;
const __VLS_58 = {}.VSpacer;
;
VSpacer;
const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({}));
const __VLS_60 = __VLS_59({}, ...__VLS_functionalComponentArgsRest(__VLS_59));
const __VLS_63 = {}.VBtn;
;
VBtn;
const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_65 = __VLS_64({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_64));
let __VLS_67;
let __VLS_68;
const __VLS_69 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCancel) });
const { default: __VLS_70 } = __VLS_66.slots;
[handleCancel,];
(__VLS_ctx.confirmationDialog.cancelText);
[confirmationDialog,];
var __VLS_66;
const __VLS_71 = {}.VBtn;
;
VBtn;
const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
    ...{ 'onClick': {} },
    color: (__VLS_ctx.confirmationDialog.type),
    variant: "elevated",
}));
const __VLS_73 = __VLS_72({
    ...{ 'onClick': {} },
    color: (__VLS_ctx.confirmationDialog.type),
    variant: "elevated",
}, ...__VLS_functionalComponentArgsRest(__VLS_72));
let __VLS_75;
let __VLS_76;
const __VLS_77 = ({ click: {} },
    { onClick: (__VLS_ctx.handleConfirm) });
const { default: __VLS_78 } = __VLS_74.slots;
[confirmationDialog, handleConfirm,];
(__VLS_ctx.confirmationDialog.confirmText);
[confirmationDialog,];
var __VLS_74;
var __VLS_56;
var __VLS_36;
var __VLS_31;
;
;
;
;
;
;
;
;
;
;
;
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            dismissAlert: dismissAlert,
            handleConfirm: handleConfirm,
            handleCancel: handleCancel,
            currentAlert: currentAlert,
            confirmationDialog: confirmationDialog,
            showOverlay: showOverlay,
            showConfirmation: showConfirmation,
            alertMessage: alertMessage,
            alertTitle: alertTitle,
            alertType: alertType,
            pendingCount: pendingCount,
            confirmationIcon: confirmationIcon,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
