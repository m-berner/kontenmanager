import { computed, onErrorCaptured, ref } from "vue";
import { useDialogGuards } from "@/composables/useDialogGuards";
import { useAlertStore } from "@/stores/alerts";
import { DomainUtils } from "@/domains/utils";
const { isLoading } = useDialogGuards();
const alertStore = useAlertStore();
const formRef = ref(null);
const hasError = ref(false);
const validationErrors = ref([]);
onErrorCaptured((err, _instance, info) => {
    DomainUtils.log("BASE_DIALOG_FORM: Error captured", { err, info }, "error");
    hasError.value = true;
    alertStore.error("Dialog Error", err instanceof Error
        ? err.message
        : "An unexpected error occurred in the dialog");
    return false;
});
const hasValidationErrors = computed(() => validationErrors.value.length > 0);
const validateForm = async () => {
    validationErrors.value = [];
    if (!formRef.value)
        return false;
    try {
        const result = formRef.value.validate();
        const valid = result?.valid && !result?.errors?.length;
        if (!valid) {
            validationErrors.value = result
                .errors.map((err) => err)
                .flat()
                .filter(Boolean);
        }
        return valid;
    }
    catch (err) {
        DomainUtils.log("BASE_DIALOG_FORM: Validation error", err, "error");
        return false;
    }
};
const __VLS_exposed = { formRef, validateForm };
defineExpose(__VLS_exposed);
DomainUtils.log("COMPONENTS DIALOGS FORMS BaseDialogForm: setup");
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
vForm;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
if (!__VLS_ctx.hasError) {
    if (__VLS_ctx.hasValidationErrors) {
        let __VLS_10;
        vAlert;
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            ...{ 'onClick:close': {} },
            type: "warning",
            variant: "tonal",
            ...{ class: "ma-4" },
            closable: true,
        }));
        const __VLS_12 = __VLS_11({
            ...{ 'onClick:close': {} },
            type: "warning",
            variant: "tonal",
            ...{ class: "ma-4" },
            closable: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        let __VLS_15;
        const __VLS_16 = ({ 'click:close': {} },
            { 'onClick:close': (...[$event]) => {
                    if (!(!__VLS_ctx.hasError))
                        return;
                    if (!(__VLS_ctx.hasValidationErrors))
                        return;
                    __VLS_ctx.validationErrors = [];
                    [hasError, hasValidationErrors, validationErrors,];
                } });
        ;
        const { default: __VLS_17 } = __VLS_13.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-subtitle-2 mb-2" },
        });
        ;
        ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "pl-4" },
        });
        ;
        for (const [error, index] of __VLS_vFor((__VLS_ctx.validationErrors))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (index),
            });
            (error);
            [validationErrors,];
        }
        [];
        var __VLS_13;
        var __VLS_14;
    }
    var __VLS_18 = {};
}
else {
    let __VLS_20;
    vAlert;
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        type: "error",
        variant: "tonal",
        ...{ class: "ma-4" },
    }));
    const __VLS_22 = __VLS_21({
        type: "error",
        variant: "tonal",
        ...{ class: "ma-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    ;
    const { default: __VLS_25 } = __VLS_23.slots;
    [];
    var __VLS_23;
}
let __VLS_26;
vOverlay;
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_28 = __VLS_27({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
;
;
const { default: __VLS_31 } = __VLS_29.slots;
let __VLS_32;
vProgressCircular;
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_34 = __VLS_33({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
[isLoading,];
var __VLS_29;
[];
var __VLS_3;
var __VLS_4;
var __VLS_8 = __VLS_7, __VLS_19 = __VLS_18;
[];
const __VLS_base = (await import('vue')).defineComponent({
    setup: () => (__VLS_exposed),
});
const __VLS_export = {};
export default {};
