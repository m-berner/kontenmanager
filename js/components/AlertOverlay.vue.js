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
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vOverlay;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.showOverlay),
    ...{ class: "align-center justify-center" },
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.showOverlay),
    ...{ class: "align-center justify-center" },
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
;
;
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
vCard;
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ class: "mx-auto" },
    maxWidth: "500",
}));
const __VLS_8 = __VLS_7({
    ...{ class: "mx-auto" },
    maxWidth: "500",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
;
const { default: __VLS_11 } = __VLS_9.slots;
let __VLS_12;
vCardText;
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ class: "pa-6" },
}));
const __VLS_14 = __VLS_13({
    ...{ class: "pa-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
;
const { default: __VLS_17 } = __VLS_15.slots;
let __VLS_18;
vAlert;
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    ...{ 'onClick:close': {} },
    title: (__VLS_ctx.alertTitle),
    type: (__VLS_ctx.alertType),
    closable: true,
    variant: "tonal",
}));
const __VLS_20 = __VLS_19({
    ...{ 'onClick:close': {} },
    title: (__VLS_ctx.alertTitle),
    type: (__VLS_ctx.alertType),
    closable: true,
    variant: "tonal",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
let __VLS_23;
const __VLS_24 = ({ 'click:close': {} },
    { 'onClick:close': (...[$event]) => {
            __VLS_ctx.dismissAlert(__VLS_ctx.currentAlert?.id);
            [showOverlay, alertTitle, alertType, dismissAlert, currentAlert,];
        } });
const { default: __VLS_25 } = __VLS_21.slots;
(__VLS_ctx.alertMessage);
[alertMessage,];
var __VLS_21;
var __VLS_22;
[];
var __VLS_15;
if (__VLS_ctx.pendingCount > 0) {
    let __VLS_26;
    vCardText;
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        ...{ class: "text-center text-caption pb-4" },
    }));
    const __VLS_28 = __VLS_27({
        ...{ class: "text-center text-caption pb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    ;
    ;
    ;
    const { default: __VLS_31 } = __VLS_29.slots;
    (__VLS_ctx.pendingCount);
    (__VLS_ctx.pendingCount !== 1 ? "s" : "");
    [pendingCount, pendingCount, pendingCount,];
    var __VLS_29;
}
[];
var __VLS_9;
[];
var __VLS_3;
let __VLS_32;
vDialog;
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    modelValue: (__VLS_ctx.showConfirmation),
    maxWidth: "500",
    persistent: true,
}));
const __VLS_34 = __VLS_33({
    modelValue: (__VLS_ctx.showConfirmation),
    maxWidth: "500",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const { default: __VLS_37 } = __VLS_35.slots;
let __VLS_38;
vCard;
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_43 } = __VLS_41.slots;
let __VLS_44;
vCardTitle;
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    ...{ class: "d-flex align-center pa-4" },
}));
const __VLS_46 = __VLS_45({
    ...{ class: "d-flex align-center pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
;
;
;
const { default: __VLS_49 } = __VLS_47.slots;
let __VLS_50;
vIcon;
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    icon: (__VLS_ctx.confirmationIcon),
    color: (__VLS_ctx.confirmationDialog.type),
    ...{ class: "mr-3" },
    size: "large",
}));
const __VLS_52 = __VLS_51({
    icon: (__VLS_ctx.confirmationIcon),
    color: (__VLS_ctx.confirmationDialog.type),
    ...{ class: "mr-3" },
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.confirmationDialog.title);
[showConfirmation, confirmationIcon, confirmationDialog, confirmationDialog,];
var __VLS_47;
let __VLS_55;
vCardText;
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
    ...{ class: "pa-4" },
}));
const __VLS_57 = __VLS_56({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
;
const { default: __VLS_60 } = __VLS_58.slots;
(__VLS_ctx.confirmationDialog.message);
[confirmationDialog,];
var __VLS_58;
let __VLS_61;
vCardActions;
const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
    ...{ class: "pa-4" },
}));
const __VLS_63 = __VLS_62({
    ...{ class: "pa-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
;
const { default: __VLS_66 } = __VLS_64.slots;
let __VLS_67;
vSpacer;
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({}));
const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
let __VLS_72;
vBtn;
const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_74 = __VLS_73({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_77;
const __VLS_78 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCancel) });
const { default: __VLS_79 } = __VLS_75.slots;
(__VLS_ctx.confirmationDialog.cancelText);
[confirmationDialog, handleCancel,];
var __VLS_75;
var __VLS_76;
let __VLS_80;
vBtn;
const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
    ...{ 'onClick': {} },
    color: (__VLS_ctx.confirmationDialog.type),
    variant: "elevated",
}));
const __VLS_82 = __VLS_81({
    ...{ 'onClick': {} },
    color: (__VLS_ctx.confirmationDialog.type),
    variant: "elevated",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_85;
const __VLS_86 = ({ click: {} },
    { onClick: (__VLS_ctx.handleConfirm) });
const { default: __VLS_87 } = __VLS_83.slots;
(__VLS_ctx.confirmationDialog.confirmText);
[confirmationDialog, confirmationDialog, handleConfirm,];
var __VLS_83;
var __VLS_84;
[];
var __VLS_64;
[];
var __VLS_41;
[];
var __VLS_35;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
