import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRuntimeStore } from "@/stores/runtime";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { DomainUtils } from "@/domains/utils";
const { t } = useI18n();
const runtime = useRuntimeStore();
const { isLoading } = useDialogGuards();
const dialogRef = ref();
DomainUtils.log("COMPONENTS DialogPort: setup");
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.Teleport;
;
Teleport;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
const __VLS_5 = {}.VDialog;
;
VDialog;
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    modelValue: (__VLS_ctx.runtime.dialogVisibility),
    persistent: (true),
    width: "500",
}));
const __VLS_7 = __VLS_6({
    modelValue: (__VLS_ctx.runtime.dialogVisibility),
    persistent: (true),
    width: "500",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_9 = {};
const { default: __VLS_10 } = __VLS_8.slots;
[runtime,];
const __VLS_11 = {}.VCard;
;
VCard;
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_15 } = __VLS_14.slots;
const __VLS_16 = {}.VCardTitle;
;
VCardTitle;
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ class: "text-center" },
}));
const __VLS_18 = __VLS_17({
    ...{ class: "text-center" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_20 } = __VLS_19.slots;
(__VLS_ctx.dialogRef?.title);
[dialogRef,];
var __VLS_19;
const __VLS_21 = {}.VCardText;
;
VCardText;
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    ...{ class: "pa-5" },
}));
const __VLS_23 = __VLS_22({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
const { default: __VLS_25 } = __VLS_24.slots;
const __VLS_26 = ((__VLS_ctx.runtime.dialogName));
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    ref: "dialogRef",
}));
const __VLS_28 = __VLS_27({
    ref: "dialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
;
var __VLS_30 = {};
[runtime, dialogRef,];
var __VLS_29;
var __VLS_24;
const __VLS_33 = {}.VCardActions;
;
VCardActions;
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ class: "pa-5" },
}));
const __VLS_35 = __VLS_34({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const { default: __VLS_37 } = __VLS_36.slots;
const __VLS_38 = {}.VTooltip;
;
VTooltip;
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    text: (__VLS_ctx.t('components.dialogs.ok')),
    location: "bottom",
}));
const __VLS_40 = __VLS_39({
    text: (__VLS_ctx.t('components.dialogs.ok')),
    location: "bottom",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
const { default: __VLS_42 } = __VLS_41.slots;
[t,];
{
    const { activator: __VLS_43 } = __VLS_41.slots;
    const [{ props }] = __VLS_getSlotParameters(__VLS_43);
    if (__VLS_ctx.runtime.dialogOk) {
        [runtime,];
        const __VLS_44 = {}.VBtn;
        ;
        VBtn;
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            ...{ 'onClick': {} },
            disabled: (__VLS_ctx.isLoading),
            loading: (__VLS_ctx.isLoading),
            ...{ class: "ml-auto" },
            icon: "$check",
            type: "submit",
            ...(props),
            variant: "outlined",
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onClick': {} },
            disabled: (__VLS_ctx.isLoading),
            loading: (__VLS_ctx.isLoading),
            ...{ class: "ml-auto" },
            icon: "$check",
            type: "submit",
            ...(props),
            variant: "outlined",
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_48;
        let __VLS_49;
        const __VLS_50 = ({ click: {} },
            { onClick: (__VLS_ctx.dialogRef?.onClickOk) });
        [dialogRef, isLoading, isLoading,];
        var __VLS_47;
    }
}
var __VLS_41;
const __VLS_52 = {}.VSpacer;
;
VSpacer;
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({}));
const __VLS_54 = __VLS_53({}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_57 = {}.VTooltip;
;
VTooltip;
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    text: (__VLS_ctx.t('components.dialogs.cancel')),
    location: "bottom",
}));
const __VLS_59 = __VLS_58({
    text: (__VLS_ctx.t('components.dialogs.cancel')),
    location: "bottom",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
const { default: __VLS_61 } = __VLS_60.slots;
[t,];
{
    const { activator: __VLS_62 } = __VLS_60.slots;
    const [{ props }] = __VLS_getSlotParameters(__VLS_62);
    const __VLS_63 = {}.VBtn;
    ;
    VBtn;
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        ...{ 'onClick': {} },
        ...{ class: "ml-auto" },
        icon: "$close",
        ...(props),
        variant: "outlined",
    }));
    const __VLS_65 = __VLS_64({
        ...{ 'onClick': {} },
        ...{ class: "ml-auto" },
        icon: "$close",
        ...(props),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    let __VLS_67;
    let __VLS_68;
    const __VLS_69 = ({ click: {} },
        { onClick: (__VLS_ctx.runtime.resetTeleport) });
    [runtime,];
    var __VLS_66;
}
var __VLS_60;
var __VLS_36;
var __VLS_14;
var __VLS_8;
var __VLS_3;
;
;
;
;
;
var __VLS_31 = __VLS_30;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            t: t,
            runtime: runtime,
            isLoading: isLoading,
            dialogRef: dialogRef,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
    },
});
;
