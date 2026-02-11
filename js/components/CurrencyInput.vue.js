import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { DomainUtils } from "@/domains/utils";
const props = defineProps();
const emit = defineEmits(["update:modelValue"]);
const { n } = useI18n();
const formattedValue = ref("");
const isFocused = ref(false);
const wrappedRules = computed(() => {
    if (!props.rules)
        return undefined;
    return props.rules.map((rule) => {
        return (v) => {
            const numValue = parseCurrency(v);
            return rule(numValue);
        };
    });
});
watch(() => props.modelValue, (newVal) => {
    if (!isFocused.value) {
        formattedValue.value = formatCurrency(newVal);
    }
});
const formatCurrency = (value) => {
    if (!value || value === 0)
        return "";
    return n(value, "currency");
};
const parseCurrency = (value) => {
    if (!value)
        return 0;
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    const match = normalized.match(/-?\d+(\.\d*)?/);
    return match ? Number.parseFloat(match[0]) : 0;
};
const onFocus = () => {
    isFocused.value = true;
    if (props.modelValue === 0) {
        formattedValue.value = "";
    }
    else {
        formattedValue.value = props.modelValue.toString();
    }
};
const onBlur = () => {
    isFocused.value = false;
    const parsed = parseCurrency(formattedValue.value);
    emit("update:modelValue", parsed);
    formattedValue.value = formatCurrency(parsed);
};
const onInput = (ev) => {
    if (ev.target instanceof HTMLInputElement && isFocused.value) {
        formattedValue.value = ev.target.value.replace(",", ".");
    }
};
onMounted(async () => {
    DomainUtils.log("CURRENCY_INPUT: onMounted");
    formattedValue.value = formatCurrency(props.modelValue);
});
DomainUtils.log("COMPONENTS CurrencyInput: setup");
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
let __VLS_0;
vTextField;
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onBlur': {} },
    ...{ 'onFocus': {} },
    ...{ 'onInput': {} },
    disabled: (props.disabled),
    label: (props.label),
    modelValue: (__VLS_ctx.formattedValue),
    rules: (__VLS_ctx.wrappedRules),
    density: "compact",
    variant: "solo-filled",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onBlur': {} },
    ...{ 'onFocus': {} },
    ...{ 'onInput': {} },
    disabled: (props.disabled),
    label: (props.label),
    modelValue: (__VLS_ctx.formattedValue),
    rules: (__VLS_ctx.wrappedRules),
    density: "compact",
    variant: "solo-filled",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ blur: {} },
    { onBlur: (__VLS_ctx.onBlur) });
const __VLS_7 = ({ focus: {} },
    { onFocus: (__VLS_ctx.onFocus) });
const __VLS_8 = ({ input: {} },
    { onInput: (__VLS_ctx.onInput) });
var __VLS_9 = {};
var __VLS_3;
var __VLS_4;
[formattedValue, wrappedRules, onBlur, onFocus, onInput,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};
