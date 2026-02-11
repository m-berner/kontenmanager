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
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
Teleport;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
vDialog;
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    modelValue: (__VLS_ctx.runtime.dialogVisibility),
    persistent: (true),
    width: "500",
}));
const __VLS_8 = __VLS_7({
    modelValue: (__VLS_ctx.runtime.dialogVisibility),
    persistent: (true),
    width: "500",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
var __VLS_11 = {};
const { default: __VLS_12 } = __VLS_9.slots;
let __VLS_13;
vCard;
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
vCardTitle;
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    ...{ class: "text-center" },
}));
const __VLS_21 = __VLS_20({
    ...{ class: "text-center" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
;
const { default: __VLS_24 } = __VLS_22.slots;
(__VLS_ctx.dialogRef?.title);
[runtime, dialogRef,];
var __VLS_22;
let __VLS_25;
vCardText;
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    ...{ class: "pa-5" },
}));
const __VLS_27 = __VLS_26({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
;
const { default: __VLS_30 } = __VLS_28.slots;
const __VLS_31 = (__VLS_ctx.runtime.dialogName);
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    ref: "dialogRef",
}));
const __VLS_33 = __VLS_32({
    ref: "dialogRef",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
var __VLS_36 = {};
var __VLS_34;
[runtime,];
var __VLS_28;
let __VLS_38;
vCardActions;
const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    ...{ class: "pa-5" },
}));
const __VLS_40 = __VLS_39({
    ...{ class: "pa-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
;
const { default: __VLS_43 } = __VLS_41.slots;
let __VLS_44;
vTooltip;
const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    text: (__VLS_ctx.t('components.dialogs.ok')),
    location: "bottom",
}));
const __VLS_46 = __VLS_45({
    text: (__VLS_ctx.t('components.dialogs.ok')),
    location: "bottom",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const { default: __VLS_49 } = __VLS_47.slots;
{
    const { activator: __VLS_50 } = __VLS_47.slots;
    const [{ props }] = __VLS_vSlot(__VLS_50);
    if (__VLS_ctx.runtime.dialogOk) {
        let __VLS_51;
        vBtn;
        const __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
            ...{ 'onClick': {} },
            disabled: (__VLS_ctx.isLoading),
            loading: (__VLS_ctx.isLoading),
            ...{ class: "ml-auto" },
            icon: "$check",
            type: "submit",
            ...(props),
            variant: "outlined",
        }));
        const __VLS_53 = __VLS_52({
            ...{ 'onClick': {} },
            disabled: (__VLS_ctx.isLoading),
            loading: (__VLS_ctx.isLoading),
            ...{ class: "ml-auto" },
            icon: "$check",
            type: "submit",
            ...(props),
            variant: "outlined",
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        let __VLS_56;
        const __VLS_57 = ({ click: {} },
            { onClick: (__VLS_ctx.dialogRef?.onClickOk) });
        ;
        var __VLS_54;
        var __VLS_55;
    }
    [runtime, dialogRef, t, isLoading, isLoading,];
}
[];
var __VLS_47;
let __VLS_58;
vSpacer;
const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({}));
const __VLS_60 = __VLS_59({}, ...__VLS_functionalComponentArgsRest(__VLS_59));
let __VLS_63;
vTooltip;
const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
    text: (__VLS_ctx.t('components.dialogs.cancel')),
    location: "bottom",
}));
const __VLS_65 = __VLS_64({
    text: (__VLS_ctx.t('components.dialogs.cancel')),
    location: "bottom",
}, ...__VLS_functionalComponentArgsRest(__VLS_64));
const { default: __VLS_68 } = __VLS_66.slots;
{
    const { activator: __VLS_69 } = __VLS_66.slots;
    const [{ props }] = __VLS_vSlot(__VLS_69);
    let __VLS_70;
    vBtn;
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        ...{ 'onClick': {} },
        ...{ class: "ml-auto" },
        icon: "$close",
        ...(props),
        variant: "outlined",
    }));
    const __VLS_72 = __VLS_71({
        ...{ 'onClick': {} },
        ...{ class: "ml-auto" },
        icon: "$close",
        ...(props),
        variant: "outlined",
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    let __VLS_75;
    const __VLS_76 = ({ click: {} },
        { onClick: (__VLS_ctx.runtime.resetTeleport) });
    ;
    var __VLS_73;
    var __VLS_74;
    [runtime, t,];
}
[];
var __VLS_66;
[];
var __VLS_41;
[];
var __VLS_16;
[];
var __VLS_9;
[];
var __VLS_3;
var __VLS_37 = __VLS_36;
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
