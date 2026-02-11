import { useI18n } from "vue-i18n";
import { computed } from "vue";
import CurrencyInput from "@/components/CurrencyInput.vue";
import { DomainUtils } from "@/domains/utils";
const props = defineProps();
const emit = defineEmits(["update:modelValue"]);
const { t } = useI18n();
const creditValue = computed({
    get: () => props.modelValue.credit,
    set: (val) => {
        emit("update:modelValue", {
            credit: val,
            debit: props.modelValue.debit
        });
    }
});
const debitValue = computed({
    get: () => props.modelValue.debit,
    set: (val) => {
        emit("update:modelValue", {
            credit: props.modelValue.credit,
            debit: val
        });
    }
});
const cRules = computed(() => props.rules[0](props.modelValue.debit));
const dRules = computed(() => props.rules[1](props.modelValue.credit));
DomainUtils.log("COMPONENTS CreditDebitFieldset: setup");
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
;
;
__VLS_asFunctionalElement1(__VLS_intrinsics.fieldset, __VLS_intrinsics.fieldset)({
    ...{ class: "horizontal-fieldset" },
});
;
__VLS_asFunctionalElement1(__VLS_intrinsics.legend, __VLS_intrinsics.legend)({});
(props.legend);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "fields-container" },
});
;
const __VLS_0 = CurrencyInput;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.creditValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.creditLabel')),
    rules: (__VLS_ctx.cRules),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.creditValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.creditLabel')),
    rules: (__VLS_ctx.cRules),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = CurrencyInput;
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    modelValue: (__VLS_ctx.debitValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.debitLabel')),
    rules: (__VLS_ctx.dRules),
}));
const __VLS_7 = __VLS_6({
    modelValue: (__VLS_ctx.debitValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.debitLabel')),
    rules: (__VLS_ctx.dRules),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
[creditValue, t, t, cRules, debitValue, dRules,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};
