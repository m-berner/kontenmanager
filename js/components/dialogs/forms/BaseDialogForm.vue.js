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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VForm;
;
VForm;
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    validateOn: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ submit: {} },
    { onSubmit: () => { } });
;
var __VLS_7 = {};
const { default: __VLS_9 } = __VLS_3.slots;
[formRef,];
if (!__VLS_ctx.hasError) {
    [hasError,];
    if (__VLS_ctx.hasValidationErrors) {
        [hasValidationErrors,];
        const __VLS_10 = {}.VAlert;
        ;
        VAlert;
        const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
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
        let __VLS_14;
        let __VLS_15;
        const __VLS_16 = ({ 'click:close': {} },
            { 'onClick:close': (...[$event]) => {
                    if (!(!__VLS_ctx.hasError))
                        return;
                    if (!(__VLS_ctx.hasValidationErrors))
                        return;
                    __VLS_ctx.validationErrors = [];
                    [validationErrors,];
                } });
        const { default: __VLS_17 } = __VLS_13.slots;
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "text-subtitle-2 mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
            ...{ class: "pl-4" },
        });
        for (const [error, index] of __VLS_getVForSourceType((__VLS_ctx.validationErrors))) {
            [validationErrors,];
            __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
                key: (index),
            });
            (error);
        }
        var __VLS_13;
    }
    var __VLS_18 = {};
}
else {
    const __VLS_20 = {}.VAlert;
    ;
    VAlert;
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        type: "error",
        variant: "tonal",
        ...{ class: "ma-4" },
    }));
    const __VLS_22 = __VLS_21({
        type: "error",
        variant: "tonal",
        ...{ class: "ma-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const { default: __VLS_24 } = __VLS_23.slots;
    var __VLS_23;
}
const __VLS_25 = {}.VOverlay;
;
VOverlay;
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}));
const __VLS_27 = __VLS_26({
    modelValue: (__VLS_ctx.isLoading),
    ...{ class: "align-center justify-center" },
    contained: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
const { default: __VLS_29 } = __VLS_28.slots;
[isLoading,];
const __VLS_30 = {}.VProgressCircular;
;
VProgressCircular;
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    color: "primary",
    indeterminate: true,
    size: "64",
}));
const __VLS_32 = __VLS_31({
    color: "primary",
    indeterminate: true,
    size: "64",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
var __VLS_28;
var __VLS_3;
;
;
;
;
;
;
;
var __VLS_8 = __VLS_7, __VLS_19 = __VLS_18;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isLoading: isLoading,
            formRef: formRef,
            hasError: hasError,
            validationErrors: validationErrors,
            hasValidationErrors: hasValidationErrors,
        };
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default {};
;
