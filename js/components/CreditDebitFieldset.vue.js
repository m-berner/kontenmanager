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
debugger;
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
;
;
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "horizontal-fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.legend, __VLS_elements.legend)({});
(props.legend);
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "fields-container" },
});
;
const __VLS_0 = __VLS_asFunctionalComponent(CurrencyInput, new CurrencyInput({
    modelValue: (__VLS_ctx.creditValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.creditLabel')),
    rules: (__VLS_ctx.cRules),
}));
const __VLS_1 = __VLS_0({
    modelValue: (__VLS_ctx.creditValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.creditLabel')),
    rules: (__VLS_ctx.cRules),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
[creditValue, t, cRules,];
;
const __VLS_4 = __VLS_asFunctionalComponent(CurrencyInput, new CurrencyInput({
    modelValue: (__VLS_ctx.debitValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.debitLabel')),
    rules: (__VLS_ctx.dRules),
}));
const __VLS_5 = __VLS_4({
    modelValue: (__VLS_ctx.debitValue),
    disabled: (props.disabled),
    label: (__VLS_ctx.t('components.creditDebitFieldset.debitLabel')),
    rules: (__VLS_ctx.dRules),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
[t, debitValue, dRules,];
;
;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CurrencyInput: CurrencyInput,
            t: t,
            creditValue: creditValue,
            debitValue: debitValue,
            cRules: cRules,
            dRules: dRules,
        };
    },
    emits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
    },
    emits: {},
    __typeProps: {},
});
;
